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
      allowNull: true,
      field: 'start_time',
      comment: 'Thời gian bắt đầu (giây) - tùy chọn, quản lý ở các content item',
    },
    endTime: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'end_time',
      comment: 'Thời gian kết thúc (giây) - tùy chọn, quản lí ở các content item',
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Thời lượng (giây) - tùy chọn',
    },
    orderIndex: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      field: 'order_index',
      comment: 'Thứ tự hiển thị do giáo viên thiết lập',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tiêu đề ngắn cho đoạn (tuỳ chọn)'
    },
    contentItems: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      field: 'content_items',
      comment: 'Danh sách các phần trong phân đoạn: text, document, question, quiz, videoClip',
    },
  },
  {
    tableName: 'lesson_segments',
    underscored: true,
    timestamps: true,
  },
);

module.exports = LessonSegment;
