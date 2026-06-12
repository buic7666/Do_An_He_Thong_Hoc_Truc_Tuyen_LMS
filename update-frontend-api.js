const fs = require('fs');
let apiContent = fs.readFileSync('frontend/src/api/adminApi.js', 'utf8');
if (!apiContent.includes('deleteUserApi')) {
  apiContent += "\nexport const deleteUserApi = async (userId) => {\n  const response = await httpClient.delete(`/admin/users/${userId}`);\n  return response?.data?.data || response?.data;\n};\n";
  fs.writeFileSync('frontend/src/api/adminApi.js', apiContent);
}