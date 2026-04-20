const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Progress = sequelize.define(
  'Progress',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'user_id',
    },
    lessonId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'lesson_id',
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_completed',
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    tableName: 'progress',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Progress;
