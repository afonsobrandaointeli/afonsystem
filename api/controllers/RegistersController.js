module.exports = {
  create: async function (req, res) {
    try {
      const dadosDaily = req.body;

      if (!dadosDaily.email || !dadosDaily.turma || !dadosDaily.grupo) {
        return res.badRequest('Email, turma e grupo são obrigatórios.');
      }

      const novaDaily = await Register.create(dadosDaily).fetch();
      sails.log('Daily criada:', novaDaily);
      return res.status(201).json({
        message: 'Você submeteu corretamente sua daily',
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  list: async function (req, res) {
    try {
      const registers = await Register.find();
      return res.json(registers);
    } catch (err) {
      return res.serverError(err);
    }
  },
  listDailiesByTurma: async function (req, res) {
    try {
      const result = await sails.sendNativeQuery(`
        SELECT turma, COUNT(*) as dailies_count
        FROM register
        GROUP BY turma
      `);
      const dailiesByTurma = result.rows;
      return res.json(dailiesByTurma);
    } catch (err) {
      return res.serverError(err);
    }
  },
  listDailiesByAluno: async function (req, res) {
    try {
      const { turma } = req.params;
      const result = await sails.sendNativeQuery(`
        SELECT email, COUNT(*) as dailies_count
        FROM register
        WHERE turma = $1
        GROUP BY email
      `, [turma]);
      const dailiesByAluno = result.rows;
      return res.json(dailiesByAluno);
    } catch (err) {
      return res.serverError(err);
    }
  }
};