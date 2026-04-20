const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lesson = sequelize.define(
  'Lesson',
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'video_url',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    orderIndex: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'order_index',
    },
  },
  {
    tableName: 'lessons',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Lesson;