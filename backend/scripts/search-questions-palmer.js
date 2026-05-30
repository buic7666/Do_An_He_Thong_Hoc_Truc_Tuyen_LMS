const { sequelize } = require('../src/config/database');
const { Question } = require('../src/models');

async function main() {
  try {
    await sequelize.authenticate();
    const rows = await Question.findAll();
    const matches = [];
    for (const r of rows) {
      const p = r.toJSON();
      const meta = typeof p.metadata === 'string' ? p.metadata : JSON.stringify(p.metadata || {});
      if ((p.content && p.content.toLowerCase().includes('palmer')) || (meta && meta.toLowerCase().includes('palmer')) || (meta && meta.includes('palmer-1780108013559'))) {
        matches.push({ id: p.id, content: p.content, metadata: p.metadata });
      }
    }
    console.log(JSON.stringify(matches, null, 2));
    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
