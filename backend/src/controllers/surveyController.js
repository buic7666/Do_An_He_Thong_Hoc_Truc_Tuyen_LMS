const surveyService = require('../services/surveyService');
const { successResponse } = require('../utils/response');

const createSurvey = async (req, res, next) => {
  try {
    const result = await surveyService.createSurvey(req.body, req.user);
    return successResponse(res, 'Survey created', result, 201);
  } catch (error) {
    return next(error);
  }
};

const getSurveysByCourse = async (req, res, next) => {
  try {
    const result = await surveyService.getSurveysByCourse(req.params.courseId);
    return successResponse(res, 'Surveys retrieved', result, 200);
  } catch (error) {
    return next(error);
  }
};

const getSurveyDetail = async (req, res, next) => {
  try {
    const result = await surveyService.getSurveyDetail(req.params.id);
    return successResponse(res, 'Survey detail', result, 200);
  } catch (error) {
    return next(error);
  }
};

const submitSurveyResponse = async (req, res, next) => {
  try {
    const anonymous = req.body.anonymous != null ? Boolean(req.body.anonymous) : true;
    const result = await surveyService.submitSurveyResponse(req.params.id, req.body, req.user, anonymous);
    return successResponse(res, 'Response recorded', result, 201);
  } catch (error) {
    return next(error);
  }
};

const getSurveyResponses = async (req, res, next) => {
  try {
    const result = await surveyService.getSurveyResponses(req.params.id);
    return successResponse(res, 'Survey responses', result, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSurvey,
  getSurveysByCourse,
  getSurveyDetail,
  submitSurveyResponse,
  getSurveyResponses,
};
