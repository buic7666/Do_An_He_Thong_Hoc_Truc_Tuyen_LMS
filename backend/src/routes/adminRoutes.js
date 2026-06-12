﻿const express = require('express');
const adminController = require('../controllers/adminController');
const adminApprovalController = require('../controllers/adminApprovalController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const systemConfigController = require('../controllers/systemConfigController');
const router = express.Router();

// === PHÂN HỆ DASHBOARD ===
router.get('/dashboard', authenticate, authorize('admin'), adminController.getDashboardOverview);

// === PHÂN HỆ QUẢN LÝ NGƯỜI DÙNG ===
router.get('/users', authenticate, authorize('admin'), adminController.getUsers);
router.put('/users/:id/role', authenticate, authorize('admin'), adminController.updateUserRole);
router.put('/users/:id/status', authenticate, authorize('admin'), adminController.updateUserStatus);
router.delete('/users/:id', authenticate, authorize('admin'), adminController.deleteUser);

// === PHÂN HỆ PHÊ DUYỆT KHÓA HỌC (API CŨ - GIỮ LẠI NẾU CẦN COMPATIBILITY) ===
router.get('/courses/pending', authenticate, authorize('admin'), adminController.getPendingCourses);
router.put('/courses/:id/status', authenticate, authorize('admin'), adminController.updateCourseStatus);

// === CÁC ROUTE MỚI CHO QUẢN LÝ KHÓA HỌC (ADMIN THỰC HIỆN) ===
router.get('/courses', authenticate, authorize('admin'), adminApprovalController.getCourses);
router.put('/courses/:id', authenticate, authorize('admin'), adminApprovalController.updateCourse);
router.delete('/courses/:id', authenticate, authorize('admin'), adminApprovalController.deleteCourse);

// ROUTE DUYỆT CHUNG (COURSE VÀ LESSON) - KHÔNG CÓ CHỮ /status Ở ĐUÔI THEO ĐÚNG CONTROLLER
router.put('/approvals/:type/:id', authenticate, authorize('admin'), adminApprovalController.updateApprovalStatus);

// === CÁC ROUTE LẤY DỮ LIỆU ĐẦY ĐỦ CHO GIÁO VIÊN (Xem trạng thái) ===
router.get('/teacher/full-courses', authenticate, adminApprovalController.getCourses);
router.get('/teacher/full-lessons/:courseId', authenticate, adminApprovalController.getFullLessonsForTeacher);

// === PHÂN HỆ CẤU HÌNH HỆ THỐNG ===
router.get('/system-config/settings', authenticate, authorize('admin'), systemConfigController.getSettings);
router.put('/system-config/settings', authenticate, authorize('admin'), systemConfigController.updateSettings);

router.get('/system-config/categories', authenticate, authorize('admin'), systemConfigController.getCategories);
router.post('/system-config/categories', authenticate, authorize('admin'), systemConfigController.createCategory);
router.put('/system-config/categories/:id', authenticate, authorize('admin'), systemConfigController.updateCategory);
router.delete('/system-config/categories/:id', authenticate, authorize('admin'), systemConfigController.deleteCategory);
module.exports = router;