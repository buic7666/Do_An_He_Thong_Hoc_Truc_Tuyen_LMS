const { Lesson, Course, LessonSegment } = require('../models');

const findByCourseId = async (courseId) => {
  return Lesson.findAll({
    where: { courseId },
    order: [['orderIndex', 'ASC']],
  });
};

const findById = async (id) => {
  return Lesson.findByPk(id);
};

const findByIdWithCourse = async (id) => {
  return Lesson.findByPk(id, {
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'description'],
      },
      {
        model: LessonSegment,
        as: 'segments',
        attributes: ['id', 'startTime', 'endTime', 'duration', 'title'],
        order: [['startTime', 'ASC']],
      },
    ],
  });
};

const createLesson = async (payload) => {
  return Lesson.create(payload);
};

const findByCourseIdAndOrderIndex = async (courseId, orderIndex) => {
  return Lesson.findOne({
    where: {
      courseId,
      orderIndex,
    },
  });
};

module.exports = {
  findByCourseId,
  findById,
  findByIdWithCourse,
  createLesson,
  findByCourseIdAndOrderIndex,
};