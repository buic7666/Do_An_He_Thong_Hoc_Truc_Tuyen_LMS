const fs = require('fs');

// Update adminService.js
let svc = fs.readFileSync('backend/src/services/adminService.js', 'utf8');
if (!svc.includes('deleteUser')) {
  svc = svc.replace(
    'module.exports = {',
    'const deleteUser = async (userId) => {\n  const user = await User.findByPk(userId);\n  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");\n  await user.destroy();\n  return { message: "User deleted successfully" };\n};\n\nmodule.exports = {\n  deleteUser,'
  );
  fs.writeFileSync('backend/src/services/adminService.js', svc);
}

// Update adminController.js
let ctrl = fs.readFileSync('backend/src/controllers/adminController.js', 'utf8');
if (!ctrl.includes('deleteUser')) {
  ctrl = ctrl.replace(
    'module.exports = {',
    'const deleteUser = async (req, res, next) => {\n  try {\n    const { id } = req.params;\n    const result = await adminService.deleteUser(id);\n    return successResponse(res, "User deleted", result, 200);\n  } catch (error) {\n    return next(error);\n  }\n};\n\nmodule.exports = {\n  deleteUser,'
  );
  fs.writeFileSync('backend/src/controllers/adminController.js', ctrl);
}