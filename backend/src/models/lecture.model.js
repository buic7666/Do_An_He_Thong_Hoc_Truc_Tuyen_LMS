const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * LessonSegment model — các đoạn cắt nhỏ của một `Lesson` (YouTube segment)
 */
const LessonSegment = sequelize.define(
  'LessonSegment',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    lessonId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'lesson_id',
      comment: 'ID lesson mà đoạn này thuộc về',
    },
    startTime: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'start_time',
      comment: 'Thời gian bắt đầu (giây)',
    },
    endTime: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'end_time',
      comment: 'Thời gian kết thúc (giây)',
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Thời lượng (giây)',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tiêu đề ngắn cho đoạn (tuỳ chọn)'
    }
  },
  {
    tableName: 'lesson_segments',
    underscored: true,
    timestamps: true,
  },
);

module.exports = LessonSegment;
