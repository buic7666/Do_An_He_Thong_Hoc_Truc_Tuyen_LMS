const { sequelize } = require('../src/config/database');
const quizService = require('../src/services/quizService');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const quiz = await quizService.getQuizDetail(45);
    const out = quiz.questions.map(q => ({ id: q.id, order: q.QuizQuestion?.order, contentBlocksLen: Array.isArray(q.contentBlocks) ? q.contentBlocks.length : 0, contentBlocks: q.contentBlocks }));
    console.log(JSON.stringify(out, null, 2));
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
