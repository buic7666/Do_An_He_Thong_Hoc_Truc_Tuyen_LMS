const Survey = require('../models/survey.model');
const SurveyQuestion = require('../models/surveyQuestion.model');
const SurveyResponse = require('../models/surveyResponse.model');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const createSurvey = async (payload, currentUser) => {
  const survey = await Survey.create({
    title: payload.title,
    description: payload.description || null,
    isAnonymous: Boolean(payload.isAnonymous),
    isPublished: Boolean(payload.isPublished),
    courseId: payload.courseId || null,
    chapterId: payload.chapterId || null,
    createdBy: currentUser.id,
  });

  if (Array.isArray(payload.questions) && payload.questions.length) {
    const qs = payload.questions.map((q, idx) => ({
      surveyId: survey.id,
      type: q.type,
      questionText: q.questionText,
      metadata: q.options ? { options: q.options } : null,
      orderIndex: q.orderIndex ?? idx,
    }));
    await SurveyQuestion.bulkCreate(qs);
  }

  return survey.toJSON();
};

const getSurveysByCourse = async (courseId) => {
  const surveys = await Survey.findAll({ where: { courseId } });
  return surveys.map((s) => s.toJSON());
};

const getSurveyDetail = async (surveyId) => {
  const id = parseId(surveyId, 'surveyId');
  const survey = await Survey.findByPk(id);
  if (!survey) throw new HttpError(404, 'Survey not found');

  const questions = await SurveyQuestion.findAll({ where: { surveyId: id }, order: [['order_index', 'ASC']] });
  return { ...survey.toJSON(), questions: questions.map((q) => q.toJSON()) };
};

const submitSurveyResponse = async (surveyId, payload, currentUser, anonymous = true) => {
  const id = parseId(surveyId, 'surveyId');
  const survey = await Survey.findByPk(id);
  if (!survey) throw new HttpError(404, 'Survey not found');

  const response = await SurveyResponse.create({
    surveyId: id,
    userId: anonymous ? null : currentUser?.id || null,
    answers: payload.answers,
  });

  return response.toJSON();
};

module.exports = {
  createSurvey,
  getSurveysByCourse,
  getSurveyDetail,
  submitSurveyResponse,
};

const getSurveyResponses = async (surveyId) => {
  const id = parseId(surveyId, 'surveyId');
  const survey = await Survey.findByPk(id);
  if (!survey) throw new HttpError(404, 'Survey not found');

  const questions = await SurveyQuestion.findAll({ where: { surveyId: id } });
  const qMap = {};
  questions.forEach((q) => { qMap[q.id] = q.toJSON(); });

  const responses = await SurveyResponse.findAll({ where: { surveyId: id }, order: [['created_at', 'DESC']] });

  const mapped = responses.map((r) => {
    const ro = r.toJSON();
    const readableAnswers = {};
    const rawAnswers = ro.answers || {};
    Object.keys(rawAnswers).forEach((k) => {
      const q = qMap[k] || { questionText: `Q:${k}` };
      const ans = rawAnswers[k];
      readableAnswers[k] = {
        questionText: q.questionText,
        answer: ans && (ans.value != null ? ans.value : ans.text != null ? ans.text : ans),
      };
    });

    return {
      id: ro.id,
      surveyId: ro.surveyId,
      userId: ro.userId || null,
      createdAt: ro.createdAt || ro.created_at,
      answers: rawAnswers,
      readableAnswers,
    };
  });

  return mapped;
};

module.exports.getSurveyResponses = getSurveyResponses;
