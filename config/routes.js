module.exports.routes = {
  "/": { view: "pages/register" },
  "/data": { view: "pages/dash" },
  "/charts": { view: "pages/charts" },
  "/commits": { view: "pages/commits" },
  "/prs": { view: "pages/prs" },
  "POST /register": "RegistersController.create",
  "GET /register": "RegistersController.list",
  "GET /listDailiesByTurma": "RegistersController.listDailiesByTurma",
  "GET /listDailiesByAluno/:turma": "RegistersController.listDailiesByAluno",
  "GET /repo_names": "RegistersController.getrepos",
  "GET /getcommits": "RegistersController.getcommits",
  "GET /getprs": "RegistersController.getprs",
};
