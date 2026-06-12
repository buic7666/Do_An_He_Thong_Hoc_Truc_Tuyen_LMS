const axios = require('axios');
const { HttpError } = require('../utils/httpError');

const EXTERNAL_URL = process.env.EXTERNAL_GRADER_URL || null;
const EXTERNAL_KEY = process.env.EXTERNAL_GRADER_KEY || null;
const TIMEOUT_MS = Number(process.env.EXTERNAL_GRADER_TIMEOUT_MS || 10000);

const defaultHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (EXTERNAL_KEY) headers['Authorization'] = `Bearer ${EXTERNAL_KEY}`;
  return headers;
};

async function callExternalGrader(payload) {
  if (!EXTERNAL_URL) {
    throw new HttpError(500, 'External grader not configured');
  }

  const maxRetries = 3;
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxRetries) {
    try {
      const start = Date.now();
      const res = await axios.post(EXTERNAL_URL, payload, {
        headers: defaultHeaders(),
        timeout: TIMEOUT_MS,
      });

      const latency = Date.now() - start;
      // Normalize response
      const data = res.data || {};
      const score = data.score ?? data.totalScore ?? null;
      const maxScore = data.maxScore ?? 100;
      const normalizedScore = typeof score === 'number' && maxScore ? score / maxScore : null;

      return {
        score,
        maxScore,
        normalizedScore,
        feedback: data.feedback ?? data.overallFeedback ?? null,
        breakdown: data.criteria ?? data.breakdown ?? null,
        raw: data,
        meta: { latency },
      };
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      // Retry only on 5xx or network errors
      if (status && status >= 500 && status < 600) {
        attempt += 1;
        const backoff = 500 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      // If 429, respect Retry-After if present
      if (status === 429) {
        const retryAfter = Number(err.response.headers['retry-after'] || 1) * 1000;
        await new Promise((r) => setTimeout(r, retryAfter));
        attempt += 1;
        continue;
      }

      // Non-retriable
      break;
    }
  }

  console.error('[GraderService] callExternalGrader failed:', lastErr && lastErr.message);
  throw new HttpError(502, 'External grader call failed');
}

// Placeholder to verify webhook signature if needed
function verifyWebhook(req, secret) {
  // Implement HMAC verification if grader sends X-Signature header
  return true;
}

module.exports = { callExternalGrader, verifyWebhook };
