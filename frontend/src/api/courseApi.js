import httpClient from './httpClient';

export const fetchCoursesApi = async () => {
  const response = await httpClient.get('/courses');
  return response.data?.data || response.data;
};

export const fetchCourseDetailApi = async (courseId) => {
  const response = await httpClient.get(`/courses/${courseId}`);
  return response.data?.data || response.data;
};

export const fetchCourseProgressApi = async (courseId) => {
  const response = await httpClient.get(`/courses/${courseId}/progress`, {
    params: { _t: Date.now() },
  });
  return response.data?.data || response.data;
};
