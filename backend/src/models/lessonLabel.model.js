const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LessonLabel = sequelize.define(
  'LessonLabel',
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
    },
    teacherId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'teacher_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    labelType: {
      type: DataTypes.ENUM('note', 'warning', 'tip'),
      allowNull: false,
      defaultValue: 'note',
      field: 'label_type',
    },
  },
  {
    tableName: 'lesson_labels',
    underscored: true,
    timestamps: true,
  },
);

module.exports = LessonLabel;
