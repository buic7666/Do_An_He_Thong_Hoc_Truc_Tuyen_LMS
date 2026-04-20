import httpClient from './httpClient';

export const loginApi = async (payload) => {
  const response = await httpClient.post('/auth/login', payload);
  return response.data?.data || response.data;
};

export const registerApi = async (payload) => {
  const response = await httpClient.post('/auth/register', payload);
  return response.data?.data || response.data;
};