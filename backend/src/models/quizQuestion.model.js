const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizQuestion = sequelize.define(
  'QuizQuestion',
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
    questionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'question_id',
    },
    order: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: 'Question order in quiz',
    },
    points: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
      comment: 'Points for this question',
    },
  },
  {
    tableName: 'quiz_questions',
    underscored: true,
    timestamps: true,
  },
);

module.exports = QuizQuestion;
