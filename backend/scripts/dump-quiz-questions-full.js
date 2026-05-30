const { sequelize } = require('../src/config/database');
const quizService = require('../src/services/quizService');

async function main() {
  try {
    await sequelize.authenticate();
    const quiz = await quizService.getQuizDetail(45);
    const out = quiz.questions.map(q => ({ id: q.id, order: q.QuizQuestion?.order, type: q.type, questionText: q.questionText, content: q.content, contentBlocksLen: Array.isArray(q.contentBlocks)?q.contentBlocks.length:0, contentBlocks: q.contentBlocks, optionsLen: Array.isArray(q.options)?q.options.length:0, options: q.options }));
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
