const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * StudentAnswer Model
 * 
 * Lưu trữ từng câu trả lời của học viên khi làm quiz
 * Bao gồm: giá trị trả lời, điểm số, feedback chi tiết
 * 
 * Ví dụ:
 * - MULTIPLE_CHOICE: answerValue = [0, 2], score = 100
 * - TRUE_FALSE: answerValue = true, score = 100
 * - SHORT_ANSWER: answerValue = "Python", score = 100, gradingDetails = {matched: true}
 * - ESSAY: answerValue = "Toàn bộ bài viết...", score = 85, gradingDetails = {criteria: [{name: "Kiến thức", score: 38, feedback: "..."}]}
 */
const StudentAnswer = sequelize.define(
  'StudentAnswer',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    attemptId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'attempt_id',
      comment: 'ID của lần làm quiz (StudentQuizAttempt)',
    },
    questionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'question_id',
      comment: 'ID câu hỏi',
    },
    answerType: {
      type: DataTypes.ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'),
      allowNull: false,
      field: 'answer_type',
      comment: 'Loại câu hỏi (giống như Question.type)',
    },
    answerValue: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'answer_value',
      comment: 'Giá trị trả lời: MULTIPLE_CHOICE={indices: [0,2]}, TRUE_FALSE={value: true}, SHORT_ANSWER={text: "abc"}, ESSAY={text: "bài viết..."}',
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Điểm số (0-100). Null nếu chưa chấm.',
    },
    gradingDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'grading_details',
      comment: 'Chi tiết chấm điểm (thường dùng cho ESSAY): {criteria: [{name, score, feedback}, ...], totalScore}',
    },
    aiFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ai_feedback',
      comment: 'Feedback từ AI (dành cho ESSAY). Null nếu không phải ESSAY.',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    tableName: 'student_answers',
    underscored: true,
    timestamps: true,
  },
);

module.exports = StudentAnswer;
