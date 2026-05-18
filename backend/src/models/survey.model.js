const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Survey = sequelize.define(
  'Survey',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_published' },
    isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_anonymous', comment: 'Nếu true, responses không lưu user id' },
    courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'course_id' },
    chapterId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'chapter_id' },
    createdBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'created_by' },
  },
  {
    tableName: 'surveys',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Survey;
