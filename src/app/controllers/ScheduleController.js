import User from '../models/User';
import Appointment from '../models/Appointment';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

class ScheduleController {
  async index(req, res) {
    const checkIfProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkIfProvider) {
      return res.status(401).json({ error: 'User is not a provider' });
    }

    const { date } = req.query;

    if (!date) {
      return res.status(401).json({ error: 'Date needs to be informed' });
    }

    const parsedDate = parseISO(date);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      attributes: ['id', 'date', 'user_id', 'provider_id'],
      order: ['date'],
    });

    return res.json(appointments);
  }
}

export default new ScheduleController();
