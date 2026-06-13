const questionTypeConfigService = require('../services/questionTypeConfigService');

const getQuestionTypes = async (req, res, next) => {
  try {
    const data = await questionTypeConfigService.getQuestionTypes();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getQuestionTypeByCode = async (req, res, next) => {
  try {
    const data = await questionTypeConfigService.getQuestionTypeByCode(req.params.code);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestionType = async (req, res, next) => {
  try {
    const data = await questionTypeConfigService.updateQuestionType(
      req.params.code,
      req.body,
    );

    res.json({
      success: true,
      data,
      message: 'Đã cập nhật cấu hình loại câu hỏi.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestionTypes,
  getQuestionTypeByCode,
  updateQuestionType,
};