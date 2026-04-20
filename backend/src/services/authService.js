const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { env } = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { HttpError } = require('../utils/httpError');

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const plain = user.toJSON ? user.toJSON() : user;
  return {
    id: plain.id,
    name: plain.name,
    email: plain.email,
    role: plain.role,
    createdAt: plain.createdAt || plain.created_at,
  };
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
};

const register = async (payload) => {
  const { name, email, password, role = 'student' } = payload;

  if (!name || !email || !password) {
    throw new HttpError(400, 'name, email, and password are required', 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(409, 'Email already registered', 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const createdUser = await userRepository.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
  });

  const safeUser = sanitizeUser(createdUser);
  const token = generateToken(safeUser);

  return {
    ...safeUser,
    token,
  };
};

const login = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new HttpError(400, 'email and password are required', 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (!existingUser) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const safeUser = sanitizeUser(existingUser);
  const token = generateToken(safeUser);

  return {
    ...safeUser,
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  return sanitizeUser(user);
};

module.exports = {
  register,
  login,
  getCurrentUser,
};