import httpClient from './httpClient';

export const fetchMyEnrollmentsApi = async () => {
  const response = await httpClient.get('/enrollments/me');
  return response.data?.data || response.data;
};

export const createEnrollmentApi = async (courseId) => {
  const response = await httpClient.post('/enrollments', {
    courseId,
  });

  return response.data?.data || response.data;
};