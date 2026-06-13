import httpClient from './httpClient';

export const fetchMyTeacherCoursesApi = async () => {
  const response = await httpClient.get('/teachers/courses');
  return response?.data?.data || response?.data || [];
};

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

export const fetchTeacherCourseLessonsApi = async (courseId) => {
  const response = await httpClient.get(`/teachers/courses/${courseId}/lessons`);
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

export const reorderLessonSegmentsApi = async (lessonId, payload) => {
  const response = await httpClient.put(`/lessons/${lessonId}/segments/reorder`, payload);
  return response?.data?.data || response?.data;
};

export const deleteLessonSegmentApi = async (segmentId) => {
  const response = await httpClient.delete(`/lessons/segments/${segmentId}`);
  return response?.data?.data || response?.data;
};

export const fetchLessonLabelsApi = async (lessonId) => {
  const response = await httpClient.get(`/lessons/${lessonId}/labels`);
  return response?.data?.data || response?.data || [];
};

export const createLessonLabelApi = async (lessonId, payload) => {
  const response = await httpClient.post(`/lessons/${lessonId}/labels`, payload);
  return response?.data?.data || response?.data;
};

export const updateLessonLabelApi = async (labelId, payload) => {
  const response = await httpClient.put(`/lessons/labels/${labelId}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteLessonLabelApi = async (labelId) => {
  const response = await httpClient.delete(`/lessons/labels/${labelId}`);
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
  const { courseId, chapterId, lectureId, segmentId, type, difficulty, isPublished } = filters;

  if (courseId) {
    const response = await httpClient.get(`/questions/course/${courseId}`, {
      params: {
        chapterId: chapterId || undefined,
        lectureId: lectureId || undefined,
        segmentId: segmentId || undefined,
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
export const getTeacherQuizDetailApi = async (quizId) => {
  const response = await httpClient.get(`/quiz-manager/${quizId}`);
  return response?.data?.data || response?.data;
};

export const updateTeacherQuizApi = async (quizId, payload) => {
  const response = await httpClient.put(`/quiz-manager/${quizId}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteTeacherQuizApi = async (quizId) => {
  const response = await httpClient.delete(`/quiz-manager/${quizId}`);
  return response?.data?.data || response?.data;
};

export const createSurveyApi = async (payload) => {
  const response = await httpClient.post('/surveys', payload);
  return response?.data?.data || response?.data;
};

export const fetchSurveysByCourseApi = async (courseId) => {
  const response = await httpClient.get(`/surveys/course/${courseId}`);
  return response?.data?.data || response?.data || [];
};

export const getSurveyDetailApi = async (surveyId) => {
  const response = await httpClient.get(`/surveys/${surveyId}`);
  return response?.data?.data || response?.data;
};

export const submitSurveyResponseApi = async (surveyId, payload) => {
  const response = await httpClient.post(`/surveys/${surveyId}/responses`, payload);
  return response?.data?.data || response?.data;
};

export const getSurveyResponsesApi = async (surveyId) => {
  const response = await httpClient.get(`/surveys/${surveyId}/responses`);
  return response?.data?.data || response?.data || [];
};

// Comment APIs
export const getCommentsApi = async (courseId, lessonId = null, chapterId = null) => {
  const params = new URLSearchParams({ courseId });

  if (lessonId) {
    params.append('lessonId', lessonId);
  }

  if (chapterId) {
    params.append('chapterId', chapterId);
  }

  const response = await httpClient.get(`/comments?${params.toString()}`);
  return response?.data?.data || response?.data || [];
};

export const createCommentApi = async (payload) => {
  const response = await httpClient.post('/comments', payload);
  return response?.data?.data || response?.data;
};

export const updateCommentApi = async (commentId, payload) => {
  const response = await httpClient.put(`/comments/${commentId}`, payload);
  return response?.data?.data || response?.data;
};

export const deleteCommentApi = async (commentId) => {
  const response = await httpClient.delete(`/comments/${commentId}`);
  return response?.data?.data || response?.data;
};

// Reviews
export const createReviewApi = async (payload) => {
  const response = await httpClient.post('/reviews', payload);
  return response?.data?.data || response?.data;
};

export const fetchReviewsByCourseApi = async (courseId) => {
  const response = await httpClient.get(`/reviews/course/${courseId}`);
  return response?.data?.data || response?.data || {
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
  };
};

export const addQuestionToQuizApi = async (quizId, questionId, payload = {}) => {
  const response = await httpClient.post(`/quiz-manager/${quizId}/questions/${questionId}`, payload);
  return response?.data?.data || response?.data;
};

export const removeQuestionFromQuizApi = async (quizId, questionId) => {
  const response = await httpClient.delete(`/quiz-manager/${quizId}/questions/${questionId}`);
  return response?.data?.data || response?.data;
};