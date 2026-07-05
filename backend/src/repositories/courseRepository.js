const { Course, Lesson, User, Enrollment, LessonSegment } = require('../models');

const findAll = async () => {
  return Course.findAll({
    include: [
      {
        model: Lesson,
        as: 'lessons',
        attributes: ['id'],
      },
      {
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: Enrollment,
        as: 'enrollments',
        attributes: ['id', 'status'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

const findById = async (id) => {
  return Course.findByPk(id);
};

const findByIdWithLessons = async (id) => {
  return Course.findByPk(id, {
    include: [
      {
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: Lesson,
        as: 'lessons',
        attributes: ['id', 'courseId', 'chapterId', 'title', 'videoUrl', 'content', 'orderIndex', 'createdAt'],
      },
      {
        model: Enrollment,
        as: 'enrollments',
        attributes: ['id', 'status'],
      },
    ],
    order: [[{ model: Lesson, as: 'lessons' }, 'orderIndex', 'ASC']],
  });
};

const findLessonsByCourseId = async (courseId) => {
  return Lesson.findAll({
    where: { courseId },
    order: [['orderIndex', 'ASC']],
  });
};

const findLessonsWithSegmentsByCourseId = async (courseId) => {
  return Lesson.findAll({
    where: { courseId },
    include: [
      {
        model: LessonSegment,
        as: 'segments',
        attributes: ['id', 'lessonId', 'startTime', 'endTime', 'duration', 'title', 'orderIndex', 'contentItems'],
      },
    ],
    order: [
      ['orderIndex', 'ASC'],
      [{ model: LessonSegment, as: 'segments' }, 'orderIndex', 'ASC'],
    ],
  });
};

const createCourse = async (payload) => {
  return Course.create(payload);
};

module.exports = {
  findAll,
  findById,
  findByIdWithLessons,
  findLessonsByCourseId,
  findLessonsWithSegmentsByCourseId,
  createCourse,
};
