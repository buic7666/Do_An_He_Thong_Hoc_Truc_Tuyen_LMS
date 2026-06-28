import { useEffect, useMemo, useRef, useState } from 'react';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText } from './RichContentEditor';

const QUESTION_TYPES = [
  { value: 'MULTICHOICE', label: 'Trắc nghiệm' },
  { value: 'TRUE_FALSE', label: 'Đúng/Sai' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
  { value: 'NUMERICAL', label: 'Số học' },
  { value: 'ESSAY', label: 'Tự luận' },
];

const QUESTION_TYPE_LABELS = QUESTION_TYPES.reduce((accumulator, item) => {
  accumulator[item.value] = item.label;
  return accumulator;
}, {});

const createInnerQuestionDraft = (index = 0) => ({
  key: `q${index + 1}`,
  content: '',
  contentBlocks: createEmptyRichBlocks(),
  type: 'MULTICHOICE',
  points: 1,
  options: ['', '', '', ''],
  optionsRich: [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()],
  correctIndices: [0],
  acceptedAnswersText: '',
  correct: '',
  tolerance: 0,
  instructions: '',
  rubric: [{ name: 'Nội dung', weight: 100, description: '' }],
  explanation: '',
  isPublished: true,
});

const normalizeBlocksArray = (value) => (Array.isArray(value) ? value : []);

const getYouTubeThumbSrc = (url) => {
  try {
    const parsed = new URL(String(url || '').trim());
    const host = parsed.hostname.replace('www.', '').toLowerCase();
    let id = '';

    if (host === 'youtu.be') {
      id = parsed.pathname.slice(1).split(/[?&#]/)[0] || '';
    } else if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v') || '';
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.split('/embed/')[1]?.split(/[?&#]/)[0] || '';
    } else if (parsed.pathname.startsWith('/shorts/')) {
      id = parsed.pathname.split('/shorts/')[1]?.split(/[?&#]/)[0] || '';
    }

    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  } catch (_error) {
    return '';
  }
};

const optionToText = (item) => {
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item);
  }

  if (item && typeof item === 'object') {
    if (typeof item.text === 'string' && item.text.trim()) {
      return item.text;
    }

    if (Array.isArray(item.contentBlocks)) {
      const plain = richContentToPlainText(item.contentBlocks);
      if (plain) {
        return plain;
      }
    }

    if (Array.isArray(item.blocks)) {
      const plain = richContentToPlainText(item.blocks);
      if (plain) {
        return plain;
      }
    }
  }

  return '';
};

const cloneOptions = (options) => (Array.isArray(options) && options.length > 0
  ? options.map((item) => optionToText(item)).map((item) => String(item ?? ''))
  : ['']);

const toNormalizedOptionsRich = (item) => {
  const source = Array.isArray(item?.optionsRich) ? item.optionsRich : [];
  if (source.length > 0) {
    return source.map((blocks) => normalizeBlocksArray(blocks));
  }

  const options = Array.isArray(item?.options) ? item.options : [];
  return options.map((option) => {
    if (option && typeof option === 'object') {
      if (Array.isArray(option.contentBlocks)) return normalizeBlocksArray(option.contentBlocks);
      if (Array.isArray(option.blocks)) return normalizeBlocksArray(option.blocks);
    }

    const text = optionToText(option).trim();
    return text ? [{ type: 'text', text }] : createEmptyRichBlocks();
  });
};

const collectMediaPreviewItems = (item) => {
  const mediaItems = [];

  const pushBlocks = (blocks, sourceLabel) => {
    normalizeBlocksArray(blocks).forEach((block) => {
      const blockType = String(block?.type || '').toLowerCase();
      if (blockType !== 'image' && blockType !== 'video') {
        return;
      }

      const url = String(block?.url || '').trim();
      if (!url) {
        return;
      }

      const thumb = blockType === 'video' ? (getYouTubeThumbSrc(url) || '') : url;
      mediaItems.push({
        type: blockType,
        sourceLabel,
        url,
        thumb,
        title: String(block?.title || block?.alt || '').trim(),
      });
    });
  };

  pushBlocks(item?.contentBlocks, 'Nội dung');

  toNormalizedOptionsRich(item).forEach((blocks, optionIndex) => {
    pushBlocks(blocks, `Đáp án ${optionIndex + 1}`);
  });

  return mediaItems;
};

const normalizeInitialInnerQuestions = (innerQuestions) => {
  if (!innerQuestions || typeof innerQuestions !== 'object') {
    return [createInnerQuestionDraft(0)];
  }

  const entries = Object.entries(innerQuestions);
  if (!entries.length) {
    return [createInnerQuestionDraft(0)];
  }

  return entries.map(([key, value], index) => ({
    key: key || `q${index + 1}`,
    type: ['MULTICHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'NUMERICAL', 'ESSAY'].includes(value?.type) ? value.type : 'MULTICHOICE',
    points: Number.isFinite(Number(value?.points)) ? Number(value.points) : 1,
    options: (value?.type === 'MULTICHOICE' ? [...cloneOptions(value?.options), '', '', '', ''].slice(0, 4) : cloneOptions(value?.options)),
    optionsRich: value?.type === 'MULTICHOICE'
      ? [...toNormalizedOptionsRich(value), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()].slice(0, 4)
      : (Array.isArray(value?.optionsRich) && value.optionsRich.length ? value.optionsRich : [createEmptyRichBlocks()]),
    content: value?.content == null ? '' : String(value.content),
    contentBlocks: Array.isArray(value?.contentBlocks) ? value.contentBlocks : createEmptyRichBlocks(),
    correctIndices: Array.isArray(value?.correctIndices)
      ? value.correctIndices.map((indexValue) => Number(indexValue)).filter((indexValue) => Number.isFinite(indexValue) && indexValue >= 0 && indexValue < 4)
      : (typeof value?.correctIndex === 'number' ? [Number(value.correctIndex)] : [0]),
    acceptedAnswersText: value?.acceptedAnswersText == null ? '' : String(value.acceptedAnswersText),
    correct: value?.correct == null ? '' : value.correct,
    tolerance: Number.isFinite(Number(value?.tolerance)) ? Number(value.tolerance) : 0,
    instructions: value?.instructions == null ? '' : String(value.instructions),
    rubric: Array.isArray(value?.rubric) && value.rubric.length ? value.rubric : [{ name: 'Nội dung', weight: 100, description: '' }],
    explanation: value?.explanation == null ? '' : String(value.explanation),
    isPublished: true,
  }));
};

const getInnerQuestionKey = (item, index) => String(item?.key || '').trim() || `q${index + 1}`;

const getNextInnerQuestionKey = (items = []) => {
  const maxIndex = items.reduce((maxValue, item) => {
    const match = String(item?.key || '').trim().match(/^q(\d+)$/i);
    const value = match ? Number(match[1]) : 0;
    return Number.isFinite(value) && value > maxValue ? value : maxValue;
  }, 0);

  return `q${maxIndex + 1}`;
};

const normalizeInnerQuestionType = (type) => (type === 'MULTICHOICE' ? 'MULTIPLE_CHOICE' : type);

const normalizeInnerQuestionForEditorType = (item, nextType) => {
  const normalizedType = QUESTION_TYPES.some((questionType) => questionType.value === nextType) ? nextType : 'MULTICHOICE';
  const base = {
    ...item,
    type: normalizedType,
  };

  if (normalizedType === 'MULTICHOICE') {
    const options = [...cloneOptions(base.options), '', '', '', ''].slice(0, 4);
    const optionsRich = [
      ...(Array.isArray(base.optionsRich) && base.optionsRich.length ? base.optionsRich : []),
      createEmptyRichBlocks(),
      createEmptyRichBlocks(),
      createEmptyRichBlocks(),
      createEmptyRichBlocks(),
    ].slice(0, 4);

    return {
      ...base,
      options,
      optionsRich,
      correctIndices: Array.isArray(base.correctIndices) && base.correctIndices.length ? base.correctIndices : [0],
    };
  }

  if (normalizedType === 'ESSAY') {
    return {
      ...base,
      instructions: String(base.instructions || ''),
      rubric: Array.isArray(base.rubric) && base.rubric.length ? base.rubric : [{ name: 'Nội dung', weight: 100, description: '' }],
    };
  }

  if (normalizedType === 'TRUE_FALSE') {
    return {
      ...base,
      correctAnswer: typeof base.correctAnswer === 'boolean' ? base.correctAnswer : true,
    };
  }

  if (normalizedType === 'SHORT_ANSWER') {
    return {
      ...base,
      acceptedAnswersText: String(base.acceptedAnswersText || ''),
    };
  }

  if (normalizedType === 'NUMERICAL') {
    return {
      ...base,
      correct: base.correct ?? '',
      tolerance: Number.isFinite(Number(base.tolerance)) ? Number(base.tolerance) : 0,
    };
  }

  return base;
};

function ClozeQuestionForm({
  initialValue,
  onSubmit,
  onCancel,
  submitLabel = 'Lưu câu hỏi bài đọc',
  compact = false,
  templateText = '',
  onChange,
}) {
  const templateRef = useRef(null);
  const lastEmittedMetadataRef = useRef('');
  const [title, setTitle] = useState(initialValue?.title || '');
  const [textTemplate, setTextTemplate] = useState(initialValue?.text_template || '');
  const [innerQuestions, setInnerQuestions] = useState(() => normalizeInitialInnerQuestions(initialValue?.inner_questions));
  const [showErrors, setShowErrors] = useState(false);
  const [innerEditorOpen, setInnerEditorOpen] = useState(false);
  const [innerEditorMode, setInnerEditorMode] = useState('create');
  const [innerEditorIndex, setInnerEditorIndex] = useState(null);
  const [innerEditorDraft, setInnerEditorDraft] = useState(createInnerQuestionDraft(0));
  const [innerEditorErrors, setInnerEditorErrors] = useState([]);
  const initialTextTemplate = String(initialValue?.text_template || '');
  const initialInnerQuestionsSignature = JSON.stringify(initialValue?.inner_questions || {});

  useEffect(() => {
    if (compact) {
      return;
    }

    setTitle(initialValue?.title || '');
    setTextTemplate(initialValue?.text_template || '');
    setInnerQuestions(normalizeInitialInnerQuestions(initialValue?.inner_questions));
    setShowErrors(false);
    setInnerEditorOpen(false);
    setInnerEditorMode('create');
    setInnerEditorIndex(null);
    setInnerEditorDraft(createInnerQuestionDraft(0));
    setInnerEditorErrors([]);
  }, [compact, initialValue?.title, initialTextTemplate, initialInnerQuestionsSignature]);

  useEffect(() => {
    if (!compact || typeof onChange !== 'function') {
      lastEmittedMetadataRef.current = '';
      return;
    }

    const nextMetadata = {
      text_template: String(templateText || '').trim(),
      inner_questions: innerQuestions.reduce((accumulator, item, index) => {
        const key = getInnerQuestionKey(item, index);
        if (!key) {
          return accumulator;
        }

        const normalized = {
          type: normalizeInnerQuestionType(item.type),
          points: Number(item.points) || 1,
          content: String(item.content || '').trim(),
          contentBlocks: Array.isArray(item.contentBlocks) ? item.contentBlocks : createEmptyRichBlocks(),
          explanation: String(item.explanation || '').trim(),
          isPublished: true,
        };

        if (item.type === 'MULTICHOICE') {
          const normalizedOptionsRich = toNormalizedOptionsRich(item);
          normalized.optionsRich = normalizedOptionsRich;
          normalized.options = cloneOptions(item.options)
            .map((option) => String(option).trim())
            .map((option, optionIndex) => option || richContentToPlainText(normalizedOptionsRich[optionIndex]))
            .filter(Boolean);
          normalized.correctIndices = Array.isArray(item.correctIndices)
            ? item.correctIndices.map((indexValue) => Number(indexValue)).filter((indexValue) => Number.isFinite(indexValue))
            : [0];
          normalized.allowMultipleCorrect = Boolean(item.allowMultipleCorrect);
        } else if (item.type === 'TRUE_FALSE') {
          normalized.correctAnswer = Boolean(item.correctAnswer);
        } else if (item.type === 'SHORT_ANSWER') {
          const acceptedAnswers = String(item.acceptedAnswersText || item.correct || '')
            .split('\n')
            .map((answer) => answer.trim())
            .filter(Boolean);

          normalized.acceptedAnswersText = acceptedAnswers.join('\n');
          normalized.acceptedAnswers = acceptedAnswers;
          normalized.correct = acceptedAnswers[0] || String(item.correct || '').trim();
          normalized.caseSensitive = Boolean(item.caseSensitive);
          normalized.fuzzyMatch = item.fuzzyMatch !== false;
        } else if (item.type === 'NUMERICAL') {
          normalized.correct = Number(item.correct);
          normalized.tolerance = Number.isFinite(Number(item.tolerance)) ? Number(item.tolerance) : 0;
        } else if (item.type === 'ESSAY') {
          normalized.instructions = String(item.instructions || '').trim();
          normalized.rubric = Array.isArray(item.rubric)
            ? item.rubric
                .map((rubricItem) => ({
                  name: String(rubricItem?.name || '').trim(),
                  weight: Number(rubricItem?.weight) || 0,
                  description: String(rubricItem?.description || '').trim(),
                }))
                .filter((rubricItem) => rubricItem.name && rubricItem.description && Number.isFinite(rubricItem.weight))
            : [{ name: 'Nội dung', weight: 100, description: '' }];
        }

        accumulator[key] = normalized;
        return accumulator;
      }, {}),
    };

    const nextSignature = JSON.stringify(nextMetadata);
    if (nextSignature === lastEmittedMetadataRef.current) {
      return;
    }

    lastEmittedMetadataRef.current = nextSignature;
    onChange(nextMetadata);
  }, [compact, innerQuestions, onChange, templateText]);

  const activeTemplateText = compact ? String(templateText || '') : textTemplate;
  const validation = useMemo(() => {
    const errors = [];
    const byKey = {};

    if (!compact && !String(title).trim()) {
      errors.push('Hãy nhập tiêu đề câu hỏi.');
    }

    if (!String(activeTemplateText).trim()) {
      errors.push('Hãy nhập nội dung đọc/media cho câu hỏi bài đọc.');
    }

    if (!innerQuestions.length) {
      errors.push('Hãy thêm ít nhất 1 câu hỏi nhỏ.');
    }

    innerQuestions.forEach((item) => {
      const key = getInnerQuestionKey(item, innerQuestions.indexOf(item));
      const cardErrors = [];

      const contentLength = (richContentToPlainText(item.contentBlocks) || String(item.content || '').trim()).length;
      if (contentLength < 10) {
        cardErrors.push('Nội dung câu hỏi cần ít nhất 10 ký tự.');
      }

      if (item.type === 'MULTICHOICE') {
        const options = cloneOptions(item.options).map((option) => String(option).trim()).filter(Boolean);
        if (options.length < 2) {
          cardErrors.push('MULTICHOICE cần ít nhất 2 tùy chọn.');
        }

        const correctIndices = Array.isArray(item.correctIndices)
          ? item.correctIndices.map((indexValue) => Number(indexValue)).filter((indexValue) => Number.isFinite(indexValue))
          : [];

        if (!correctIndices.length) {
          cardErrors.push('Vui lòng chọn ít nhất 1 đáp án đúng cho MULTICHOICE.');
        } else if (correctIndices.some((indexValue) => indexValue < 0 || indexValue >= options.length)) {
          cardErrors.push('Đáp án đúng phải trùng với các lựa chọn đang có.');
        }
      }

      if (item.type === 'SHORT_ANSWER') {
        if (!String(item.correct ?? '').trim()) {
          cardErrors.push('Vui lòng nhập đáp án đúng chính xác cho SHORT_ANSWER.');
        }
      }

      if (item.type === 'TRUE_FALSE') {
        if (typeof item.correctAnswer !== 'boolean') {
          cardErrors.push('Vui lòng chọn đáp án Đúng hoặc Sai cho TRUE_FALSE.');
        }
      }

      if (item.type === 'NUMERICAL') {
        if (String(item.correct).trim() === '') {
          cardErrors.push('Vui lòng nhập đáp án số đúng cho NUMERICAL.');
        } else if (Number.isNaN(Number(item.correct))) {
          cardErrors.push('Đáp án NUMERICAL phải là một số hợp lệ.');
        }
      }

      if (item.type === 'ESSAY') {
        const rubric = Array.isArray(item.rubric) ? item.rubric : [];
        if (!String(item.instructions || '').trim()) {
          cardErrors.push('Vui lòng nhập hướng dẫn cho câu tự luận.');
        }
        if (!rubric.length) {
          cardErrors.push('Câu tự luận cần ít nhất 1 tiêu chí.');
        } else {
          const totalWeight = rubric.reduce((sum, rubricItem) => sum + (Number(rubricItem?.weight) || 0), 0);
          if (Math.round(totalWeight) !== 100) {
            cardErrors.push('Tổng trọng số rubric phải bằng 100.');
          }
        }
      }

      if (Number(item.points) <= 0) {
        cardErrors.push('Số điểm phải lớn hơn 0.');
      }

      if (!String(item.explanation || '').trim() && item.type !== 'TRUE_FALSE') {
        // explanation is optional; no-op, but keep branch to align with normal question form fields
      }

      if (cardErrors.length) {
        byKey[key] = cardErrors;
      }
    });

    return { ok: errors.length === 0 && Object.keys(byKey).length === 0, errors, byKey };
  }, [compact, innerQuestions, activeTemplateText, title]);

  const updateInnerQuestion = (index, patch) => {
    setInnerQuestions((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)));
  };

  const updateInnerRubric = (questionIndex, rubricIndex, patch) => {
    setInnerQuestions((prev) => prev.map((item, currentIndex) => {
      if (currentIndex !== questionIndex) {
        return item;
      }

      const nextRubric = Array.isArray(item.rubric) ? [...item.rubric] : [];
      nextRubric[rubricIndex] = { ...nextRubric[rubricIndex], ...patch };
      return { ...item, rubric: nextRubric };
    }));
  };

  const addInnerRubricRow = (questionIndex) => {
    setInnerQuestions((prev) => prev.map((item, currentIndex) => {
      if (currentIndex !== questionIndex) {
        return item;
      }

      return {
        ...item,
        rubric: [...(Array.isArray(item.rubric) ? item.rubric : []), { name: '', weight: 0, description: '' }],
      };
    }));
  };

  const removeInnerRubricRow = (questionIndex, rubricIndex) => {
    setInnerQuestions((prev) => prev.map((item, currentIndex) => {
      if (currentIndex !== questionIndex) {
        return item;
      }

      const nextRubric = Array.isArray(item.rubric) ? item.rubric.filter((_, currentIndex) => currentIndex !== rubricIndex) : [];
      return {
        ...item,
        rubric: nextRubric.length ? nextRubric : [{ name: 'Nội dung', weight: 100, description: '' }],
      };
    }));
  };

  const addInnerQuestion = () => {
    setInnerQuestions((prev) => [...prev, createInnerQuestionDraft(prev.length, getNextInnerQuestionKey(prev))]);
  };

  const validateSingleInnerQuestion = (item) => {
    const errors = [];
    const normalized = normalizeInnerQuestionForEditorType(item, item?.type);
    const contentLength = (richContentToPlainText(normalized.contentBlocks) || String(normalized.content || '').trim()).length;

    if (contentLength < 10) {
      errors.push('Nội dung câu hỏi cần ít nhất 10 ký tự.');
    }

    if (Number(normalized.points) <= 0) {
      errors.push('Số điểm phải lớn hơn 0.');
    }

    if (normalized.type === 'MULTICHOICE') {
      const options = cloneOptions(normalized.options).map((option) => String(option || '').trim()).filter(Boolean);
      if (options.length < 2) {
        errors.push('MULTICHOICE cần ít nhất 2 tùy chọn.');
      }

      const correctIndices = Array.isArray(normalized.correctIndices)
        ? normalized.correctIndices.map((indexValue) => Number(indexValue)).filter((indexValue) => Number.isFinite(indexValue))
        : [];

      if (!correctIndices.length) {
        errors.push('Vui lòng chọn ít nhất 1 đáp án đúng cho MULTICHOICE.');
      } else if (correctIndices.some((indexValue) => indexValue < 0 || indexValue >= options.length)) {
        errors.push('Đáp án đúng phải trùng với các lựa chọn đang có.');
      }
    }

    if (normalized.type === 'TRUE_FALSE') {
      if (typeof normalized.correctAnswer !== 'boolean') {
        errors.push('Vui lòng chọn đáp án Đúng hoặc Sai cho TRUE_FALSE.');
      }
    }

    if (normalized.type === 'SHORT_ANSWER') {
      if (!String(normalized.correct ?? '').trim() && !String(normalized.acceptedAnswersText || '').trim()) {
        errors.push('Vui lòng nhập đáp án đúng chính xác cho SHORT_ANSWER.');
      }
    }

    if (normalized.type === 'NUMERICAL') {
      if (String(normalized.correct).trim() === '') {
        errors.push('Vui lòng nhập đáp án số đúng cho NUMERICAL.');
      } else if (Number.isNaN(Number(normalized.correct))) {
        errors.push('Đáp án NUMERICAL phải là một số hợp lệ.');
      }
    }

    if (normalized.type === 'ESSAY') {
      const rubric = Array.isArray(normalized.rubric) ? normalized.rubric : [];
      if (!String(normalized.instructions || '').trim()) {
        errors.push('Vui lòng nhập hướng dẫn cho câu tự luận.');
      }
      if (!rubric.length) {
        errors.push('Câu tự luận cần ít nhất 1 tiêu chí.');
      } else {
        const totalWeight = rubric.reduce((sum, rubricItem) => sum + (Number(rubricItem?.weight) || 0), 0);
        if (Math.round(totalWeight) !== 100) {
          errors.push('Tổng trọng số rubric phải bằng 100.');
        }
      }
    }

    return errors;
  };

  const openCreateInnerQuestionEditor = () => {
    setInnerEditorMode('create');
    setInnerEditorIndex(null);
    setInnerEditorDraft(createInnerQuestionDraft(innerQuestions.length));
    setInnerEditorErrors([]);
    setInnerEditorOpen(true);
  };

  const openEditInnerQuestionEditor = (index) => {
    const source = innerQuestions[index];
    if (!source) {
      return;
    }

    setInnerEditorMode('edit');
    setInnerEditorIndex(index);
    setInnerEditorDraft(normalizeInnerQuestionForEditorType({ ...source }, source.type));
    setInnerEditorErrors([]);
    setInnerEditorOpen(true);
  };

  const closeInnerQuestionEditor = () => {
    setInnerEditorOpen(false);
    setInnerEditorErrors([]);
  };

  const saveInnerQuestionFromEditor = () => {
    const errors = validateSingleInnerQuestion(innerEditorDraft);
    if (errors.length) {
      setInnerEditorErrors(errors);
      return;
    }

    if (innerEditorMode === 'edit' && Number.isInteger(innerEditorIndex) && innerEditorIndex >= 0) {
      setInnerQuestions((prev) => prev.map((item, index) => (index === innerEditorIndex ? { ...innerEditorDraft } : item)));
    } else {
      setInnerQuestions((prev) => {
        const nextKey = getNextInnerQuestionKey(prev);
        return [...prev, { ...innerEditorDraft, key: nextKey }];
      });
    }

    setInnerEditorOpen(false);
    setInnerEditorErrors([]);
  };

  const updateInnerEditorDraft = (patch) => {
    setInnerEditorDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateInnerEditorType = (nextType) => {
    setInnerEditorDraft((prev) => normalizeInnerQuestionForEditorType(prev, nextType));
  };

  const updateInnerEditorRubric = (rubricIndex, patch) => {
    setInnerEditorDraft((prev) => {
      const nextRubric = Array.isArray(prev.rubric) ? [...prev.rubric] : [];
      nextRubric[rubricIndex] = { ...nextRubric[rubricIndex], ...patch };
      return { ...prev, rubric: nextRubric };
    });
  };

  const addInnerEditorRubric = () => {
    setInnerEditorDraft((prev) => ({
      ...prev,
      rubric: [...(Array.isArray(prev.rubric) ? prev.rubric : []), { name: '', weight: 0, description: '' }],
    }));
  };

  const removeInnerEditorRubric = (rubricIndex) => {
    setInnerEditorDraft((prev) => {
      const nextRubric = Array.isArray(prev.rubric)
        ? prev.rubric.filter((_, currentIndex) => currentIndex !== rubricIndex)
        : [];
      return {
        ...prev,
        rubric: nextRubric.length ? nextRubric : [{ name: 'Nội dung', weight: 100, description: '' }],
      };
    });
  };

  const addInnerEditorOption = () => {
    setInnerEditorDraft((prev) => {
      const nextOptions = Array.isArray(prev.options) ? [...prev.options] : ['', ''];
      const nextOptionsRich = Array.isArray(prev.optionsRich)
        ? [...prev.optionsRich]
        : nextOptions.map(() => createEmptyRichBlocks());
      if (nextOptions.length >= 6) {
        return prev;
      }

      nextOptions.push('');
      nextOptionsRich.push(createEmptyRichBlocks());
      return { ...prev, options: nextOptions, optionsRich: nextOptionsRich };
    });
  };

  const removeInnerEditorOption = (optionIndex) => {
    setInnerEditorDraft((prev) => {
      const nextOptions = Array.isArray(prev.options) ? [...prev.options] : [];
      const nextOptionsRich = Array.isArray(prev.optionsRich) ? [...prev.optionsRich] : [];
      if (nextOptions.length <= 2) {
        return prev;
      }

      nextOptions.splice(optionIndex, 1);
      nextOptionsRich.splice(optionIndex, 1);
      const nextCorrect = (Array.isArray(prev.correctIndices) ? prev.correctIndices : [])
        .filter((currentIndex) => currentIndex !== optionIndex)
        .map((currentIndex) => (currentIndex > optionIndex ? currentIndex - 1 : currentIndex));
      if (!nextCorrect.length && nextOptions.length) {
        nextCorrect.push(0);
      }

      return {
        ...prev,
        options: nextOptions,
        optionsRich: nextOptionsRich,
        correctIndices: nextCorrect,
      };
    });
  };

  const toggleInnerEditorCorrect = (optionIndex, checked) => {
    setInnerEditorDraft((prev) => {
      const nextCorrect = Array.isArray(prev.correctIndices) ? [...prev.correctIndices] : [];
      if (checked) {
        if (!nextCorrect.includes(optionIndex)) {
          nextCorrect.push(optionIndex);
        }
      } else {
        const filtered = nextCorrect.filter((currentIndex) => currentIndex !== optionIndex);
        nextCorrect.length = 0;
        nextCorrect.push(...filtered);
      }

      return {
        ...prev,
        correctIndices: nextCorrect.sort((a, b) => a - b),
      };
    });
  };

  const removeInnerQuestion = (index) => {
    setInnerQuestions((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const autoFixInnerQuestion = (index) => {
    setInnerQuestions((prev) => prev.map((item, i) => {
      if (i !== index) return item;

      const next = { ...item };
      const contentPlain = richContentToPlainText(next.contentBlocks) || String(next.content || '').trim();
      if (!contentPlain || contentPlain.length < 10) {
        if (String(textTemplate || '').trim().length >= 10) {
          next.content = String(textTemplate).trim().slice(0, 400);
          next.contentBlocks = [{ type: 'text', text: next.content }];
        } else {
          next.content = 'Nội dung tự động thêm để thỏa điều kiện tối thiểu.';
          next.contentBlocks = [{ type: 'text', text: next.content }];
        }
      }

      next.points = Number(next.points) > 0 ? Number(next.points) : 1;

      const t = String(next.type || '').toUpperCase();
      if (t === 'MULTICHOICE' || t === 'MULTIPLE_CHOICE') {
        const opts = Array.isArray(next.options) ? next.options.map((o) => String(o || '').trim()).filter(Boolean) : [];
        while (opts.length < 2) opts.push('Đáp án tự động');
        next.options = opts;
        next.optionsRich = opts.map((txt) => [{ type: 'text', text: txt }]);
        if (!Array.isArray(next.correctIndices) || !next.correctIndices.length) next.correctIndices = [0];
      } else if (t === 'TRUE_FALSE') {
        if (next.correctAnswer !== true && next.correctAnswer !== false) next.correctAnswer = true;
      } else if (t === 'SHORT_ANSWER') {
        if (!String(next.correct || '').trim() && !String(next.acceptedAnswersText || '').trim()) {
          next.acceptedAnswersText = 'Đáp án tự động';
          next.correct = 'Đáp án tự động';
        }
      } else if (t === 'NUMERICAL') {
        if (next.correct == null || String(next.correct).trim() === '') next.correct = 0;
        if (!Number.isFinite(Number(next.tolerance))) next.tolerance = 0;
      } else if (t === 'ESSAY') {
        if (!String(next.instructions || '').trim()) next.instructions = 'Viết một đoạn ngắn trả lời.';
        if (!Array.isArray(next.rubric) || !next.rubric.length) next.rubric = [{ name: 'Nội dung', weight: 100, description: '' }];
      }

      return next;
    }));
  };

  const removeInnerOption = (questionIndex, optionIndex) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đáp án này?')) return;

    setInnerQuestions((prev) => prev.map((item, currentIndex) => {
      if (currentIndex !== questionIndex) return item;
      const nextOptions = Array.isArray(item.options) ? [...item.options] : [];
      const nextOptionsRich = Array.isArray(item.optionsRich) ? [...item.optionsRich] : [];
      if (nextOptions.length <= 2) return item; // keep at least 2
      nextOptions.splice(optionIndex, 1);
      nextOptionsRich.splice(optionIndex, 1);
      const nextCorrect = (Array.isArray(item.correctIndices) ? item.correctIndices : []).filter((ci) => ci !== optionIndex).map((ci) => (ci > optionIndex ? ci - 1 : ci));
      if (!nextCorrect.length && nextOptions.length) nextCorrect.push(0);
      return { ...item, options: nextOptions, optionsRich: nextOptionsRich, correctIndices: nextCorrect };
    }));
  };

  const insertPlaceholderAtCursor = (key) => {
    const textarea = templateRef.current;
    const token = `[inputs.${key}]`;

    if (!textarea) {
      setTextTemplate((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${token}`);
      return;
    }

    const start = textarea.selectionStart ?? textTemplate.length;
    const end = textarea.selectionEnd ?? textTemplate.length;
    const next = `${textTemplate.slice(0, start)}${token}${textTemplate.slice(end)}`;
    setTextTemplate(next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + token.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = () => {
    setShowErrors(true);
    if (!validation.ok) {
      return;
    }

    const metadata = {
      text_template: String(activeTemplateText || '').trim(),
      inner_questions: innerQuestions.reduce((accumulator, item, index) => {
        const key = getInnerQuestionKey(item, index);
        if (!key) {
          return accumulator;
        }

        const normalized = {
          type: normalizeInnerQuestionType(item.type),
          points: Number(item.points) || 1,
          content: String(item.content || '').trim(),
          contentBlocks: normalizeBlocksArray(item.contentBlocks),
          explanation: String(item.explanation || '').trim(),
          isPublished: true,
        };

        if (item.type === 'MULTICHOICE') {
          const normalizedOptionsRich = toNormalizedOptionsRich(item);
          normalized.optionsRich = normalizedOptionsRich;
          normalized.options = cloneOptions(item.options)
            .map((option) => String(option).trim())
            .map((option, optionIndex) => option || richContentToPlainText(normalizedOptionsRich[optionIndex]))
            .filter(Boolean);
          normalized.correctIndices = Array.isArray(item.correctIndices)
            ? item.correctIndices.map((indexValue) => Number(indexValue)).filter((indexValue) => Number.isFinite(indexValue))
            : [0];
        } else if (item.type === 'SHORT_ANSWER') {
          normalized.correct = String(item.correct || '').trim();
        } else if (item.type === 'NUMERICAL') {
          normalized.correct = Number(item.correct);
          normalized.tolerance = Number.isFinite(Number(item.tolerance)) ? Number(item.tolerance) : 0;
        }

        accumulator[key] = normalized;
        return accumulator;
      }, {}),
    };

    onSubmit?.({
      title: String(title || '').trim(),
      metadata,
    });
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">Câu hỏi bài đọc</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tạo câu hỏi bài đọc bằng nội dung đọc/media ở trên và các câu hỏi nhỏ ở phía dưới.
        </p>
      </div>

      <div className={compact ? 'px-6 py-6' : 'grid gap-6 px-6 py-6 lg:grid-cols-[1.3fr_0.7fr]'}>
        {!compact ? (
          <section className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="cloze-question-title">
                Tiêu đề câu hỏi
              </label>
              <input
                id="cloze-question-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Thủ đô và diện tích Việt Nam"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700" htmlFor="cloze-text-template">
                  Nội dung đọc / media
                </label>
              </div>
              <textarea
                id="cloze-text-template"
                value={textTemplate}
                onChange={(event) => setTextTemplate(event.target.value)}
                placeholder="Nhập đoạn đọc, mô tả ảnh hoặc mô tả video ở đây..."
                rows={6}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          {showErrors && validation.errors.length ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="mb-1 font-semibold">Cần sửa các lỗi sau:</p>
              <ul className="list-disc space-y-1 pl-5">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={compact ? openCreateInnerQuestionEditor : addInnerQuestion}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Thêm câu hỏi nhỏ
            </button>
            <span className="text-xs text-slate-500">
              Form hiện tại có {innerQuestions.length} câu hỏi nhỏ.
            </span>
          </div>
        </section>
      </div>

      {compact ? (
        <div className="space-y-2.5 border-t border-slate-200 px-6 py-4">
          {innerQuestions.map((item, index) => {
            const previewText = richContentToPlainText(item.contentBlocks) || String(item.content || '').trim() || 'Chưa có nội dung';
            const cardErrors = validation.byKey[getInnerQuestionKey(item, index)] || [];
            const mediaItems = collectMediaPreviewItems(item);
            const visibleMediaItems = mediaItems.slice(0, 4);
            const hiddenMediaCount = Math.max(0, mediaItems.length - visibleMediaItems.length);
            const normalizedType = String(item?.type || '').toUpperCase();
            const points = Number(item?.points) || 1;
            const optionCount = normalizedType === 'MULTICHOICE' ? cloneOptions(item?.options).map((option) => String(option || '').trim()).filter(Boolean).length : 0;

            return (
              <div key={item.key || index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-slate-900">Câu hỏi nhỏ {index + 1}</h4>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">{QUESTION_TYPE_LABELS[item.type] || item.type}</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{points} điểm</span>
                      {optionCount > 0 ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{optionCount} đáp án</span> : null}
                      {mediaItems.length > 0 ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{mediaItems.length} media</span> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{previewText}</p>

                    {visibleMediaItems.length ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {visibleMediaItems.map((media, mediaIndex) => (
                          <div
                            key={`${item.key || index}-media-${mediaIndex}`}
                            className="relative h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                            title={`${media.sourceLabel}${media.title ? ` - ${media.title}` : ''}`}
                          >
                            {media.thumb ? (
                              <img src={media.thumb} alt={media.title || media.sourceLabel} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-600">VIDEO</div>
                            )}
                            {media.type === 'video' ? (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-[10px] font-bold text-white">▶</span>
                            ) : null}
                          </div>
                        ))}
                        {hiddenMediaCount > 0 ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">+{hiddenMediaCount}</span>
                        ) : null}
                      </div>
                    ) : null}

                    {cardErrors.length ? (
                      <p className="mt-2 text-xs font-semibold text-rose-600">Có {cardErrors.length} lỗi cần sửa</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditInnerQuestionEditor(index)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Sửa
                    </button>
                    {cardErrors.length ? (
                      <button
                        type="button"
                        onClick={() => autoFixInnerQuestion(index)}
                        className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                      >
                        Sửa lỗi
                      </button>
                    ) : null}
                    {innerQuestions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeInnerQuestion(index)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5 border-t border-slate-200 px-6 py-4">
          {innerQuestions.map((item, index) => {
            const cardErrors = validation.byKey[item.key] || [];

            return (
              <div key={item.key || index} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Câu hỏi nhỏ {index + 1}</h4>
                  </div>
                  {innerQuestions.length > 1 ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeInnerQuestion(index)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Loại câu hỏi</label>
                    <select
                      value={item.type}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        const paddedOptions = [...cloneOptions(item.options), '', '', '', ''].slice(0, 4);
                        const paddedOptionsRich = [...(Array.isArray(item.optionsRich) && item.optionsRich.length ? item.optionsRich : []), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()].slice(0, 4);
                        updateInnerQuestion(index, {
                          type: nextType,
                          options: nextType === 'MULTICHOICE' ? paddedOptions : [''],
                          optionsRich: nextType === 'MULTICHOICE' ? paddedOptionsRich : item.optionsRich,
                          correctIndices: nextType === 'MULTICHOICE' ? (Array.isArray(item.correctIndices) && item.correctIndices.length ? item.correctIndices : [0]) : item.correctIndices,
                          acceptedAnswersText: nextType === 'SHORT_ANSWER' ? String(item.acceptedAnswersText || '') : item.acceptedAnswersText,
                          correct: nextType === 'NUMERICAL' || nextType === 'MULTICHOICE' || nextType === 'SHORT_ANSWER' ? item.correct : '',
                          tolerance: nextType === 'NUMERICAL' ? Number(item.tolerance) || 0 : item.tolerance,
                          instructions: nextType === 'ESSAY' ? String(item.instructions || '') : item.instructions,
                          rubric: nextType === 'ESSAY' ? (Array.isArray(item.rubric) && item.rubric.length ? item.rubric : [{ name: 'Nội dung', weight: 100, description: '' }]) : item.rubric,
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    >
                      {QUESTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Số điểm</label>
                    <input
                      type="number"
                      min="1"
                      value={item.points}
                      onChange={(event) => updateInnerQuestion(index, { points: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  {item.type === 'NUMERICAL' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Tolerance</label>
                      <input
                        type="number"
                        min="0"
                        value={item.tolerance}
                        onChange={(event) => updateInnerQuestion(index, { tolerance: event.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      />
                    </div>
                  ) : (
                    <div className="xl:col-span-1" />
                  )}
                </div>

                <div className="mt-2.5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nội dung câu hỏi *</label>
                  <RichContentEditor
                    title=""
                    helperText="Có thể thêm nhiều khối văn bản, ảnh hoặc video cho nội dung câu hỏi."
                    value={Array.isArray(item.contentBlocks) ? item.contentBlocks : createEmptyRichBlocks()}
                    onChange={(nextBlocks) => {
                      updateInnerQuestion(index, {
                        contentBlocks: nextBlocks,
                        content: richContentToPlainText(nextBlocks),
                      });
                    }}
                  />
                </div>

                {item.type === 'MULTICHOICE' ? (
                  <div className="mt-2.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="text-sm font-semibold text-slate-900">Danh sách tùy chọn</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Tối thiểu 2 đáp án</span>
                        {((Array.isArray(item.options) ? item.options.length : (Array.isArray(item.optionsRich) ? item.optionsRich.length : 0)) < 6) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextOptions = Array.isArray(item.options) ? [...item.options] : (Array.isArray(item.optionsRich) ? item.optionsRich.map(() => '') : ['', '']);
                              const nextOptionsRich = Array.isArray(item.optionsRich) ? [...item.optionsRich] : (Array.isArray(item.options) ? item.options.map(() => createEmptyRichBlocks()) : [createEmptyRichBlocks(), createEmptyRichBlocks()]);
                              nextOptions.push('');
                              nextOptionsRich.push(createEmptyRichBlocks());
                              updateInnerQuestion(index, { options: nextOptions, optionsRich: nextOptionsRich });
                            }}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            + Thêm
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(() => {
                        const richArray = (Array.isArray(item.optionsRich) && item.optionsRich.length) ? item.optionsRich : (Array.isArray(item.options) && item.options.length ? item.options.map(() => createEmptyRichBlocks()) : [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()]);
                        const optCount = Math.max(2, (Array.isArray(item.options) && item.options.length) ? item.options.length : richArray.length);
                        return richArray.slice(0, optCount).map((optionBlocks, optionIndex) => (
                          <div key={`${item.key}-option-${optionIndex}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(item.correctIndices) && item.correctIndices.includes(optionIndex)}
                                  onChange={(event) => {
                                    const nextCorrect = Array.isArray(item.correctIndices) ? [...item.correctIndices] : [];
                                    if (event.target.checked) {
                                      if (!nextCorrect.includes(optionIndex)) {
                                        nextCorrect.push(optionIndex);
                                      }
                                    } else {
                                      const filtered = nextCorrect.filter((currentIndex) => currentIndex !== optionIndex);
                                      nextCorrect.length = 0;
                                      nextCorrect.push(...filtered);
                                    }
                                    updateInnerQuestion(index, { correctIndices: nextCorrect.sort((a, b) => a - b) });
                                  }}
                                />
                                <span>Đáp án {String.fromCharCode(65 + optionIndex)}</span>
                              </label>
                              {((Array.isArray(item.options) ? item.options.length : optCount) > 2) ? (
                                <button
                                  type="button"
                                  onClick={() => removeInnerOption(index, optionIndex)}
                                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  title="Xóa đáp án này"
                                >
                                  −
                                </button>
                              ) : null}
                            </div>
                            <RichContentEditor
                              title=""
                              helperText="Có thể dùng văn bản, ảnh hoặc video cho đáp án này."
                              value={optionBlocks}
                              onChange={(nextBlocks) => {
                                const nextRich = Array.isArray(item.optionsRich) && item.optionsRich.length ? [...item.optionsRich] : richArray.slice(0, optCount);
                                nextRich[optionIndex] = nextBlocks;
                                const nextOptions = Array.isArray(item.options) ? [...item.options] : richArray.slice(0, optCount).map((b) => richContentToPlainText(b));
                                nextOptions[optionIndex] = richContentToPlainText(nextBlocks);
                                updateInnerQuestion(index, { optionsRich: nextRich, options: nextOptions });
                              }}
                            />
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ) : null}

                {item.type === 'TRUE_FALSE' ? (
                  <div className="mt-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5">
                    <label className="mb-3 block text-sm font-medium text-slate-700">Đáp án đúng</label>
                    <div className="flex gap-3 flex-wrap">
                      <label className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-3 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name={`inner-question-${item.key}-true-false`}
                          checked={item.correctAnswer === true}
                          onChange={() => updateInnerQuestion(index, { correctAnswer: true })}
                        />
                        <span>Đúng (True)</span>
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-3 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name={`inner-question-${item.key}-true-false`}
                          checked={item.correctAnswer === false}
                          onChange={() => updateInnerQuestion(index, { correctAnswer: false })}
                        />
                        <span>Sai (False)</span>
                      </label>
                    </div>
                  </div>
                ) : null}

                {item.type === 'SHORT_ANSWER' ? (
                  <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Danh sách đáp án chấp nhận (mỗi dòng 1 đáp án)</label>
                    <textarea
                      value={item.acceptedAnswersText}
                      onChange={(event) => updateInnerQuestion(index, { acceptedAnswersText: event.target.value })}
                      placeholder="Nhập mỗi đáp án trên một dòng"
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(item.caseSensitive)}
                          onChange={(event) => updateInnerQuestion(index, { caseSensitive: event.target.checked })}
                        />
                        <span className="text-sm">Phân biệt chữ hoa/thường</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.fuzzyMatch !== false}
                          onChange={(event) => updateInnerQuestion(index, { fuzzyMatch: event.target.checked })}
                        />
                        <span className="text-sm">Khớp mềm (fuzzy match)</span>
                      </label>
                    </div>
                  </div>
                ) : null}

                {item.type === 'ESSAY' ? (
                  <div className="mt-2.5 space-y-2.5 rounded-xl border border-purple-200 bg-purple-50 p-3.5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Hướng dẫn bài tự luận</label>
                      <textarea
                        value={item.instructions}
                        onChange={(event) => updateInnerQuestion(index, { instructions: event.target.value })}
                        placeholder="Nhập hướng dẫn cho câu hỏi tự luận"
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-slate-700">Rubric chấm điểm</label>
                        <button
                          type="button"
                          onClick={() => addInnerRubricRow(index)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          + Thêm tiêu chí
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(Array.isArray(item.rubric) ? item.rubric : []).map((rubricItem, rubricIndex) => (
                          <div key={`${item.key}-rubric-${rubricIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                              <input
                                value={rubricItem.name}
                                onChange={(event) => updateInnerRubric(index, rubricIndex, { name: event.target.value })}
                                placeholder="Tên tiêu chí"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={rubricItem.weight}
                                onChange={(event) => updateInnerRubric(index, rubricIndex, { weight: event.target.value })}
                                placeholder="Trọng số"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>
                            <div className="mt-3 flex items-start gap-3">
                              <textarea
                                value={rubricItem.description}
                                onChange={(event) => updateInnerRubric(index, rubricIndex, { description: event.target.value })}
                                placeholder="Mô tả tiêu chí"
                                rows={3}
                                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                              <button
                                type="button"
                                onClick={() => removeInnerRubricRow(index, rubricIndex)}
                                className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {item.type === 'NUMERICAL' ? (
                  <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Đáp án số chính xác</label>
                    <input
                      type="number"
                      value={item.correct}
                      onChange={(event) => updateInnerQuestion(index, { correct: event.target.value })}
                      placeholder="Ví dụ: 3358"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    {cardErrors.length ? (
                      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {cardErrors.map((error) => (
                          <div key={error}>• {error}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

              </div>
            );
          })}
        </div>
      )}

      {compact && innerEditorOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={closeInnerQuestionEditor}>
          <div className="mt-4 w-full max-w-4xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {innerEditorMode === 'edit' ? 'Chỉnh sửa câu hỏi nhỏ' : 'Thêm câu hỏi nhỏ'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Màn hình này tương tự form thêm câu hỏi bình thường.</p>
              </div>
              <button type="button" onClick={closeInnerQuestionEditor} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Đóng
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
              {innerEditorErrors.length ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {innerEditorErrors.map((error) => (
                    <div key={error}>• {error}</div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Loại câu hỏi</label>
                  <select
                    value={innerEditorDraft.type}
                    onChange={(event) => updateInnerEditorType(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Số điểm</label>
                  <input
                    type="number"
                    min="1"
                    value={innerEditorDraft.points}
                    onChange={(event) => updateInnerEditorDraft({ points: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                {innerEditorDraft.type === 'NUMERICAL' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Tolerance</label>
                    <input
                      type="number"
                      min="0"
                      value={innerEditorDraft.tolerance}
                      onChange={(event) => updateInnerEditorDraft({ tolerance: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nội dung câu hỏi *</label>
                <RichContentEditor
                  title=""
                  helperText="Có thể thêm văn bản, ảnh hoặc video giống như form câu hỏi bình thường."
                  value={Array.isArray(innerEditorDraft.contentBlocks) ? innerEditorDraft.contentBlocks : createEmptyRichBlocks()}
                  onChange={(nextBlocks) => updateInnerEditorDraft({
                    contentBlocks: nextBlocks,
                    content: richContentToPlainText(nextBlocks),
                  })}
                />
              </div>

              {innerEditorDraft.type === 'MULTICHOICE' ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Các lựa chọn đáp án</h4>
                    <button type="button" onClick={addInnerEditorOption} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white">
                      + Thêm đáp án
                    </button>
                  </div>
                  {(Array.isArray(innerEditorDraft.optionsRich) ? innerEditorDraft.optionsRich : [createEmptyRichBlocks(), createEmptyRichBlocks()]).map((optionBlocks, optionIndex) => (
                    <div key={`inner-editor-option-${optionIndex}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={Array.isArray(innerEditorDraft.correctIndices) && innerEditorDraft.correctIndices.includes(optionIndex)}
                            onChange={(event) => toggleInnerEditorCorrect(optionIndex, event.target.checked)}
                          />
                          <span>Đáp án {String.fromCharCode(65 + optionIndex)}</span>
                        </label>
                        {(Array.isArray(innerEditorDraft.options) ? innerEditorDraft.options.length : 0) > 2 ? (
                          <button type="button" onClick={() => removeInnerEditorOption(optionIndex)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                            Xóa
                          </button>
                        ) : null}
                      </div>
                      <RichContentEditor
                        title=""
                        helperText=""
                        value={optionBlocks}
                        onChange={(nextBlocks) => {
                          const nextRich = Array.isArray(innerEditorDraft.optionsRich) ? [...innerEditorDraft.optionsRich] : [];
                          const nextOptions = Array.isArray(innerEditorDraft.options) ? [...innerEditorDraft.options] : [];
                          nextRich[optionIndex] = nextBlocks;
                          nextOptions[optionIndex] = richContentToPlainText(nextBlocks);
                          updateInnerEditorDraft({ optionsRich: nextRich, options: nextOptions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {innerEditorDraft.type === 'TRUE_FALSE' ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Đáp án đúng</label>
                  <div className="flex gap-3">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-2">
                      <input type="radio" checked={innerEditorDraft.correctAnswer === true} onChange={() => updateInnerEditorDraft({ correctAnswer: true })} />
                      <span>Đúng</span>
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2">
                      <input type="radio" checked={innerEditorDraft.correctAnswer === false} onChange={() => updateInnerEditorDraft({ correctAnswer: false })} />
                      <span>Sai</span>
                    </label>
                  </div>
                </div>
              ) : null}

              {innerEditorDraft.type === 'SHORT_ANSWER' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Danh sách đáp án chấp nhận (mỗi dòng 1 đáp án)</label>
                  <textarea
                    rows={4}
                    value={innerEditorDraft.acceptedAnswersText}
                    onChange={(event) => updateInnerEditorDraft({ acceptedAnswersText: event.target.value, correct: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean)[0] || '' })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              ) : null}

              {innerEditorDraft.type === 'NUMERICAL' ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Đáp án số chính xác</label>
                  <input
                    type="number"
                    value={innerEditorDraft.correct}
                    onChange={(event) => updateInnerEditorDraft({ correct: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              ) : null}

              {innerEditorDraft.type === 'ESSAY' ? (
                <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Hướng dẫn bài tự luận</label>
                    <textarea
                      rows={4}
                      value={innerEditorDraft.instructions}
                      onChange={(event) => updateInnerEditorDraft({ instructions: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Rubric</label>
                    <button type="button" onClick={addInnerEditorRubric} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white">
                      + Thêm tiêu chí
                    </button>
                  </div>
                  {(Array.isArray(innerEditorDraft.rubric) ? innerEditorDraft.rubric : []).map((rubricItem, rubricIndex) => (
                    <div key={`inner-editor-rubric-${rubricIndex}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                        <input
                          value={rubricItem.name}
                          onChange={(event) => updateInnerEditorRubric(rubricIndex, { name: event.target.value })}
                          placeholder="Tên tiêu chí"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rubricItem.weight}
                          onChange={(event) => updateInnerEditorRubric(rubricIndex, { weight: event.target.value })}
                          placeholder="Trọng số"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        />
                      </div>
                      <div className="mt-3 flex items-start gap-3">
                        <textarea
                          rows={3}
                          value={rubricItem.description}
                          onChange={(event) => updateInnerEditorRubric(rubricIndex, { description: event.target.value })}
                          placeholder="Mô tả tiêu chí"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        />
                        <button type="button" onClick={() => removeInnerEditorRubric(rubricIndex)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Giải thích (không bắt buộc)</label>
                <textarea
                  rows={3}
                  value={innerEditorDraft.explanation}
                  onChange={(event) => updateInnerEditorDraft({ explanation: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={closeInnerQuestionEditor} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Hủy
              </button>
              <button type="button" onClick={saveInnerQuestionFromEditor} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                {innerEditorMode === 'edit' ? 'Lưu thay đổi' : 'Thêm câu hỏi nhỏ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            {submitLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ClozeQuestionForm;
