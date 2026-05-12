const User = require('./user.model');
const Course = require('./course.model');
const Chapter = require('./chapter.model');
const Lesson = require('./lesson.model');
const LessonSegment = require('./lecture.model');
const Enrollment = require('./enrollment.model');
const Progress = require('./progress.model');
const LessonWatchPosition = require('./lessonWatchPosition.model');
const ContactMessage = require('./contactMessage.model');
const TeacherProfile = require('./teacherProfile.model');
const TeacherQuestion = require('./teacherQuestion.model');
const TeacherInteraction = require('./teacherInteraction.model');
const Question = require('./question.model');
const Quiz = require('./quiz.model');
const QuizQuestion = require('./quizQuestion.model');
const StudentQuizAttempt = require('./studentQuizAttempt.model');
const StudentAnswer = require('./studentAnswer.model');
const Comment = require('./comment.model');

// ===== User & Course Relationships =====
Course.belongsTo(User, {
  as: 'instructor',
  foreignKey: 'instructorId',
});

User.hasMany(Course, {
  as: 'teachingCourses',
  foreignKey: 'instructorId',
});

// ===== Course & Chapter Relationships =====
Course.hasMany(Chapter, {
  as: 'chapters',
  foreignKey: 'courseId',
});

Chapter.belongsTo(Course, {
  as: 'course',
  foreignKey: 'courseId',
});

// ===== Chapter & Lesson Relationships =====
Chapter.hasMany(Lesson, {
  as: 'lessons',
  foreignKey: 'chapterId',
});

Lesson.belongsTo(Chapter, {
  as: 'chapter',
  foreignKey: 'chapterId',
});

// ===== Course & Lesson Relationships (legacy, still keep for compatibility) =====
Course.hasMany(Lesson, {
  as: 'lessons',
  foreignKey: 'courseId',
});

Lesson.belongsTo(Course, {
  as: 'course',
  foreignKey: 'courseId',
});

User.belongsToMany(Course, {
  through: Enrollment,
  as: 'enrolledCourses',
  foreignKey: 'userId',
  otherKey: 'courseId',
});

Course.belongsToMany(User, {
  through: Enrollment,
  as: 'students',
  foreignKey: 'courseId',
  otherKey: 'userId',
});

User.hasMany(Enrollment, {
  as: 'enrollments',
  foreignKey: 'userId',
});

Enrollment.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

Course.hasMany(Enrollment, {
  as: 'enrollments',
  foreignKey: 'courseId',
});

Enrollment.belongsTo(Course, {
  as: 'course',
  foreignKey: 'courseId',
});

User.hasMany(Progress, {
  as: 'progressItems',
  foreignKey: 'userId',
});

Progress.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

Lesson.hasMany(Progress, {
  as: 'progressItems',
  foreignKey: 'lessonId',
});

Progress.belongsTo(Lesson, {
  as: 'lesson',
  foreignKey: 'lessonId',
});

User.hasMany(LessonWatchPosition, {
  as: 'lessonWatchPositions',
  foreignKey: 'userId',
});

LessonWatchPosition.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

Lesson.hasMany(LessonWatchPosition, {
  as: 'watchPositions',
  foreignKey: 'lessonId',
});

LessonWatchPosition.belongsTo(Lesson, {
  as: 'lesson',
  foreignKey: 'lessonId',
});

// Lesson segments (YouTube video slices)
Lesson.hasMany(LessonSegment, {
  as: 'segments',
  foreignKey: 'lessonId',
});

LessonSegment.belongsTo(Lesson, {
  as: 'lesson',
  foreignKey: 'lessonId',
});

// ===== Lesson & Question Relationships =====
Lesson.hasMany(Question, {
  as: 'questions',
  foreignKey: 'lectureId',
});

Question.belongsTo(Lesson, {
  as: 'lecture',
  foreignKey: 'lectureId',
});

User.hasOne(TeacherProfile, {
  as: 'teacherProfile',
  foreignKey: 'teacherId',
});

TeacherProfile.belongsTo(User, {
  as: 'teacher',
  foreignKey: 'teacherId',
});

User.hasMany(TeacherQuestion, {
  as: 'teacherQuestions',
  foreignKey: 'teacherId',
});

TeacherQuestion.belongsTo(User, {
  as: 'teacher',
  foreignKey: 'teacherId',
});

User.hasMany(TeacherInteraction, {
  as: 'teacherInteractions',
  foreignKey: 'teacherId',
});

TeacherInteraction.belongsTo(User, {
  as: 'teacher',
  foreignKey: 'teacherId',
});

// ===== Question & Quiz Relationships =====
User.hasMany(Question, {
  as: 'createdQuestions',
  foreignKey: 'createdBy',
});

Question.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy',
});

// ===== Course & Quiz Relationships =====
Course.hasMany(Quiz, {
  as: 'quizzes',
  foreignKey: 'courseId',
});

Quiz.belongsTo(Course, {
  as: 'course',
  foreignKey: 'courseId',
});

// ===== Chapter & Quiz Relationships =====
Chapter.hasMany(Quiz, {
  as: 'quizzes',
  foreignKey: 'chapterId',
});

Quiz.belongsTo(Chapter, {
  as: 'chapter',
  foreignKey: 'chapterId',
});

Lesson.hasMany(Quiz, {
  as: 'quizzes',
  foreignKey: 'lessonId',
});

Quiz.belongsTo(Lesson, {
  as: 'lesson',
  foreignKey: 'lessonId',
});

User.hasMany(Quiz, {
  as: 'createdQuizzes',
  foreignKey: 'createdBy',
});

Quiz.belongsTo(User, {
  as: 'creator',
  foreignKey: 'createdBy',
});

Quiz.belongsToMany(Question, {
  through: QuizQuestion,
  as: 'questions',
  foreignKey: 'quizId',
  otherKey: 'questionId',
});

Question.belongsToMany(Quiz, {
  through: QuizQuestion,
  as: 'quizzes',
  foreignKey: 'questionId',
  otherKey: 'quizId',
});

Quiz.hasMany(QuizQuestion, {
  as: 'quizQuestions',
  foreignKey: 'quizId',
});

Question.hasMany(QuizQuestion, {
  as: 'quizQuestions',
  foreignKey: 'questionId',
});

QuizQuestion.belongsTo(Quiz, {
  as: 'quiz',
  foreignKey: 'quizId',
});

QuizQuestion.belongsTo(Question, {
  as: 'question',
  foreignKey: 'questionId',
});

User.hasMany(StudentQuizAttempt, {
  as: 'quizAttempts',
  foreignKey: 'studentId',
});

StudentQuizAttempt.belongsTo(User, {
  as: 'student',
  foreignKey: 'studentId',
});

Quiz.hasMany(StudentQuizAttempt, {
  as: 'studentAttempts',
  foreignKey: 'quizId',
});

StudentQuizAttempt.belongsTo(Quiz, {
  as: 'quiz',
  foreignKey: 'quizId',
});

// ===== StudentAnswer Relationships (MỚI - hỗ trợ 4 loại câu hỏi) =====
StudentQuizAttempt.hasMany(StudentAnswer, {
  as: 'answers',
  foreignKey: 'attemptId',
});

StudentAnswer.belongsTo(StudentQuizAttempt, {
  as: 'attempt',
  foreignKey: 'attemptId',
});

Question.hasMany(StudentAnswer, {
  as: 'studentAnswers',
  foreignKey: 'questionId',
});

StudentAnswer.belongsTo(Question, {
  as: 'question',
  foreignKey: 'questionId',
});

// ===== Comment Relationships =====
User.hasMany(Comment, {
  as: 'comments',
  foreignKey: 'userId',
});

Comment.belongsTo(User, {
  as: 'author',
  foreignKey: 'userId',
});

Course.hasMany(Comment, {
  as: 'comments',
  foreignKey: 'courseId',
});

Comment.belongsTo(Course, {
  as: 'course',
  foreignKey: 'courseId',
});

// Self-reference for replies
Comment.hasMany(Comment, {
  as: 'replies',
  foreignKey: 'parentCommentId',
});

Comment.belongsTo(Comment, {
  as: 'parentComment',
  foreignKey: 'parentCommentId',
});

module.exports = {
  User,
  Course,
  Chapter,
  Lesson,
  LessonSegment,
  Enrollment,
  Progress,
  LessonWatchPosition,
  ContactMessage,
  TeacherProfile,
  TeacherQuestion,
  TeacherInteraction,
  Question,
  Quiz,
  QuizQuestion,
  StudentQuizAttempt,
  StudentAnswer,
  Comment,
};