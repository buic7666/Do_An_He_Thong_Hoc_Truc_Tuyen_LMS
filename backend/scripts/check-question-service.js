const { sequelize } = require('../src/config/database');
const questionService = require('../src/services/questionService');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    for (const id of [101, 103, 127]) {
      try {
        const q = await questionService.getQuestionById(id);
        console.log(`Question ${id}: contentBlocksLen=${Array.isArray(q.contentBlocks)?q.contentBlocks.length:0}`);
        console.log(JSON.stringify(q.contentBlocks, null, 2));
      } catch (e) {
        console.error(`Error fetching ${id}:`, e.message || e);
      }
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
