const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SurveyResponse = sequelize.define(
  'SurveyResponse',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    surveyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'survey_id' },
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'user_id' },
    answers: { type: DataTypes.JSON, allowNull: false, comment: 'Record of answers keyed by question id' },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'survey_responses',
    underscored: true,
    timestamps: true,
  },
);

module.exports = SurveyResponse;
