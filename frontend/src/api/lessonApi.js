import httpClient from './httpClient';

export const fetchLessonDetailApi = async (lessonId) => {
  const response = await httpClient.get(`/lessons/${lessonId}`);
  return response.data?.data || response.data;
};

export const fetchLessonWatchPositionApi = async (lessonId) => {
  const response = await httpClient.get(`/lessons/${lessonId}/watch-position`);
  return response.data?.data || response.data;
};

export const saveLessonWatchPositionApi = async (lessonId, positionSeconds, studyState) => {
  const response = await httpClient.post(`/lessons/${lessonId}/watch-position`, {
    positionSeconds,
    ...(studyState ? { studyState } : {}),
  });

  return response.data?.data || response.data;
};

export const markLessonCompletedApi = async (lessonId, studyState = null, positionSeconds = null) => {
  const body = {};
  if (studyState && typeof studyState === 'object') {
    body.studyState = studyState;
  }
  if (Number.isFinite(Number(positionSeconds)) && Number(positionSeconds) >= 0) {
    body.positionSeconds = Math.floor(Number(positionSeconds));
  }

  const response = await httpClient.post(`/lessons/${lessonId}/progress`, body);
  return response.data?.data || response.data;
};
