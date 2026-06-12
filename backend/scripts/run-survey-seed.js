const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');

async function runSeed() {
  try {
    const sqlFile = path.join(__dirname, '../seeds/002_create_survey_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await sequelize.query(statement);
    }

    console.log('✅ Survey tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

runSeed();
