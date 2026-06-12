const { StudentAnswer, StudentQuizAttempt } = require('../models');
const { HttpError } = require('../utils/httpError');
const { verifyWebhook } = require('../services/graderService');

/**
 * POST /api/external-grader/webhook
 * Payload expected: { requestId, attemptId, questionId, score, maxScore, feedback, criteria }
 */
const webhookHandler = async (req, res, next) => {
  try {
    // Optional: verify signature
    const secret = process.env.EXTERNAL_GRADER_WEBHOOK_SECRET || null;
    if (secret) {
      const ok = verifyWebhook(req, secret);
      if (!ok) {
        throw new HttpError(403, 'Invalid webhook signature');
      }
    }

    const payload = req.body || {};
    const { attemptId, questionId, score, feedback, criteria, requestId } = payload;

    if (!attemptId || !questionId) {
      return res.status(400).json({ message: 'Missing attemptId or questionId' });
    }

    // Find existing StudentAnswer record for this attempt/question
    const sa = await StudentAnswer.findOne({ where: { attemptId, questionId } });

    if (!sa) {
      // If not found, create a new StudentAnswer placeholder
      await StudentAnswer.create({
        attemptId,
        questionId,
        answerType: 'ESSAY',
        answerValue: null,
        score: Number(score || 0),
        gradingDetails: { requestId, criteria } || null,
        aiFeedback: feedback || null,
      });

      return res.status(201).json({ message: 'Created student answer with grading result' });
    }

    sa.score = Number(score || 0);
    sa.gradingDetails = { requestId, criteria } || null;
    sa.aiFeedback = feedback || null;
    await sa.save();

    // Optionally update attempt total score — leave it to existing job/process

    return res.status(200).json({ message: 'Grading result applied' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { webhookHandler };
