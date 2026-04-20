import httpClient from './httpClient';

export const submitContactMessageApi = async (payload) => {
  const response = await httpClient.post('/contacts', payload);
  return response.data?.data || response.data;
};

export const fetchContactMessagesApi = async () => {
  const response = await httpClient.get('/contacts');
  return response.data?.data || response.data;
};
