const { sequelize } = require('../config/database');
const { Question } = require('../models');

const toObject = (value, fallback = {}) => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  return value && typeof value === 'object' ? value : fallback;
};

const normalizeBlocks = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      if (!block || typeof block !== 'object') return null;
      const type = String(block.type || 'text').toLowerCase();

      if (type === 'text') {
        const text = String(block.text || '').trim();
        return text ? { type: 'text', text } : null;
      }

      if (type === 'image') {
        const url = String(block.url || '').trim();
        if (!url) return null;
        return {
          type: 'image',
          url,
          alt: String(block.alt || '').trim(),
          title: String(block.title || '').trim(),
        };
      }

      if (type === 'video') {
        const url = String(block.url || '').trim();
        if (!url) return null;
        return {
          type: 'video',
          url,
          title: String(block.title || '').trim(),
        };
      }

      return null;
    })
    .filter(Boolean);
};

const optionToText = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option).trim();
  }

  if (option && typeof option === 'object') {
    if (typeof option.text === 'string' && option.text.trim()) {
      return option.text.trim();
    }

    if (Array.isArray(option.contentBlocks)) {
      const text = option.contentBlocks
        .filter((block) => String(block?.type || '').toLowerCase() === 'text')
        .map((block) => String(block.text || '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      if (text) return text;
    }
  }

  return '';
};

const toIndex = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const v = value.trim().toUpperCase();
    if (!v) return null;

    if (/^[A-Z]$/.test(v)) {
      return v.charCodeAt(0) - 65;
    }

    const asNumber = Number(v);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }
  }

  return null;
};

const normalizeCorrectIndices = (item, optionsLength) => {
  const raw = Array.isArray(item.correctIndices)
    ? item.correctIndices
    : Array.isArray(item.correct_answers)
      ? item.correct_answers
      : item.correctIndex != null
        ? [item.correctIndex]
        : item.answerIndex != null
          ? [item.answerIndex]
          : item.correctOptionIndex != null
            ? [item.correctOptionIndex]
            : item.correct != null
              ? [item.correct]
              : [];

  const normalized = raw
    .map((value) => toIndex(value))
    .filter((value) => Number.isFinite(value) && value >= 0 && value < optionsLength);

  return normalized.length ? normalized : (optionsLength > 0 ? [0] : []);
};

const normalizeOptionsRich = (item, optionsText) => {
  const source = Array.isArray(item.optionsRich) ? item.optionsRich : [];
  if (source.length) {
    return source.map((blocks) => normalizeBlocks(blocks));
  }

  const options = Array.isArray(item.options) ? item.options : [];
  const richFromOptions = options.map((option, index) => {
    if (option && typeof option === 'object' && Array.isArray(option.contentBlocks)) {
      return normalizeBlocks(option.contentBlocks);
    }

    const text = String(optionsText[index] || '').trim();
    return text ? [{ type: 'text', text }] : [];
  });

  return richFromOptions;
};

const normalizeInnerQuestion = (item = {}) => {
  const type = String(item.type || 'MULTIPLE_CHOICE').toUpperCase().replace(/\s+/g, '_');
  const normalizedType = type === 'MULTICHOICE' ? 'MULTIPLE_CHOICE' : type;
  const content = String(item.content || item.questionText || '').trim();

  const normalized = {
    ...item,
    type: normalizedType,
    points: Number(item.points) > 0 ? Number(item.points) : 1,
    content,
    contentBlocks: normalizeBlocks(item.contentBlocks),
    explanation: String(item.explanation || '').trim(),
    isPublished: Boolean(item.isPublished),
  };

  if (!normalized.contentBlocks.length && content) {
    normalized.contentBlocks = [{ type: 'text', text: content }];
  }

  if (normalizedType === 'MULTIPLE_CHOICE') {
    const optionsText = (Array.isArray(item.options) ? item.options : [])
      .map((option) => optionToText(option))
      .filter((option) => String(option || '').trim().length > 0);

    normalized.options = optionsText;
    normalized.optionsRich = normalizeOptionsRich(item, optionsText).slice(0, Math.max(optionsText.length, 2));
    normalized.correctIndices = normalizeCorrectIndices(item, normalized.options.length);
    normalized.allowMultipleCorrect = Boolean(item.allowMultipleCorrect);
  } else if (normalizedType === 'TRUE_FALSE') {
    if (typeof item.correctAnswer === 'boolean') {
      normalized.correctAnswer = item.correctAnswer;
    } else if (item.correct != null) {
      normalized.correctAnswer = item.correct === true || String(item.correct).trim().toLowerCase() === 'true';
    } else {
      normalized.correctAnswer = true;
    }
  } else if (normalizedType === 'SHORT_ANSWER') {
    const accepted = Array.isArray(item.acceptedAnswers)
      ? item.acceptedAnswers
      : String(item.acceptedAnswersText || item.correct || '')
          .split('|')
          .map((answer) => String(answer || '').trim())
          .filter(Boolean);

    normalized.acceptedAnswers = accepted;
    normalized.caseSensitive = Boolean(item.caseSensitive);
    normalized.fuzzyMatch = item.fuzzyMatch != null ? Boolean(item.fuzzyMatch) : true;
  } else if (normalizedType === 'NUMERICAL') {
    normalized.correct = Number.isFinite(Number(item.correct)) ? Number(item.correct) : 0;
    normalized.tolerance = Number.isFinite(Number(item.tolerance)) ? Number(item.tolerance) : 0;
  } else if (normalizedType === 'ESSAY') {
    normalized.instructions = String(item.instructions || '').trim();
    normalized.rubric = Array.isArray(item.rubric) ? item.rubric : [];
  }

  return normalized;
};

const normalizeInnerQuestions = (innerQuestions) => {
  if (Array.isArray(innerQuestions)) {
    return innerQuestions.reduce((acc, item, index) => {
      acc[`q${index + 1}`] = normalizeInnerQuestion(item);
      return acc;
    }, {});
  }

  if (!innerQuestions || typeof innerQuestions !== 'object') {
    return {};
  }

  return Object.entries(innerQuestions).reduce((acc, [key, item], index) => {
    const normalizedKey = String(key || '').trim() || `q${index + 1}`;
    acc[normalizedKey] = normalizeInnerQuestion(item || {});
    return acc;
  }, {});
};

const normalizeClozeMetadata = (metadata) => {
  const base = toObject(metadata, {});
  return {
    ...base,
    contentBlocks: normalizeBlocks(base.contentBlocks),
    text_template: String(base.text_template || '').trim(),
    inner_questions: normalizeInnerQuestions(base.inner_questions),
  };
};

const run = async ({ apply = false } = {}) => {
  const questions = await Question.findAll({
    where: { type: 'CLOZE' },
    attributes: ['id', 'metadata'],
    order: [['id', 'ASC']],
  });

  let inspected = 0;
  let changed = 0;

  const tx = apply ? await sequelize.transaction() : null;

  try {
    for (const question of questions) {
      inspected += 1;
      const current = toObject(question.metadata, {});
      const normalized = normalizeClozeMetadata(current);

      if (JSON.stringify(current) === JSON.stringify(normalized)) {
        continue;
      }

      changed += 1;
      console.log(`- CLOZE #${question.id}: metadata cần chuẩn hóa`);

      if (apply) {
        question.metadata = normalized;
        await question.save({ transaction: tx, silent: false });
      }
    }

    if (tx) {
      await tx.commit();
    }

    console.log('\n===== KET QUA =====');
    console.log(`Tổng CLOZE đã quét: ${inspected}`);
    console.log(`Cần chuẩn hóa: ${changed}`);
    console.log(apply ? 'Đã cập nhật dữ liệu vào DB.' : 'Đang chạy DRY-RUN (không ghi DB). Dùng --apply để ghi.');
  } catch (error) {
    if (tx) {
      await tx.rollback();
    }
    throw error;
  }
};

if (require.main === module) {
  const shouldApply = process.argv.includes('--apply');

  (async () => {
    try {
      await run({ apply: shouldApply });
      await sequelize.close();
      console.log('Done.');
    } catch (error) {
      console.error('Loi normalize CLOZE:', error);
      process.exitCode = 1;
      try {
        await sequelize.close();
      } catch (_closeError) {
        // ignore
      }
    }
  })();
}

module.exports = { run, normalizeClozeMetadata };
