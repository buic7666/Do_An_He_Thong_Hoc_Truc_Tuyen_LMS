const adminService = require('../services/adminService');
const { successResponse } = require('../utils/response');

const getDashboardOverview = async (req, res, next) => {
  try {
    const result = await adminService.getDashboardOverview(req.user);
    return successResponse(res, 'Admin dashboard retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers();
    return successResponse(res, 'Users retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const result = await adminService.updateUserRole(id, role);
    return successResponse(res, 'User role updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await adminService.updateUserStatus(id, status);
    return successResponse(res, 'User status updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.deleteUser(id);
    return successResponse(res, "User deleted", result, 200);
  } catch (error) {
    return next(error);
  }
};

const getPendingCourses = async (req, res, next) => {
  try {
    const result = await adminService.getPendingCourses();
    return successResponse(res, 'Pending courses retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const updateCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status can be 'approved', 'rejected'
    const result = await adminService.updateCourseStatus(id, status, reason);
    return successResponse(res, 'Course status updated', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  deleteUser,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getDashboardOverview,
  getPendingCourses,
  updateCourseStatus,
};
