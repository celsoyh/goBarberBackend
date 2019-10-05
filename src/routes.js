const { Router } = require('express');

const routes = Router();

routes.get('/', (req, res) => {
  return res.json({ message: 'Server Structure working successfully' });
});

module.exports = routes;
