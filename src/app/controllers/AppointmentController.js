import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import { startOfHour, isBefore, parseISO, format, subHours } from 'date-fns';
import PT from 'date-fns/locale/pt-BR';

import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      attributes: ['date', 'id'],
      limit: 20,
      offset: ( page - 1 ) * 20,
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'name', 'email'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['url', 'id', 'path'],
          },
        ],
      }],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!isProvider) {
      return res.status(401).json({ error: 'User must be a provider' });
    }

    /*
    * Check past dates
    */
    const startHour = startOfHour(parseISO(date));

    if (isBefore(startHour, new Date())) {
      return res.status(400).json({ error: 'Past dates are not allowed' });
    }

    /*
    * Check availability
    */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: startHour,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: startHour,
    });

    const user = await User.findByPk(req.userId);

    const formattedDate = format(
      startHour,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: PT }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res
        .status(400)
        .json({
          error: "You don't have permission to cancel this appointment."
        });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({ error: 'You can oly cancel appointments 2 hours in advance' });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      text: 'Você tem um novo cancelamento',
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
