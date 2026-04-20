const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeacherInteraction = sequelize.define(
  'TeacherInteraction',
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
    type: {
      type: DataTypes.ENUM('qa', 'review'),
      allowNull: false,
      defaultValue: 'qa',
    },
    userName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'user_name',
    },
    context: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    reply: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    tableName: 'teacher_interactions',
    underscored: true,
    timestamps: true,
  },
);

module.exports = TeacherInteraction;
