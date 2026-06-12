/**
 * Migration to add chapter_id to lessons table
 * Also create chapters and lesson_segments tables
 */

const migrate = async () => {
  const { sequelize } = require('../config/database');
  const { DataTypes } = require('sequelize');
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('📦 Running migrations...\n');

    // 1. Create chapters table if not exists
    console.log('1️⃣  Creating chapters table...');
    await queryInterface.createTable('chapters', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      course_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, { 
      charset: 'utf8mb4',
      ifNotExists: true 
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('  ℹ️  chapters table already exists');
      } else {
        throw err;
      }
    });
    console.log('✅ chapters table ready\n');

    // 2. Add chapter_id to lessons table
    console.log('2️⃣  Adding chapter_id to lessons table...');
    try {
      await queryInterface.addColumn('lessons', 'chapter_id', {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'chapters', key: 'id' },
        onDelete: 'SET NULL',
      });
      console.log('✅ column chapter_id added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  ℹ️  chapter_id column already exists\n');
      } else {
        throw err;
      }
    }

    // 3. Create lesson_segments table if not exists
    console.log('3️⃣  Creating lesson_segments table...');
    await queryInterface.createTable('lesson_segments', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      lesson_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'lessons', key: 'id' },
        onDelete: 'CASCADE',
      },
      start_time: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      charset: 'utf8mb4',
      ifNotExists: true
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('  ℹ️  lesson_segments table already exists');
      } else {
        throw err;
      }
    });
    console.log('✅ lesson_segments table ready\n');

    // 4. Add lecture_id, parent_question_id and order_index to questions table
    console.log('4️⃣  Adding hierarchy columns to questions table...');
    try {
      await queryInterface.addColumn('questions', 'lecture_id', {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'lessons', key: 'id' },
        onDelete: 'SET NULL',
      });
      console.log('✅ column lecture_id added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  ℹ️  lecture_id column already exists\n');
      } else {
        throw err;
      }
    }

    try {
      await queryInterface.addColumn('questions', 'parent_question_id', {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'questions', key: 'id' },
        onDelete: 'CASCADE',
      });
      console.log('✅ column parent_question_id added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  ℹ️  parent_question_id column already exists\n');
      } else {
        throw err;
      }
    }

    try {
      await queryInterface.addColumn('questions', 'order_index', {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      });
      console.log('✅ column order_index added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  ℹ️  order_index column already exists\n');
      } else {
        throw err;
      }
    }

    try {
      await queryInterface.changeColumn('questions', 'type', {
        type: DataTypes.ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CLOZE'),
        allowNull: false,
        defaultValue: 'MULTIPLE_CHOICE',
      });
      console.log('✅ question type enum updated\n');
    } catch (err) {
      console.log('  ⚠️  Could not update question type enum automatically:', err.message);
    }

    // 5. Add chapter_id to quizzes table
    console.log('5️⃣  Adding chapter_id to quizzes table...');
    try {
      await queryInterface.addColumn('quizzes', 'chapter_id', {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'chapters', key: 'id' },
        onDelete: 'SET NULL',
      });
      console.log('✅ column chapter_id added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  ℹ️  chapter_id column already exists\n');
      } else {
        throw err;
      }
    }

    console.log('✅ All migrations completed successfully!\n');
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
