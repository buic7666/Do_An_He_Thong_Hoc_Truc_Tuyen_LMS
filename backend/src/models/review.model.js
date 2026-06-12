const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define(
  'Review',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'course_id' },
    chapterId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'chapter_id' },
    lessonId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'lesson_id' },
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'reviews',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Review;
