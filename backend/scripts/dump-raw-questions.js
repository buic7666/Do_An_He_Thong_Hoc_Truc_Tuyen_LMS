const { sequelize } = require('../src/config/database');
const { Question } = require('../src/models');

async function main() {
  try {
    await sequelize.authenticate();
    for (const id of [101,103,127]) {
      const q = await Question.findOne({ where: { id } });
      const plain = q.toJSON();
      console.log('---', id);
      console.log('content:', plain.content);
      console.log('metadata raw type:', typeof plain.metadata);
      console.log(JSON.stringify(plain.metadata, null, 2));
    }
    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
