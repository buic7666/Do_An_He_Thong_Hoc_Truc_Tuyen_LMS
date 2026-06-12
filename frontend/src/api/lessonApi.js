import httpClient from './httpClient';

export const fetchLessonDetailApi = async (lessonId) => {
  const response = await httpClient.get(`/lessons/${lessonId}`);
  return response.data?.data || response.data;
};

export const fetchLessonWatchPositionApi = async (lessonId) => {
  const response = await httpClient.get(`/lessons/${lessonId}/watch-position`);
  return response.data?.data || response.data;
};

export const saveLessonWatchPositionApi = async (lessonId, positionSeconds) => {
  const response = await httpClient.post(`/lessons/${lessonId}/watch-position`, {
    positionSeconds,
  });

  return response.data?.data || response.data;
};

export const markLessonCompletedApi = async (lessonId) => {
  const response = await httpClient.post(`/lessons/${lessonId}/progress`);
  return response.data?.data || response.data;
};