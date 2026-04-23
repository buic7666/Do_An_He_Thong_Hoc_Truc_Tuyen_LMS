const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, 'User registered successfully', result, 201);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    return next(error);
  }
};

const loginWithGoogle = async (req, res, next) => {
  try {
    const result = await authService.loginWithGoogle(req.body);
    return successResponse(res, 'Google login successful', result, 200);
  } catch (error) {
    return next(error);
  }
};

const loginWithFacebook = async (req, res, next) => {
  try {
    const result = await authService.loginWithFacebook(req.body);
    return successResponse(res, 'Facebook login successful', result, 200);
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    return successResponse(res, 'Current user retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  loginWithGoogle,
  loginWithFacebook,
  me,
};