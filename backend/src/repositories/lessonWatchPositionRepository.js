const { Op } = require('sequelize');
const { LessonWatchPosition } = require('../models');

const findByUserAndLesson = async (userId, lessonId) => {
  return LessonWatchPosition.findOne({
    where: {
      userId,
      lessonId,
    },
    order: [
      ['lastWatchedAt', 'DESC'],
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
};

const createWatchPosition = async (payload) => {
  return LessonWatchPosition.create(payload);
};

const updateWatchPosition = async (watchPosition, payload) => {
  return watchPosition.update(payload);
};

const findByUserAndLessonIds = async (userId, lessonIds) => {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return [];
  }

  return LessonWatchPosition.findAll({
    where: {
      userId,
      lessonId: {
        [Op.in]: lessonIds,
      },
    },
    order: [
      ['lastWatchedAt', 'DESC'],
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
};

module.exports = {
  findByUserAndLesson,
  createWatchPosition,
  updateWatchPosition,
  findByUserAndLessonIds,
};
