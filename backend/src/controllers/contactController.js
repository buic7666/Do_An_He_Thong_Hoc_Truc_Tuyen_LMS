const contactService = require('../services/contactService');
const { successResponse } = require('../utils/response');

const submitContactMessage = async (req, res, next) => {
  try {
    const result = await contactService.createContactMessage(req.body);
    return successResponse(res, 'Contact message submitted successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};

const getContactMessages = async (_req, res, next) => {
  try {
    const result = await contactService.getAllContactMessages();
    return successResponse(res, 'Contact messages retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitContactMessage,
  getContactMessages,
};
