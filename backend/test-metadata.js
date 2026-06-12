const Sequelize = require('sequelize');
const config = require('./src/config/env.js');

const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
  host: config.DB_HOST,
  dialect: 'mysql',
  logging: false
});

(async () => {
  try {
    const q = await sequelize.query("SELECT id, content, metadata FROM questions WHERE id IN (11, 12, 13) LIMIT 3", { type: Sequelize.QueryTypes.SELECT });
    q.forEach(row => {
      console.log('\n=== Question', row.id, '===');
      console.log('Content:', row.content.substring(0, 50));
      const meta = JSON.parse(row.metadata || '{}');
      console.log('Has contentBlocks:', !!meta.contentBlocks);
      console.log('Metadata keys:', Object.keys(meta));
      if (meta.contentBlocks) {
        console.log('ContentBlocks count:', meta.contentBlocks.length);
        if (meta.contentBlocks.length > 0) {
          console.log('First block:', JSON.stringify(meta.contentBlocks[0], null, 2));
        }
      }
    });
  } catch(e) {
    console.error('Error:', e.message);
  }
  await sequelize.close();
  process.exit(0);
})();
