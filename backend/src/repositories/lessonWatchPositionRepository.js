const { LessonWatchPosition } = require('../models');

const findByUserAndLesson = async (userId, lessonId) => {
  return LessonWatchPosition.findOne({
    where: {
      userId,
      lessonId,
    },
  });
};

const createWatchPosition = async (payload) => {
  return LessonWatchPosition.create(payload);
};

const updateWatchPosition = async (watchPosition, payload) => {
  return watchPosition.update(payload);
};

module.exports = {
  findByUserAndLesson,
  createWatchPosition,
  updateWatchPosition,
};