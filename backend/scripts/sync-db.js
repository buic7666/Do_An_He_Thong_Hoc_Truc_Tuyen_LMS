const { sequelize } = require('../src/config/database');

async function syncDatabase() {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ Database synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    process.exit(1);
  }
}

syncDatabase();
