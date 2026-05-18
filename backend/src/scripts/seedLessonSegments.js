/**
 * Script to run migrations and seeds for lesson segments
 * Usage: node src/scripts/seedLessonSegments.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

async function runMigrationAndSeed() {
  try {
    console.log('🔄 Starting migration and seeding process...');

    // Run migration to create table
    const migrationPath = path.join(__dirname, '../../seeds/migration_lesson_segments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Running migration: lesson_segments table...');
    await sequelize.query(migrationSQL);
    console.log('✅ Migration completed');

    // Run seed data
    const seedPath = path.join(__dirname, '../../seeds/seed_lesson_segments.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    console.log('🌱 Seeding lesson_segments data...');
    const seedStatements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of seedStatements) {
      await sequelize.query(statement);
    }

    console.log('✅ Seeding completed');
    console.log('🎉 Migration and seed process finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration/seeding:', error.message);
    process.exit(1);
  }
}

runMigrationAndSeed();
