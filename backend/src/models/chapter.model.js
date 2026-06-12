const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chapter = sequelize.define(
  'Chapter',
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
      comment: 'Khóa học mà chương này thuộc về',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Tiêu đề chương',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả chương',
    },
    orderIndex: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'order_index',
      defaultValue: 0,
      comment: 'Vị trí chương trong khóa học',
    },
  },
  {
    tableName: 'chapters',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Chapter;
