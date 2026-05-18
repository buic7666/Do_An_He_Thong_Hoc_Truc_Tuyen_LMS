const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const result = await sequelize.query('DESCRIBE questions');
    console.log('Questions table columns:');
    result[0].forEach(r => console.log(`  ${r.Field} (${r.Type})`));
    await sequelize.close();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
