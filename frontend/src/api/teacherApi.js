import httpClient from './httpClient';

export const fetchTeacherDashboardApi = async () => {
  const response = await httpClient.get('/teachers/dashboard');
  return response?.data?.data || response?.data;
};

export const fetchTeacherProfileApi = async () => {
  const response = await httpClient.get('/teachers/profile');
  return response?.data?.data || response?.data;
};

export const updateTeacherProfileApi = async (payload) => {
  const response = await httpClient.put('/teachers/profile', payload);
  return response?.data?.data || response?.data;
};

export const fetchTeacherQuestionsApi = async () => {
  const response = await httpClient.get('/teachers/questions');
  return response?.data?.data || response?.data;
};

export const createTeacherQuestionApi = async (payload) => {
  const response = await httpClient.post('/teachers/questions', payload);
  return response?.data?.data || response?.data;
};

export const updateTeacherQuestionApi = async (id, payload) => {
  const response = await httpClient.put(`/teachers/questions/${id}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteTeacherQuestionApi = async (id) => {
  const response = await httpClient.delete(`/teachers/questions/${id}`);
  return response?.data?.data || response?.data;
};

export const fetchTeacherInteractionsApi = async () => {
  const response = await httpClient.get('/teachers/interactions');
  return response?.data?.data || response?.data;
};

export const replyTeacherInteractionApi = async (id, payload) => {
  const response = await httpClient.post(`/teachers/interactions/${id}/reply`, payload);
  return response?.data?.data || response?.data;
};

export const uploadTeacherFileApi = async (file, type = 'image') => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post(`/teachers/upload?type=${encodeURIComponent(type)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });

  return response?.data?.data || response?.data;
};
