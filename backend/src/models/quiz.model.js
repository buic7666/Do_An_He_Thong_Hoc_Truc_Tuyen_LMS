const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define(
  'Quiz',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    courseId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'course_id',
    },
    chapterId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'chapter_id',
      comment: 'Chương mà quiz này thuộc về (tuỳ chọn)',
    },
    lessonId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'lesson_id',
      comment: 'Optional: link quiz to specific lesson',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 45,
      comment: 'Duration in minutes',
    },
    passScore: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 70,
      field: 'pass_score',
      comment: 'Minimum percentage to pass',
    },
    maxAttempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      field: 'max_attempts',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'created_by',
    },
  },
  {
    tableName: 'quizzes',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Quiz;
