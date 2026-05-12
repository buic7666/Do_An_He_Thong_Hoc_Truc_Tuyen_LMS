const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { env } = require('../src/config/env');

async function runCommentSeed() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
  });

  try {
    console.log('Creating comments table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        courseId INT NOT NULL,
        lessonId INT,
        chapterId INT,
        userId INT NOT NULL,
        content LONGTEXT NOT NULL,
        parentCommentId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_courseId (courseId),
        INDEX idx_lessonId (lessonId),
        INDEX idx_chapterId (chapterId),
        INDEX idx_userId (userId),
        INDEX idx_parentCommentId (parentCommentId)
      )
    `);

    console.log('✅ Comments table created successfully!');
  } catch (error) {
    console.error('❌ Error creating comments table:', error.message);
  } finally {
    await connection.end();
  }
}

runCommentSeed();
