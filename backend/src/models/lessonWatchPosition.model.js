const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LessonWatchPosition = sequelize.define(
  'LessonWatchPosition',
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
    positionSeconds: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'position_seconds',
      defaultValue: 0,
    },
    lastWatchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_watched_at',
    },
  },
  {
    tableName: 'lesson_watch_positions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'lesson_id'],
      },
    ],
  },
);

module.exports = LessonWatchPosition;