const { Lesson, Course } = require('../models');

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