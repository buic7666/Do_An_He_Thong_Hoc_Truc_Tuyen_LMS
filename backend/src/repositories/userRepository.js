const { User } = require('../models');

const createUser = async (payload) => {
  return User.create(payload);
};

const findByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

const findById = async (id) => {
  return User.findByPk(id);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
};