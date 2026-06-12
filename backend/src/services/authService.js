const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { google } = require('googleapis');

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

const buildFallbackNameFromEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return 'Học viên mới';
  }

  return email.split('@')[0].slice(0, 120) || 'Học viên mới';
};

const issueTokenFromUser = (user) => {
  const safeUser = sanitizeUser(user);
  const token = generateToken(safeUser);

  return {
    ...safeUser,
    token,
  };
};

const findOrCreateSocialUser = async ({ name, email }) => {
  const normalizedEmail = String(email || '')
    .toLowerCase()
    .trim();

  if (!normalizedEmail) {
    throw new HttpError(400, 'Cannot retrieve email from social account', 'SOCIAL_EMAIL_REQUIRED');
  }

  const existingUser = await userRepository.findByEmail(normalizedEmail);
  if (existingUser) {
    return existingUser;
  }

  const randomSecret = `${normalizedEmail}-${Date.now()}-${Math.random()}`;
  const passwordHash = await bcrypt.hash(randomSecret, 10);

  return userRepository.createUser({
    name: (name || buildFallbackNameFromEmail(normalizedEmail)).trim().slice(0, 120),
    email: normalizedEmail,
    passwordHash,
    role: 'student',
  });
};

const loginWithGoogle = async (payload) => {
  const accessToken = payload?.access_token;

  if (!accessToken) {
    throw new HttpError(400, 'Google access token is required', 'VALIDATION_ERROR');
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({
      version: 'v2',
      auth: oauth2Client,
    });

    const profileResponse = await oauth2.userinfo.get();
    const profile = profileResponse?.data;

    if (!profile?.email) {
      throw new HttpError(400, 'Google account does not provide email', 'SOCIAL_EMAIL_REQUIRED');
    }

    const user = await findOrCreateSocialUser({
      name: profile.name,
      email: profile.email,
    });

    return issueTokenFromUser(user);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, 'Invalid Google access token', 'GOOGLE_TOKEN_INVALID');
  }
};

const loginWithFacebook = async (payload) => {
  const accessToken = payload?.access_token;

  if (!accessToken) {
    throw new HttpError(400, 'Facebook access token is required', 'VALIDATION_ERROR');
  }

  try {
    const profileResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email',
        access_token: accessToken,
      },
      timeout: 10000,
    });

    const profile = profileResponse?.data;

    if (!profile?.email) {
      throw new HttpError(
        400,
        'Facebook account does not provide email. Please use an account with public email.',
        'SOCIAL_EMAIL_REQUIRED',
      );
    }

    const user = await findOrCreateSocialUser({
      name: profile.name,
      email: profile.email,
    });

    return issueTokenFromUser(user);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, 'Invalid Facebook access token', 'FACEBOOK_TOKEN_INVALID');
  }
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
  loginWithGoogle,
  loginWithFacebook,
  getCurrentUser,
};