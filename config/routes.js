module.exports.routes = {
  '/': { view: 'pages/register' },
  '/data': { view: 'pages/dash' },
  '/charts': { view: 'pages/charts' },
  'POST /register': 'RegistersController.create',
  'GET /register': 'RegistersController.list',
  'GET /listDailiesByTurma': 'RegistersController.listDailiesByTurma',
  'GET /listDailiesByAluno/:turma': 'RegistersController.listDailiesByAluno'
};
