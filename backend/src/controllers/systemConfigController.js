const systemConfigService = require('../services/systemConfigService');
const { successResponse } = require('../utils/response');

const getSettings = async (_req, res, next) => {
  try {
    const result = await systemConfigService.getSettings();
    return successResponse(res, 'System settings retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const result = await systemConfigService.updateSettings(req.body);
    return successResponse(res, 'System settings updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (_req, res, next) => {
  try {
    const result = await systemConfigService.getCategories();
    return successResponse(res, 'System categories retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const result = await systemConfigService.createCategory(req.body);
    return successResponse(res, 'System category created', result, 201);
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const result = await systemConfigService.updateCategory(req.params.id, req.body);
    return successResponse(res, 'System category updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const result = await systemConfigService.deleteCategory(req.params.id);
    return successResponse(res, 'System category deleted', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};