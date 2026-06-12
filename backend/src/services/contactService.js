const contactRepository = require('../repositories/contactRepository');

const mapContactMessage = (item) => {
  const plain = item.toJSON();

  return {
    id: plain.id,
    fullName: plain.fullName,
    email: plain.email,
    phone: plain.phone,
    message: plain.message,
    status: plain.status,
    createdAt: plain.createdAt,
  };
};

const createContactMessage = async (payload) => {
  const created = await contactRepository.createContactMessage({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || null,
    message: payload.message,
  });

  return mapContactMessage(created);
};

const getAllContactMessages = async () => {
  const messages = await contactRepository.findAllContactMessages();
  return messages.map(mapContactMessage);
};

module.exports = {
  createContactMessage,
  getAllContactMessages,
};
