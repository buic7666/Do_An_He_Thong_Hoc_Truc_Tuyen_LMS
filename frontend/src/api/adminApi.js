import httpClient from './httpClient';

export const fetchAdminDashboardApi = async () => {
  const response = await httpClient.get('/admin/dashboard');
  return response?.data?.data || response?.data;
};
