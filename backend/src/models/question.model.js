const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define(
  'Question',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung câu hỏi',
    },
    type: {
      type: DataTypes.ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CLOZE'),
      defaultValue: 'MULTIPLE_CHOICE',
      comment: 'Loại câu hỏi: MULTIPLE_CHOICE (trắc nghiệm), TRUE_FALSE (đúng/sai), SHORT_ANSWER (trả lời ngắn), ESSAY (tự luận), CLOZE (câu hỏi bài đọc)',
    },
    difficulty: {
      type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
      defaultValue: 'MEDIUM',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Metadata JSON tuỳ theo type: MULTIPLE_CHOICE={options[], correctIndices[], explanation}, TRUE_FALSE={correctAnswer, explanation}, SHORT_ANSWER={acceptedAnswers[], caseSensitive, fuzzyMatch, explanation}, ESSAY={instructions, rubric[], wordLimit, aiModel}',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
      comment: 'Câu hỏi đã được công khai cho học viên chưa?',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Tags for categorizing questions',
    },
    courseId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'course_id',
    },
    lectureId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'lecture_id',
      comment: 'Bài giảng mà câu hỏi này thuộc về (tuỳ chọn)',
    },
    parentQuestionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'parent_question_id',
      comment: 'Câu hỏi cha nếu đây là câu hỏi con của bài đọc',
    },
    orderIndex: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'order_index',
      comment: 'Thứ tự hiển thị trong nhóm câu hỏi cha',
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'created_by',
    },
  },
  {
    tableName: 'questions',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Question;
