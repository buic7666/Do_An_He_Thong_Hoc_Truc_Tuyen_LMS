import httpClient from './httpClient';

const unwrap = (response) => response?.data?.data || response?.data;

export const fetchAdminDashboardApi = async () => {
  const response = await httpClient.get('/admin/dashboard');
  return unwrap(response);
};

export const fetchAdminUsersApi = async () => {
  const response = await httpClient.get('/admin/users');
  return unwrap(response);
};

export const updateUserRoleApi = async (userId, role) => {
  const response = await httpClient.put(`/admin/users/${userId}/role`, { role });
  return unwrap(response);
};

export const updateUserStatusApi = async (userId, status) => {
  const response = await httpClient.put(`/admin/users/${userId}/status`, { status });
  return unwrap(response);
};

export const deleteUserApi = async (userId) => {
  const response = await httpClient.delete(`/admin/users/${userId}`);
  return unwrap(response);
};

export const fetchPendingCoursesApi = async () => {
  const response = await httpClient.get('/admin/courses/pending');
  return unwrap(response);
};

export const updateCourseStatusApi = async (courseId, status, reason) => {
  const response = await httpClient.put(`/admin/courses/${courseId}/status`, { status, reason });
  return unwrap(response);
};

export const fetchSystemSettingsApi = async () => {
  const response = await httpClient.get('/admin/system-config/settings');
  return unwrap(response);
};

export const updateSystemSettingsApi = async (settings) => {
  const response = await httpClient.put('/admin/system-config/settings', settings);
  return unwrap(response);
};

export const fetchSystemCategoriesApi = async () => {
  const response = await httpClient.get('/admin/system-config/categories');
  return unwrap(response);
};

export const createSystemCategoryApi = async (name) => {
  const response = await httpClient.post('/admin/system-config/categories', { name });
  return unwrap(response);
};

export const updateSystemCategoryApi = async (categoryId, name) => {
  const response = await httpClient.put(`/admin/system-config/categories/${categoryId}`, { name });
  return unwrap(response);
};

export const deleteSystemCategoryApi = async (categoryId) => {
  const response = await httpClient.delete(`/admin/system-config/categories/${categoryId}`);
  return unwrap(response);
};
export const fetchQuestionTypeConfigsApi = async () => {
  const response = await httpClient.get('/admin/question-types');
  return response?.data?.data || response?.data || [];
};

export const updateQuestionTypeConfigApi = async (code, payload) => {
  const response = await httpClient.put(`/admin/question-types/${code}`, payload);
  return response?.data?.data || response?.data;
};