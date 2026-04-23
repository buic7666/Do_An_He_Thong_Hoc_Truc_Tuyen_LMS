const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentQuizAttempt = sequelize.define(
  'StudentQuizAttempt',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    quizId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'quiz_id',
    },
    studentId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'student_id',
    },
    attemptNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
      field: 'attempt_number',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'started_at',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at',
    },
    totalScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'total_score',
      comment: 'Score in percentage',
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_passed',
    },
    answersJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'answers_json',
      comment: 'JSON object storing {questionId: selectedIndex}',
    },
  },
  {
    tableName: 'student_quiz_attempts',
    underscored: true,
    timestamps: true,
  },
);

module.exports = StudentQuizAttempt;
