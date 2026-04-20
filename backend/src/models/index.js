const User = require('./user.model');
const Course = require('./course.model');
const Lesson = require('./lesson.model');
const Enrollment = require('./enrollment.model');
const Progress = require('./progress.model');
const LessonWatchPosition = require('./lessonWatchPosition.model');
const ContactMessage = require('./contactMessage.model');
const TeacherProfile = require('./teacherProfile.model');
const TeacherQuestion = require('./teacherQuestion.model');
const TeacherInteraction = require('./teacherInteraction.model');

Course.belongsTo(User, {
  as: 'instructor',
  foreignKey: 'instructorId',
});

User.hasMany(Course, {
  as: 'teachingCourses',
  foreignKey: 'instructorId',
});

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

module.exports = {
  User,
  Course,
  Lesson,
  Enrollment,
  Progress,
  LessonWatchPosition,
  ContactMessage,
  TeacherProfile,
  TeacherQuestion,
  TeacherInteraction,
};