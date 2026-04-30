import httpClient from './httpClient';

export const createCourseApi = async (payload) => {
  const response = await httpClient.post('/courses', payload);
  return response?.data?.data || response?.data;
};

export const getCourseChaptersApi = async (courseId) => {
  const response = await httpClient.get(`/chapters/course/${courseId}`);
  return response?.data?.data || response?.data || [];
};

export const createCourseChapterApi = async (courseId, payload) => {
  const response = await httpClient.post(`/chapters/course/${courseId}`, payload);
  return response?.data?.data || response?.data;
};

export const fetchCourseLessonsApi = async (courseId) => {
  const response = await httpClient.get(`/lessons/course/${courseId}`);
  return response?.data?.data || response?.data || [];
};

export const createLessonApi = async (courseId, payload) => {
  const response = await httpClient.post(`/lessons/course/${courseId}`, payload);
  return response?.data?.data || response?.data;
};

export const updateLessonApi = async (lessonId, payload) => {
  const response = await httpClient.put(`/lessons/${lessonId}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteLessonApi = async (lessonId) => {
  const response = await httpClient.delete(`/lessons/${lessonId}`);
  return response?.data?.data || response?.data;
};

export const fetchLessonSegmentsApi = async (lessonId) => {
  const response = await httpClient.get(`/lessons/${lessonId}/segments`);
  return response?.data?.data || response?.data || [];
};

export const createLessonSegmentApi = async (lessonId, payload) => {
  const response = await httpClient.post(`/lessons/${lessonId}/segments`, payload);
  return response?.data?.data || response?.data;
};

export const bulkCreateLessonSegmentsApi = async (lessonId, payload) => {
  const response = await httpClient.post(`/lessons/${lessonId}/segments/bulk`, payload);
  return response?.data?.data || response?.data;
};

export const updateLessonSegmentApi = async (segmentId, payload) => {
  const response = await httpClient.put(`/lessons/segments/${segmentId}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteLessonSegmentApi = async (segmentId) => {
  const response = await httpClient.delete(`/lessons/segments/${segmentId}`);
  return response?.data?.data || response?.data;
};

export const updateCourseChapterApi = async (chapterId, payload) => {
  const response = await httpClient.put(`/chapters/${chapterId}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteChapterApi = async (chapterId) => {
  const response = await httpClient.delete(`/chapters/${chapterId}`);
  return response?.data?.data || response?.data;
};

export const deleteCourseApi = async (courseId) => {
  const response = await httpClient.delete(`/courses/${courseId}`);
  return response?.data?.data || response?.data;
};

export const fetchQuestionsApi = async (filters = {}) => {
  const { courseId, chapterId, type, difficulty, isPublished } = filters;

  if (courseId) {
    const response = await httpClient.get(`/questions/course/${courseId}`, {
      params: {
        chapterId: chapterId || undefined,
        type: type || undefined,
        difficulty: difficulty || undefined,
        isPublished: isPublished == null ? undefined : String(Boolean(isPublished)),
      },
    });
    return response?.data?.data || response?.data || [];
  }

  const response = await httpClient.get('/questions');
  return response?.data?.data || response?.data || [];
};

export const createQuestionApi = async (payload) => {
  const response = await httpClient.post('/questions', payload);
  return response?.data?.data || response?.data;
};

export const updateQuestionApi = async (id, payload) => {
  const response = await httpClient.put(`/questions/${id}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteQuestionApi = async (id) => {
  const response = await httpClient.delete(`/questions/${id}`);
  return response?.data?.data || response?.data;
};

export const createQuizApi = async (payload) => {
  const response = await httpClient.post('/quiz-manager', payload);
  return response?.data?.data || response?.data;
};

export const fetchTeacherQuizzesApi = async () => {
  const response = await httpClient.get('/quiz-manager/my-quizzes');
  return response?.data?.data || response?.data || [];
};

export const addQuestionToQuizApi = async (quizId, questionId, payload = {}) => {
  const response = await httpClient.post(`/quiz-manager/${quizId}/questions/${questionId}`, payload);
  return response?.data?.data || response?.data;
};

export const removeQuestionFromQuizApi = async (quizId, questionId) => {
  const response = await httpClient.delete(`/quiz-manager/${quizId}/questions/${questionId}`);
  return response?.data?.data || response?.data;
};
