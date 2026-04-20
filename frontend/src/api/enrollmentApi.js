import httpClient from './httpClient';

export const fetchMyEnrollmentsApi = async () => {
  const response = await httpClient.get('/enrollments/me');
  return response.data?.data || response.data;
};