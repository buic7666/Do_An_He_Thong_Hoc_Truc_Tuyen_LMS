const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeacherQuestion = sequelize.define(
  'TeacherQuestion',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    teacherId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'teacher_id',
    },
    testName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'test_name',
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 45,
    },
    passScore: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 70,
      field: 'pass_score',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    optionsJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'options_json',
    },
    correctIndex: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'correct_index',
    },
  },
  {
    tableName: 'teacher_questions',
    underscored: true,
    timestamps: true,
  },
);

module.exports = TeacherQuestion;
