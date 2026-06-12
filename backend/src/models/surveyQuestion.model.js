const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SurveyQuestion = sequelize.define(
  'SurveyQuestion',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    surveyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'survey_id' },
    type: { type: DataTypes.ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT'), allowNull: false, defaultValue: 'MULTIPLE_CHOICE' },
    questionText: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: DataTypes.JSON, allowNull: true, comment: 'options array etc' },
    orderIndex: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'order_index' },
  },
  {
    tableName: 'survey_questions',
    underscored: true,
    timestamps: true,
  },
);

module.exports = SurveyQuestion;
