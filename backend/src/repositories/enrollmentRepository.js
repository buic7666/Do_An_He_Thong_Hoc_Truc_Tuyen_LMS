const { Enrollment, Course } = require('../models');

const createEnrollment = async (payload) => {
  return Enrollment.create(payload);
};

const findByUserAndCourse = async (userId, courseId) => {
  return Enrollment.findOne({
    where: {
      userId,
      courseId,
    },
  });
};

const isUserEnrolledActive = async (userId, courseId) => {
  return Enrollment.findOne({
    where: {
      userId,
      courseId,
      status: 'active',
    },
  });
};

const findByUserId = async (userId) => {
  return Enrollment.findAll({
    where: { userId },
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'description', 'price', 'instructorId'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

module.exports = {
  createEnrollment,
  findByUserAndCourse,
  isUserEnrolledActive,
  findByUserId,
};