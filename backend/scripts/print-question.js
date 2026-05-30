const { sequelize } = require('../src/config/database');
const questionService = require('../src/services/questionService');

async function main() {
  const id = Number(process.argv[2] || 127);
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const q = await questionService.getQuestionById(id);
    if (!q) {
      console.error('Question not found:', id);
      await sequelize.close();
      process.exit(1);
    }

    // Print concise, human-readable summary
    const out = {
      id: q.id,
      questionText: q.questionText || q.content || null,
      options: Array.isArray(q.options) ? q.options : (Array.isArray(q.metadata?.options) ? q.metadata.options : null),
      optionsRich: Array.isArray(q.metadata?.optionsRich) ? q.metadata.optionsRich : null,
      contentBlocks: Array.isArray(q.contentBlocks) ? q.contentBlocks : (Array.isArray(q.metadata?.contentBlocks) ? q.metadata.contentBlocks : null),
      correctIndices: Array.isArray(q.metadata?.correctIndices) ? q.metadata.correctIndices : (Array.isArray(q.correctIndices) ? q.correctIndices : null),
    };

    console.log(JSON.stringify(out, null, 2));
    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
