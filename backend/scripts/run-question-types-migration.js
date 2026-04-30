require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');

const migrationPath = path.resolve(__dirname, '../seeds/001_add_question_types_and_student_answers.sql');

const run = async () => {
  try {
    // Sanitize invalid JSON metadata before ALTER TABLE rebuild/check.
    await sequelize.query(
      "UPDATE questions SET metadata = '{}' WHERE metadata IS NULL OR JSON_VALID(metadata) = 0",
    );

    const raw = fs.readFileSync(migrationPath, 'utf8');
    const cleaned = raw
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleaned
      .split(';')
      .map((stmt) => stmt.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await sequelize.query(statement);
      } catch (error) {
        const message = String(error.message || '');
        // Allow rerun if index/column already exists.
        if (
          message.includes('Duplicate key name')
          || message.includes('Duplicate column name')
          || message.includes('already exists')
        ) {
          // continue
        } else {
          throw error;
        }
      }
    }

    console.log(`MIGRATION_OK (${statements.length} statements)`);
  } catch (error) {
    console.error('MIGRATION_ERROR', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
