const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define(
  'Question',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung câu hỏi',
    },
    type: {
      type: DataTypes.ENUM('MULTIPLE_CHOICE', 'ESSAY', 'SOURCE_CODE'),
      defaultValue: 'MULTIPLE_CHOICE',
    },
    difficulty: {
      type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
      defaultValue: 'MEDIUM',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Metadata JSON (options, correctIndex, explanation, etc)',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Tags for categorizing questions',
    },
    courseId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'course_id',
    },
    lectureId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'lecture_id',
      comment: 'Bài giảng mà câu hỏi này thuộc về (tuỳ chọn)',
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'created_by',
    },
  },
  {
    tableName: 'questions',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Question;
