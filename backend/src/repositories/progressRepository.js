const { Op } = require('sequelize');
const { Progress } = require('../models');

const findByUserAndLesson = async (userId, lessonId) => {
  return Progress.findOne({
    where: {
      userId,
      lessonId,
    },
  });
};

const createProgress = async (payload) => {
  return Progress.create(payload);
};

const updateProgress = async (progress, payload) => {
  return progress.update(payload);
};

const findCompletedByUserAndLessonIds = async (userId, lessonIds) => {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return [];
  }

  return Progress.findAll({
    where: {
      userId,
      lessonId: {
        [Op.in]: lessonIds,
      },
      isCompleted: true,
    },
  });
};

module.exports = {
  findByUserAndLesson,
  createProgress,
  updateProgress,
  findCompletedByUserAndLessonIds,
};
