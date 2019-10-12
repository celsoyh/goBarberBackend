import User from '../models/User';
import bcrypt from 'bcryptjs';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    return res.json({ id, name, email, provider });
  }

  async update(req, res) {
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
