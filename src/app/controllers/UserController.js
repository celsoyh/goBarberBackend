import User from '../models/User';
import * as Yup from 'yup';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fail' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    return res.json({ id, name, email, provider });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirm_password: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fails' });
    }

    const user = await User.findByPk(req.userId);

    const { name, email, password, confirm_password } = req.body;

    if (email !== user.email) {
      const isEmailValid = await User.findOne({ where: { email } });

      if (isEmailValid)
        return res.status(401).json({ error: 'E-mail already in use' });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id } = await user.update(req.body);

    return res.json({ name, id, email });
  }
}

export default new UserController();
