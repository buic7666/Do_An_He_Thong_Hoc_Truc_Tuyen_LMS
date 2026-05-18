/**
 * Migration to remove created_by constraints that shouldn't be there
 */

const migrate = async () => {
  const { sequelize } = require('../config/database');
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('📦 Running constraint cleanup migration...\n');

    // Drop invalid foreign keys
    console.log('1️⃣  Dropping invalid created_by constraints...');
    try {
      await queryInterface.removeConstraint('chapters', 'chapters_ibfk_2');
      console.log('✅ Removed chapters_ibfk_2\n');
    } catch (err) {
      if (err.message.includes('constraint') || err.message.includes('Constraint')) {
        console.log('  ℹ️  Constraint not found, skipping\n');
      } else {
        throw err;
      }
    }

    try {
      await queryInterface.removeConstraint('quizzes', 'quizzes_ibfk_5');
      console.log('✅ Removed quizzes_ibfk_5\n');
    } catch (err) {
      if (err.message.includes('constraint') || err.message.includes('Constraint')) {
        console.log('  ℹ️  Constraint not found, skipping\n');
      } else {
        throw err;
      }
    }

    console.log('✅ Constraint cleanup completed!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  const { sequelize } = require('../config/database');

  (async () => {
    try {
      await migrate();
      await sequelize.close();
      console.log('✅ Migration completed and connection closed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = migrate;
