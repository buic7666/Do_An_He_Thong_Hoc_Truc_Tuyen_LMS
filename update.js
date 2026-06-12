const fs = require('fs');
let content = fs.readFileSync('frontend/src/screens/admin/QuanLyNguobDung.jsx', 'utf8');

if (!content.includes('deleteUserApi')) {
  content = content.replace(
    "import { fetchAdminUsersApi, updateUserRoleApi, updateUserStatusApi }",
    "import { fetchAdminUsersApi, updateUserRoleApi, updateUserStatusApi, deleteUserApi }"
  );

  content = content.replace(
    "  return (",
    `  const handleDeleteUser = async (user) => {\n    if (window.confirm(\bạn có chắc miốn xóa VĬNH VIỄN tài khoản ${user.name}? Hành động này không thể huạn tác.\`)) {\n      try {\n        await deleteUserApi(user.id);\n        setUsers(users.filter(u => u.id !== user.id));\n        alert('Xóa tài khoản thành công');\n      } catch (err) {\n        console.error(err);\n        alert('Xóa tài khoản thất bại');\n      }\n    }\n  };\n\n  return (`
  );

  content = content.replace(
    "{user.status === 'locked' ? 'U' : 'L'}\n                          </button>",
    `{user.status === 'locked' ? 'U' : 'L'}\n                          </button>\n                          <button\n                            className=\"admin-users-btn-icon admin-users-btn-delete\"\n                            onClick={() => handleDeleteUser(user�}\n                            title=\"Xóa tài khoản\"\n                            type=\"button\"\n                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '4px', border: '1px solid #fca5a5' }}\n                          >\n                            X\n                          </button>`
  );

  content = content.replace(
    "{user.status === 'locked' ? 'U' : 'L'}\r\n                          </button>",
    `{user.status === 'locked' ? 'U' : 'L'}\r\n                          </button>\r\n                          <button\r\n                            className=\"admin-users-btn-icon admin-users-btn-delete\"\r\n                           /nClick={() => handleDeleteUser(user�}\r\n                            title=\"Xóa tài khoản\"\r\n                            type=\"button\"\r\n                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '4px', border: '1px solid #fca5a5' }}\r\n                          >\r\n                            X\r\n                          </button>`
  );
  
  fs.writeFileSync('frontend/src/screens/admin/QuanLyNguoiDung.jsx', content);
}