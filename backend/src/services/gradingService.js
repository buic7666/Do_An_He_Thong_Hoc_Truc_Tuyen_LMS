const { Configuration, OpenAIApi } = require('openai');
const { env } = require('../config/env');
const { HttpError } = require('../utils/httpError');

/**
 * ============================================================
 * GRADING SERVICE - Chấm điểm tự động cho 4 loại câu hỏi
 * ============================================================
 *
 * Hỗ trợ:
 * 1. MULTIPLE_CHOICE: Auto-grade (tất cả đúng = 100%, sai = 0%)
 * 2. TRUE_FALSE: Auto-grade (đúng = 100%, sai = 0%)
 * 3. SHORT_ANSWER: Auto-grade (so sánh chuỗi, hỗ trợ fuzzy match)
 * 4. ESSAY: AI-grade (gọi OpenAI API)
 */

let openaiClient = null;

// ===== KHỞI TẠO OpenAI Client =====
const initializeOpenAI = () => {
  if (!openaiClient && env.openai?.apiKey) {
    const configuration = new Configuration({
      apiKey: env.openai.apiKey,
    });
    openaiClient = new OpenAIApi(configuration);
  }
  return openaiClient;
};

// ===== HỀ HELPER FUNCTIONS =====

/**
 * Normalize text để so sánh câu trả lời ngắn
 * @param {string} text - Text cần normalize
 * @param {boolean} caseSensitive - Có phân biệt hoa thường không?
 * @returns {string} Text đã được normalize
 */
const normalizeText = (text, caseSensitive = false) => {
  let normalized = String(text).trim();

  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  // Xóa dấu câu thừa, spaces thừa
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
};

const normalizeComparableText = (text, caseSensitive = false) => {
  const normalized = normalizeText(text, caseSensitive);
  return normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Tính độ tương đồng giữa 2 chuỗi (Levenshtein distance)
 * Trả về % tương đồng (0-1)
 *
 * @param {string} str1
 * @param {string} str2
 * @returns {number} 0-1
 */
const stringSimilarity = (str1, str2) => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distances = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    distances[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    distances[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      distances[j][i] = Math.min(
        distances[j][i - 1] + 1, // Insertion
        distances[j - 1][i] + 1, // Deletion
        distances[j - 1][i - 1] + indicator // Substitution
      );
    }
  }

  const levenshteinDistance = distances[str2.length][str1.length];
  const similarity = 1 - levenshteinDistance / maxLength;

  return Math.max(0, Math.min(1, similarity));
};

// ===== GRADING FUNCTIONS =====

/**
 * Chấm câu MULTIPLE_CHOICE
 *
 * @param {object} studentAnswer - Đáp án học viên
 *   VD: { indices: [0, 2] } (chọn option 0 và 2)
 * @param {object} metadata - Metadata câu hỏi
 *   VD: { options: ["A", "B", "C"], correctIndices: [0, 2], explanation: "..." }
 * @returns {object} { score: 0-100, details: {...} }
 */
const gradeMultipleChoice = (studentAnswer, metadata) => {
  try {
    const studentIndices = studentAnswer?.indices || [];
    const correctIndices = metadata?.correctIndices || [];

    // So sánh array indices
    const isCorrect =
      studentIndices.length === correctIndices.length &&
      studentIndices.every((idx) => correctIndices.includes(idx)) &&
      correctIndices.every((idx) => studentIndices.includes(idx));

    const score = isCorrect ? 100 : 0;

    return {
      score,
      details: {
        type: 'MULTIPLE_CHOICE',
        studentIndices,
        correctIndices,
        isCorrect,
        explanation: metadata?.explanation || null,
      },
    };
  } catch (error) {
    console.error('[GradingService] Error grading MULTIPLE_CHOICE:', error);
    throw new HttpError(500, 'Error grading multiple choice question');
  }
};

/**
 * Chấm câu TRUE_FALSE
 *
 * @param {object} studentAnswer - Đáp án học viên
 *   VD: { value: true }
 * @param {object} metadata - Metadata câu hỏi
 *   VD: { correctAnswer: true, explanation: "..." }
 * @returns {object} { score: 0-100, details: {...} }
 */
const gradeTrueFalse = (studentAnswer, metadata) => {
  try {
    const studentValue = studentAnswer?.value;
    const correctAnswer = metadata?.correctAnswer;

    const isCorrect = studentValue === correctAnswer;
    const score = isCorrect ? 100 : 0;

    return {
      score,
      details: {
        type: 'TRUE_FALSE',
        studentValue,
        correctAnswer,
        isCorrect,
        explanation: metadata?.explanation || null,
      },
    };
  } catch (error) {
    console.error('[GradingService] Error grading TRUE_FALSE:', error);
    throw new HttpError(500, 'Error grading true/false question');
  }
};

/**
 * Chấm câu SHORT_ANSWER
 *
 * @param {object} studentAnswer - Đáp án học viên
 *   VD: { text: "Python" }
 * @param {object} metadata - Metadata câu hỏi
 *   VD: {
 *     acceptedAnswers: ["python", "py", "Python"],
 *     caseSensitive: false,
 *     fuzzyMatch: true,
 *     explanation: "..."
 *   }
 * @returns {object} { score: 0-100, details: {...} }
 */
const gradeShortAnswer = (studentAnswer, metadata) => {
  try {
    const studentText = studentAnswer?.text || '';
    const acceptedAnswers = metadata?.acceptedAnswers || [];
    const caseSensitive = metadata?.caseSensitive || false;
    const fuzzyMatchEnabled = metadata?.fuzzyMatch || false;
    const fuzzyThreshold = 0.8; // 80% tương đồng thì coi là đúng

    const normalizedStudent = normalizeText(studentText, caseSensitive);

    let isCorrect = false;
    let matchedAnswer = null;

    // Kiểm tra exact match trước
    for (const answer of acceptedAnswers) {
      const normalizedAnswer = normalizeText(answer, caseSensitive);

      if (normalizedStudent === normalizedAnswer) {
        isCorrect = true;
        matchedAnswer = answer;
        break;
      }
    }

    // Nếu không exact match, thử fuzzy match
    if (!isCorrect && fuzzyMatchEnabled) {
      for (const answer of acceptedAnswers) {
        const normalizedAnswer = normalizeText(answer, caseSensitive);
        const similarity = stringSimilarity(normalizedStudent, normalizedAnswer);

        if (similarity >= fuzzyThreshold) {
          isCorrect = true;
          matchedAnswer = answer;
          break;
        }
      }
    }

    const score = isCorrect ? 100 : 0;

    return {
      score,
      details: {
        type: 'SHORT_ANSWER',
        studentText,
        acceptedAnswers,
        isCorrect,
        matchedAnswer,
        caseSensitive,
        fuzzyMatchEnabled,
        explanation: metadata?.explanation || null,
      },
    };
  } catch (error) {
    console.error('[GradingService] Error grading SHORT_ANSWER:', error);
    throw new HttpError(500, 'Error grading short answer question');
  }
};

/**
 * Chấm câu ESSAY bằng AI (OpenAI)
 *
 * @param {object} studentAnswer - Đáp án học viên
 *   VD: { text: "Bài viết dài..." }
 * @param {object} metadata - Metadata câu hỏi
 *   VD: {
 *     instructions: "Viết về...",
 *     rubric: [
 *       { name: "Kiến thức", weight: 40, description: "..." },
 *       { name: "Ví dụ", weight: 30, description: "..." },
 *       { name: "Ngôn ngữ", weight: 30, description: "..." }
 *     ],
 *     wordLimit: { min: 100, max: 500 },
 *     aiModel: "gpt-4"
 *   }
 * @param {object} questionContent - Nội dung câu hỏi
 * @returns {object} { score: 0-100, details: {...}, aiFeedback: {...} }
 */
const gradeEssay = async (studentAnswer, metadata, questionContent) => {
  try {
    const client = initializeOpenAI();

    if (!client) {
      throw new HttpError(500, 'OpenAI API not configured');
    }

    const studentText = studentAnswer?.text || '';
    const wordCount = studentText.split(/\s+/).filter((w) => w.length > 0).length;
    const wordLimit = metadata?.wordLimit || { min: 0, max: Infinity };
    const rubric = metadata?.rubric || [];
    const instructions = metadata?.instructions || '';
    const aiModel = metadata?.aiModel || 'gpt-3.5-turbo';

    // Kiểm tra word limit
    const withinWordLimit =
      wordCount >= wordLimit.min && wordCount <= wordLimit.max;

    // Chuẩn bị prompt cho AI
    const rubricText = rubric
      .map((c) => `- ${c.name} (${c.weight}% trọng số): ${c.description}`)
      .join('\n');

    const systemPrompt = `Bạn là một giáo viên chuyên môn chấm điểm bài tự luận.
Hãy chấm điểm bài viết dựa trên rubric sau:

${rubricText}

Yêu cầu:
1. Chấm mỗi tiêu chí từ 0-100
2. Trả về JSON với cấu trúc: {
     "criteria": [
       {"name": "Tên tiêu chí", "score": 0-100, "feedback": "Chi tiết feedback"},
       ...
     ],
     "totalScore": 0-100,
     "overallFeedback": "Nhận xét chung"
   }
3. totalScore = trung bình có trọng số của các tiêu chí
4. Feedback phải chi tiết, xây dựng, và bằng tiếng Việt`;

    const userPrompt = `Câu hỏi: ${questionContent}

Hướng dẫn: ${instructions}

Bài viết của học viên:
---
${studentText}
---

Vui lòng chấm điểm bài viết này dựa theo rubric.`;

    const response = await client.createChatCompletion({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = response.data.choices[0].message.content;

    // Parse JSON response từ AI
    let aiGradingResult;
    try {
      // Tìm JSON trong response (có thể có text trước/sau)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiGradingResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('[GradingService] Error parsing AI response:', parseError);
      throw new HttpError(500, 'Error parsing AI grading response');
    }

    // Tính final score
    const finalScore = aiGradingResult.totalScore || 0;

    return {
      score: finalScore,
      details: {
        type: 'ESSAY',
        wordCount,
        withinWordLimit,
        criteria: aiGradingResult.criteria || [],
        totalScore: finalScore,
      },
      aiFeedback: {
        criteria: aiGradingResult.criteria || [],
        overallFeedback: aiGradingResult.overallFeedback || '',
        model: aiModel,
      },
    };
  } catch (error) {
    console.error('[GradingService] Error grading ESSAY:', error);
    throw new HttpError(500, `Error grading essay: ${error.message}`);
  }
};

const gradeCloze = (studentAnswer, metadata) => {
  try {
    const innerQuestions = metadata?.inner_questions && typeof metadata.inner_questions === 'object'
      ? metadata.inner_questions
      : {};
    const entries = Object.entries(innerQuestions);

    if (!entries.length) {
      return {
        score: 0,
        details: {
          type: 'CLOZE',
          message: 'Không có câu hỏi nhỏ để chấm.',
          blanks: [],
        },
      };
    }

    const answerMap = studentAnswer && typeof studentAnswer === 'object' ? studentAnswer : {};
    let weightedTotal = 0;
    let totalWeight = 0;
    const blanks = [];

    for (const [key, inner] of entries) {
      const innerType = String(inner?.type || 'SHORT_ANSWER').toUpperCase() === 'MULTICHOICE'
        ? 'MULTIPLE_CHOICE'
        : String(inner?.type || 'SHORT_ANSWER').toUpperCase();
      const weight = Number(inner?.points || 1);
      const rawAnswer = answerMap[key];
      let result = { score: 0, details: {} };

      if (innerType === 'MULTIPLE_CHOICE') {
        const options = Array.isArray(inner?.options) ? inner.options : [];
        const normalizedRaw = normalizeComparableText(rawAnswer ?? '', false);
        const selectedIndex = options.findIndex(
          (option) => normalizeComparableText(option ?? '', false) === normalizedRaw,
        );

        result = gradeMultipleChoice(
          { indices: selectedIndex >= 0 ? [selectedIndex] : [] },
          {
            correctIndices: Array.isArray(inner?.correctIndices)
              ? inner.correctIndices
              : (typeof inner?.correctIndex === 'number' ? [Number(inner.correctIndex)] : []),
            explanation: inner?.explanation || null,
          },
        );
      } else if (innerType === 'TRUE_FALSE') {
        let boolValue = rawAnswer;
        if (typeof rawAnswer === 'string') {
          const lowered = rawAnswer.trim().toLowerCase();
          if (lowered === 'true' || lowered === 'đúng') {
            boolValue = true;
          } else if (lowered === 'false' || lowered === 'sai') {
            boolValue = false;
          }
        }

        result = gradeTrueFalse(
          { value: Boolean(boolValue) === boolValue ? boolValue : null },
          { correctAnswer: inner?.correctAnswer === true, explanation: inner?.explanation || null },
        );
      } else {
        const acceptedAnswers = Array.isArray(inner?.acceptedAnswers) && inner.acceptedAnswers.length
          ? inner.acceptedAnswers
          : (inner?.correct != null ? [String(inner.correct)] : []);

        result = gradeShortAnswer(
          { text: String(rawAnswer ?? '') },
          {
            acceptedAnswers,
            caseSensitive: Boolean(inner?.caseSensitive),
            fuzzyMatch: inner?.fuzzyMatch !== false,
            explanation: inner?.explanation || null,
          },
        );
      }

      const score = Number(result?.score || 0);
      weightedTotal += score * weight;
      totalWeight += weight;

      blanks.push({
        key,
        type: innerType,
        score,
        maxScore: 100,
        weight,
        details: result?.details || null,
      });
    }

    const finalScore = totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : 0;

    return {
      score: finalScore,
      details: {
        type: 'CLOZE',
        totalWeight,
        blanks,
      },
    };
  } catch (error) {
    console.error('[GradingService] Error grading CLOZE:', error);
    throw new HttpError(500, 'Error grading cloze question');
  }
};

/**
 * Chấm một câu trả lời (auto-detect loại)
 *
 * @param {object} studentAnswer - Đáp án học viên
 * @param {object} metadata - Metadata câu hỏi
 * @param {string} questionType - Loại câu hỏi
 * @param {string} questionContent - Nội dung câu hỏi (dành cho ESSAY)
 * @returns {Promise<object>} { score, details, aiFeedback? }
 */
const gradeAnswer = async (
  studentAnswer,
  metadata,
  questionType,
  questionContent
) => {
  switch (questionType) {
    case 'MULTIPLE_CHOICE':
      return gradeMultipleChoice(studentAnswer, metadata);

    case 'TRUE_FALSE':
      return gradeTrueFalse(studentAnswer, metadata);

    case 'SHORT_ANSWER':
      return gradeShortAnswer(studentAnswer, metadata);

    case 'ESSAY':
      return gradeEssay(studentAnswer, metadata, questionContent);

    case 'CLOZE':
      return gradeCloze(studentAnswer, metadata);

    default:
      throw new HttpError(400, `Unknown question type: ${questionType}`);
  }
};

module.exports = {
  gradeMultipleChoice,
  gradeTrueFalse,
  gradeShortAnswer,
  gradeEssay,
  gradeCloze,
  gradeAnswer,
  normalizeText,
  stringSimilarity,
  initializeOpenAI,
};
