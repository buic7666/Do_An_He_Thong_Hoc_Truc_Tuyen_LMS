const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

// Simple sync grader: returns a random-ish score based on length
app.post('/grade', async (req, res) => {
  const payload = req.body || {};
  const mode = payload.mode || 'sync';

  // compute naive score
  const text = (payload.answer && payload.answer.text) || (payload.student && payload.student.answer) || '';
  const len = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  const score = Math.min(100, Math.round(Math.min(100, len * 2 + Math.floor(Math.random() * 10))));

  if (mode === 'async') {
    const jobId = `job-${Date.now()}`;
    // respond accepted
    res.status(202).json({ jobId, status: 'pending' });

    // simulate processing and callback
    const callbackUrl = payload.webhookUrl || (payload.metadata && payload.metadata.webhookUrl) || null;
    if (callbackUrl) {
      setTimeout(async () => {
        try {
          await axios.post(callbackUrl, {
            requestId: payload.requestId || null,
            attemptId: payload.student?.attemptId || payload.attemptId || null,
            questionId: payload.question?.id || null,
            score,
            maxScore: payload.rubric?.maxScore || 100,
            feedback: `Auto-grade (mock): length ${len} words`,
            criteria: payload.rubric?.criteria || null,
          });
          // eslint-disable-next-line no-console
          console.log('Callback sent to', callbackUrl);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Callback error', err?.message || err);
        }
      }, 3000);
    }

    return;
  }

  return res.json({
    requestId: payload.requestId || null,
    score,
    maxScore: payload.rubric?.maxScore || 100,
    normalizedScore: score / (payload.rubric?.maxScore || 100),
    feedback: `Mock grader: ${len} words`,
    breakdown: payload.rubric?.criteria ? payload.rubric.criteria.map((c) => ({ id: c.id || c.name, score: Math.round((c.weight || 1) * score / 100 * 100) })) : null,
  });
});

const port = process.env.MOCK_GRADER_PORT || 9090;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock grader listening on http://localhost:${port}`);
});
