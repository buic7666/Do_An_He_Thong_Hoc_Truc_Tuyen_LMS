import { useEffect, useMemo, useRef, useState } from 'react';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText } from './RichContentEditor';

const QUESTION_TYPES = [
  { value: 'MULTICHOICE', label: 'Trắc nghiệm' },
  { value: 'TRUE_FALSE', label: 'Đúng/Sai' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
  { value: 'NUMERICAL', label: 'Số học' },
  { value: 'ESSAY', label: 'Tự luận' },
];

const createInnerQuestionDraft = (index = 0) => ({
  key: `q${index + 1}`,
  content: '',
  contentBlocks: createEmptyRichBlocks(),
  type: 'MULTICHOICE',
  points: 1,
  options: [''],
  optionsRich: [createEmptyRichBlocks()],
  correctAnswer: true,
  acceptedAnswersText: '',
  correct: '',
  tolerance: 0,
  instructions: '',
  rubric: [{ name: 'Nội dung', weight: 100, description: '' }],
  explanation: '',
  isPublished: false,
});

const cloneOptions = (options) => (Array.isArray(options) && options.length > 0 ? options.map((item) => String(item ?? '')) : ['']);

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
    options: cloneOptions(value?.options),
    optionsRich: Array.isArray(value?.optionsRich) && value.optionsRich.length ? value.optionsRich : [createEmptyRichBlocks()],
    content: value?.content == null ? '' : String(value.content),
    contentBlocks: Array.isArray(value?.contentBlocks) ? value.contentBlocks : createEmptyRichBlocks(),
    correctAnswer: typeof value?.correctAnswer === 'boolean' ? value.correctAnswer : true,
    acceptedAnswersText: value?.acceptedAnswersText == null ? '' : String(value.acceptedAnswersText),
    correct: value?.correct == null ? '' : value.correct,
    tolerance: Number.isFinite(Number(value?.tolerance)) ? Number(value.tolerance) : 0,
    instructions: value?.instructions == null ? '' : String(value.instructions),
    rubric: Array.isArray(value?.rubric) && value.rubric.length ? value.rubric : [{ name: 'Nội dung', weight: 100, description: '' }],
    explanation: value?.explanation == null ? '' : String(value.explanation),
    isPublished: Boolean(value?.isPublished),
  }));
};

const extractPlaceholders = (templateText) => {
  const text = String(templateText || '');
  const matches = [...text.matchAll(/\[inputs\.(q\d+)\]/g)];
  return matches.map((match) => match[1]);
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
  const [title, setTitle] = useState(initialValue?.title || '');
  const [textTemplate, setTextTemplate] = useState(initialValue?.text_template || '');
  const [innerQuestions, setInnerQuestions] = useState(() => normalizeInitialInnerQuestions(initialValue?.inner_questions));
  const [showErrors, setShowErrors] = useState(false);
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
  }, [compact, initialValue?.title, initialTextTemplate, initialInnerQuestionsSignature]);

  useEffect(() => {
    if (!compact || typeof onChange !== 'function') {
      return;
    }

    onChange({
      text_template: String(templateText || '').trim(),
      inner_questions: innerQuestions.reduce((accumulator, item) => {
        const key = String(item.key || '').trim();
        if (!key) {
          return accumulator;
        }

        const normalized = {
          type: item.type,
          points: Number(item.points) || 1,
          content: String(item.content || '').trim(),
          contentBlocks: Array.isArray(item.contentBlocks) ? item.contentBlocks : createEmptyRichBlocks(),
          explanation: String(item.explanation || '').trim(),
          isPublished: Boolean(item.isPublished),
        };

        if (item.type === 'MULTICHOICE') {
          normalized.options = cloneOptions(item.options).map((option) => String(option).trim()).filter(Boolean);
          normalized.correct = String(item.correct || '').trim();
        } else if (item.type === 'TRUE_FALSE') {
          normalized.correctAnswer = Boolean(item.correctAnswer);
        } else if (item.type === 'SHORT_ANSWER') {
          normalized.correct = String(item.correct || '').trim();
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
    });
  }, [compact, innerQuestions, onChange, templateText]);

  const activeTemplateText = compact ? String(templateText || '') : textTemplate;
  const placeholderKeys = useMemo(() => extractPlaceholders(activeTemplateText), [activeTemplateText]);

  const validation = useMemo(() => {
    const errors = [];
    const byKey = {};

    if (!compact && !String(title).trim()) {
      errors.push('Hãy nhập tiêu đề câu hỏi.');
    }

    if (!String(activeTemplateText).trim()) {
      errors.push('Hãy nhập text_template cho câu hỏi bài đọc.');
    }

    const uniquePlaceholders = new Set(placeholderKeys);
    if (!uniquePlaceholders.size) {
      errors.push('Nội dung cần ít nhất một placeholder dạng [inputs.q1].');
    }

    innerQuestions.forEach((item) => {
      const key = String(item.key || '').trim();
      const cardErrors = [];

      if (!key) {
        cardErrors.push('Thiếu mã câu hỏi nhỏ.');
      }

      const contentLength = (richContentToPlainText(item.contentBlocks) || String(item.content || '').trim()).length;
      if (contentLength < 10) {
        cardErrors.push('Nội dung câu hỏi cần ít nhất 10 ký tự.');
      }

      if (item.type === 'MULTICHOICE') {
        const options = cloneOptions(item.options).map((option) => String(option).trim()).filter(Boolean);
        if (options.length < 2) {
          cardErrors.push('MULTICHOICE cần ít nhất 2 tùy chọn.');
        }

        if (!String(item.correct ?? '').trim()) {
          cardErrors.push('Vui lòng nhập đáp án đúng chính xác cho MULTICHOICE.');
        } else if (options.length && !options.includes(String(item.correct).trim())) {
          cardErrors.push('Đáp án đúng phải trùng chính xác với một trong các tùy chọn.');
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
        byKey[key || `q${innerQuestions.indexOf(item) + 1}`] = cardErrors;
      }
    });

    placeholderKeys.forEach((key) => {
      if (!innerQuestions.some((item) => String(item.key).trim() === key)) {
        errors.push(`Placeholder [inputs.${key}] chưa có câu hỏi nhỏ tương ứng.`);
      }
    });

    innerQuestions.forEach((item) => {
      const key = String(item.key || '').trim();
      if (!key) {
        return;
      }
      if (!placeholderKeys.includes(key)) {
        byKey[key] = [...(byKey[key] || []), 'Câu hỏi nhỏ này chưa được dùng trong text_template.'];
      }
    });

    return { ok: errors.length === 0 && Object.keys(byKey).length === 0, errors, byKey };
  }, [compact, innerQuestions, placeholderKeys, activeTemplateText, title]);

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
    setInnerQuestions((prev) => [...prev, createInnerQuestionDraft(prev.length)]);
  };

  const removeInnerQuestion = (index) => {
    setInnerQuestions((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
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
      inner_questions: innerQuestions.reduce((accumulator, item) => {
        const key = String(item.key || '').trim();
        if (!key) {
          return accumulator;
        }

        const normalized = {
          type: item.type,
          points: Number(item.points) || 1,
        };

        if (item.type === 'MULTICHOICE') {
          normalized.options = cloneOptions(item.options).map((option) => String(option).trim()).filter(Boolean);
          normalized.correct = String(item.correct || '').trim();
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
          Tạo câu hỏi bài đọc bằng text_template và các câu hỏi nhỏ gắn theo placeholder [inputs.qX].
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
                  Nội dung gốc / text_template
                </label>
                <span className="text-xs text-slate-500">Dùng đúng dạng [inputs.q1], [inputs.q2], ...</span>
              </div>
              <textarea
                id="cloze-text-template"
                ref={templateRef}
                value={textTemplate}
                onChange={(event) => setTextTemplate(event.target.value)}
                placeholder="Thủ đô của Việt Nam là [inputs.q1]. Thành phố này có diện tích là [inputs.q2] km²."
                rows={6}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Xem trước chuỗi</h3>
                  <p className="text-xs text-slate-500">Các placeholder sẽ được render thành badge tạm trong preview.</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-800">
                {String(textTemplate || '').split(/(\[inputs\.q\d+\])/g).filter(Boolean).map((part, index) => {
                  const match = part.match(/^\[inputs\.(q\d+)\]$/);
                  if (match) {
                    return (
                      <span key={`${match[1]}-${index}`} className="mx-1 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                        {part}
                      </span>
                    );
                  }
                  return <span key={`preview-${index}`}>{part}</span>;
                })}
              </div>
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
              onClick={addInnerQuestion}
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

      <div className="space-y-4 border-t border-slate-200 px-6 py-6">
        {innerQuestions.map((item, index) => {
          const cardErrors = validation.byKey[item.key] || [];

          return (
            <div key={item.key || index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Câu hỏi nhỏ {index + 1}</h4>
                  <p className="text-xs text-slate-500">Key: {item.key || `q${index + 1}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => insertPlaceholderAtCursor(item.key || `q${index + 1}`)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Chèn placeholder
                  </button>
                  <button
                    type="button"
                    onClick={() => removeInnerQuestion(index)}
                    disabled={innerQuestions.length <= 1}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Key</label>
                  <input
                    value={item.key}
                    onChange={(event) => updateInnerQuestion(index, { key: event.target.value })}
                    placeholder="q1"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Loại câu hỏi</label>
                  <select
                    value={item.type}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      updateInnerQuestion(index, {
                        type: nextType,
                        options: nextType === 'MULTICHOICE' ? cloneOptions(item.options) : [''],
                        optionsRich: nextType === 'MULTICHOICE' ? (Array.isArray(item.optionsRich) && item.optionsRich.length ? item.optionsRich : [createEmptyRichBlocks()]) : item.optionsRich,
                        correctAnswer: nextType === 'TRUE_FALSE' ? (typeof item.correctAnswer === 'boolean' ? item.correctAnswer : true) : item.correctAnswer,
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

              <div className="mt-4">
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
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-semibold text-slate-900">Danh sách tùy chọn</h5>
                    <button
                      type="button"
                      onClick={() => updateInnerQuestion(index, {
                        options: [...cloneOptions(item.options), ''],
                        optionsRich: [...(Array.isArray(item.optionsRich) && item.optionsRich.length ? item.optionsRich : [createEmptyRichBlocks()]), createEmptyRichBlocks()],
                      })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      + Thêm option
                    </button>
                  </div>

                  <div className="space-y-3">
                    {((Array.isArray(item.optionsRich) && item.optionsRich.length) ? item.optionsRich : [createEmptyRichBlocks()]).map((optionBlocks, optionIndex) => (
                      <div key={`${item.key}-option-${optionIndex}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-900">Đáp án {String.fromCharCode(65 + optionIndex)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextOptions = cloneOptions(item.options).filter((_, currentIndex) => currentIndex !== optionIndex);
                              const nextRich = (Array.isArray(item.optionsRich) && item.optionsRich.length ? item.optionsRich : [createEmptyRichBlocks()]).filter((_, currentIndex) => currentIndex !== optionIndex);
                              updateInnerQuestion(index, {
                                options: nextOptions.length ? nextOptions : [''],
                                optionsRich: nextRich.length ? nextRich : [createEmptyRichBlocks()],
                              });
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
                          >
                            Xóa option
                          </button>
                        </div>
                        <RichContentEditor
                          title=""
                          helperText="Có thể dùng văn bản, ảnh hoặc video cho đáp án này."
                          value={optionBlocks}
                          onChange={(nextBlocks) => {
                            const nextRich = Array.isArray(item.optionsRich) && item.optionsRich.length ? [...item.optionsRich] : [createEmptyRichBlocks()];
                            nextRich[optionIndex] = nextBlocks;
                            const nextOptions = cloneOptions(item.options);
                            nextOptions[optionIndex] = richContentToPlainText(nextBlocks);
                            updateInnerQuestion(index, { optionsRich: nextRich, options: nextOptions });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.type === 'TRUE_FALSE' ? (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Đáp án đúng</label>
                  <select
                    value={String(item.correctAnswer)}
                    onChange={(event) => updateInnerQuestion(index, { correctAnswer: event.target.value === 'true' })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="true">Đúng</option>
                    <option value="false">Sai</option>
                  </select>
                </div>
              ) : null}

              {item.type === 'SHORT_ANSWER' ? (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Danh sách đáp án chấp nhận</label>
                  <textarea
                    value={item.acceptedAnswersText}
                    onChange={(event) => updateInnerQuestion(index, { acceptedAnswersText: event.target.value })}
                    placeholder="Mỗi dòng 1 đáp án chấp nhận"
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              ) : null}

              {item.type === 'ESSAY' ? (
                <div className="mt-4 space-y-4">
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

              {item.type === 'MULTICHOICE' || item.type === 'NUMERICAL' ? (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Đáp án đúng chính xác</label>
                  <input
                    type={item.type === 'NUMERICAL' ? 'number' : 'text'}
                    value={item.correct}
                    onChange={(event) => updateInnerQuestion(index, { correct: event.target.value })}
                    placeholder={item.type === 'MULTICHOICE' ? 'Ví dụ: Hà Nội' : 'Ví dụ: 3358'}
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

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Giải thích (không bắt buộc)</label>
                  <textarea
                    value={item.explanation}
                    onChange={(event) => updateInnerQuestion(index, { explanation: event.target.value })}
                    placeholder="Nhập giải thích để giúp học sinh hiểu rõ hơn..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.isPublished}
                    onChange={(event) => updateInnerQuestion(index, { isPublished: event.target.checked })}
                  />
                  <span className="text-sm text-slate-700">Công khai câu hỏi ngay sau khi lưu</span>
                </label>
              </div>

              {cardErrors.length ? (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {cardErrors.map((error) => (
                    <div key={error}>• {error}</div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

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