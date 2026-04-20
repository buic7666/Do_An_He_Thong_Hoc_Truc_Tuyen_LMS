const { ContactMessage } = require('../models');

const createContactMessage = async (payload) => {
  return ContactMessage.create(payload);
};

const findAllContactMessages = async () => {
  return ContactMessage.findAll({
    order: [['createdAt', 'DESC']],
  });
};

module.exports = {
  createContactMessage,
  findAllContactMessages,
};
