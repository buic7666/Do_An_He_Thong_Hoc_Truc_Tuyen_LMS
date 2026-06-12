const fs = require('fs');
let c = fs.readFileSync('backend/src/services/adminService.js', 'utf8');
c = c.replace(
  'module.exports = {\r\n  getUsers,\r\n  updateUserRole,\r\n  updateUserStatus,\r\n  getDashboardOverview,\r\n};',
  'const deleteUser = async (userId) => {\r\n  const user = await User.findByPk(userId);\r\n  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");\r\n  await user.destroy();\r\n  return { message: "User deleted successfully" };\r\n};\r\n\r\nmodule.exports = {\r\n  getUsers,\r\n  updateUserRole,\r\n  updateUserStatus,\r\n  deleteUser,\r\n  getDashboardOverview,\r\n};'
);
c = c.replace(
  'module.exports = {\n  getUsers,\n  updateUserRole,\n  updateUserStatus,\n  getDashboardOverview,\n};',
  'const deleteUser = async (userId) => {\n  const user = await User.findByPk(userId);\n  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");\n  await user.destroy();\n  return { message: "User deleted successfully" };\n};\n\nmodule.exports = {\n  getUsers,\n  updateUserRole,\n  updateUserStatus,\n  deleteUser,\n  getDashboardOverview,\n};'
);
fs.writeFileSync('backend/src/services/adminService.js', c);

let c2 = fs.readFileSync('backend/src/controllers/adminController.js', 'utf8');
c2 = c2.replace(
  'module.exports = {\n  getUsers,\n  updateUserRole,\n  updateUserStatus,\n  getDashboardOverview,\n};',
  'const deleteUser = async (req, res, next) => {\n  try {\n    const { id } = req.params;\n    const result = await adminService.deleteUser(id);\n    return successResponse(res, "User deleted", result, 200);\n  } catch (error) {\n    return next(error);\n  }\n};\n\nmodule.exports = {\n  getUsers,\n  updateUserRole,\n  updateUserStatus,\n  deleteUser,\n  getDashboardOverview,\n};'
);
c2 = c2.replace(
  'module.exports = {\r\n  getUsers,\r\n  updateUserRole,\r\n  updateUserStatus,\r\n  getDashboardOverview,\r\n};',
  'const deleteUser = async (req, res, next) => {\r\n  try {\r\n    const { id } = req.params;\r\n    const result = await adminService.deleteUser(id);\r\n    return successResponse(res, "User deleted", result, 200);\r\n  } catch (error) {\r\n    return next(error);\r\n  }\r\n};\r\n\r\nmodule.exports = {\r\n  getUsers,\r\n  updateUserRole,\r\n  updateUserStatus,\r\n  deleteUser,\r\n  getDashboardOverview,\r\n};'
);
fs.writeFileSync('backend/src/controllers/adminController.js', c2);

let c3 = fs.readFileSync('backend/src/routes/adminRoutes.js', 'utf8');
c3 = c3.replace(
  "router.put('/users/:id/status', authenticate, authorize('admin'), adminController.updateUserStatus);",
  "router.put('/users/:id/status', authenticate, authorize('admin'), adminController.updateUserStatus);\nrouter.delete('/users/:id', authenticate, authorize('admin'), adminController.deleteUser);"
);
fs.writeFileSync('backend/src/routes/adminRoutes.js', c3);
