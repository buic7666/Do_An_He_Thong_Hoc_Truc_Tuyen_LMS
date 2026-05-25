import { useMemo, useState } from 'react';

const parseQuestionData = (questionData) => {
  if (!questionData || typeof questionData !== 'object') {
    return { text_template: '', inner_questions: {} };
  }

  return {
    text_template: String(questionData.text_template || ''),
    inner_questions: questionData.inner_questions && typeof questionData.inner_questions === 'object'
      ? questionData.inner_questions
      : {},
  };
};

const tokenizeTemplate = (templateText) => {
  const text = String(templateText || '');
  const segments = [];
  const regex = /\[inputs\.(q\d+)\]/g;

  let lastIndex = 0;
  let match = regex.exec(text);
  while (match) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    segments.push({ type: 'input', key: match[1], token: match[0] });
    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: text }];
};

const normalizeInitialAnswers = (questionData) => {
  const { inner_questions: innerQuestions } = parseQuestionData(questionData);
  return Object.keys(innerQuestions).reduce((accumulator, key) => {
    accumulator[key] = '';
    return accumulator;
  }, {});
};

const sortInnerQuestionEntries = (innerQuestions) => {
  return Object.entries(innerQuestions || {}).sort((left, right) => {
    const leftIndex = Number(String(left[0] || '').replace(/\D/g, '')) || 0;
    const rightIndex = Number(String(right[0] || '').replace(/\D/g, '')) || 0;
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
    return String(left[0] || '').localeCompare(String(right[0] || ''));
  });
};

function ClozeQuestionPlayer({ questionData, onSubmit, initialAnswers = {} }) {
  const parsedQuestion = useMemo(() => parseQuestionData(questionData), [questionData]);
  const [userAnswers, setUserAnswers] = useState(() => ({
    ...normalizeInitialAnswers(questionData),
    ...initialAnswers,
  }));

  const innerQuestions = parsedQuestion.inner_questions;
  const contentBlocks = Array.isArray(questionData?.contentBlocks)
    ? questionData.contentBlocks
    : Array.isArray(questionData?.metadata?.contentBlocks)
      ? questionData.metadata.contentBlocks
      : [];
  const questionEntries = useMemo(() => sortInnerQuestionEntries(innerQuestions), [innerQuestions]);

  const getInnerQuestion = (key) => innerQuestions?.[key] || null;

  const setAnswer = (key, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderAnswerInput = (key, innerQuestion) => {
    const value = userAnswers[key] ?? '';
    const baseClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
    const type = String(innerQuestion?.type || 'SHORT_ANSWER').toUpperCase();

    if (type === 'MULTICHOICE' || type === 'MULTIPLE_CHOICE') {
      const options = Array.isArray(innerQuestion?.options) ? innerQuestion.options : [];
      return (
        <select
          value={value}
          onChange={(event) => setAnswer(key, event.target.value)}
          className={baseClassName}
        >
          <option value="">-- Chọn đáp án --</option>
          {options.map((option, index) => (
            <option key={`${key}-option-${index}`} value={typeof option === 'string' ? option : (option?.text || String(option || ''))}>
              {typeof option === 'string' ? option : (option?.text || String(option || ''))}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'TRUE_FALSE') {
      return (
        <select
          value={typeof value === 'boolean' ? (value ? 'true' : 'false') : (value == null ? '' : String(value))}
          onChange={(event) => {
            const nextValue = event.target.value === 'true' ? true : event.target.value === 'false' ? false : null;
            setAnswer(key, nextValue);
          }}
          className={baseClassName}
        >
          <option value="">-- Chọn --</option>
          <option value="true">Đúng</option>
          <option value="false">Sai</option>
        </select>
      );
    }

    if (type === 'ESSAY') {
      return (
        <textarea
          value={value}
          onChange={(event) => setAnswer(key, event.target.value)}
          placeholder="Nhập câu trả lời của bạn"
          rows={4}
          className={baseClassName}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(event) => setAnswer(key, event.target.value)}
        placeholder="Nhập câu trả lời"
        className={baseClassName}
      />
    );
  };

  const renderInput = (key) => {
    const innerQuestion = getInnerQuestion(key);
    if (!innerQuestion) {
      return (
        <span className="mx-1 inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
          Missing {`[inputs.${key}]`}
        </span>
      );
    }

    const value = userAnswers[key] ?? '';
    const baseClassName = 'inline-flex min-w-[7.5rem] max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100';

    if (innerQuestion.type === 'MULTICHOICE') {
      const options = Array.isArray(innerQuestion.options) ? innerQuestion.options : [];
      return (
        <span className="mx-1 inline-flex align-middle">
          <select
            value={value}
            onChange={(event) => setAnswer(key, event.target.value)}
            className={`${baseClassName} min-w-[12rem]`}
          >
            <option value="">-- Chọn đáp án --</option>
            {options.map((option, index) => (
              <option key={`${key}-option-${index}`} value={option}>{option}</option>
            ))}
          </select>
        </span>
      );
    }

    if (innerQuestion.type === 'NUMERICAL') {
      return (
        <span className="mx-1 inline-flex align-middle">
          <input
            type="number"
            step="any"
            value={value}
            onChange={(event) => {
              setAnswer(key, event.target.value);
            }}
            placeholder="Nhập số"
            className={`${baseClassName} w-[9rem]`}
          />
        </span>
      );
    }

    return (
      <span className="mx-1 inline-flex align-middle">
        <input
          type="text"
          value={value}
          onChange={(event) => setAnswer(key, event.target.value)}
          placeholder="Nhập câu trả lời"
          className={`${baseClassName} min-w-[11rem]`}
        />
      </span>
    );
  };

  const handleSubmit = () => {
    const normalizedAnswers = Object.entries(userAnswers).reduce((accumulator, [key, value]) => {
      const innerQuestion = innerQuestions?.[key];

      if (!innerQuestion) {
        return accumulator;
      }

      if (innerQuestion.type === 'NUMERICAL') {
        accumulator[key] = value === '' || value == null ? '' : Number(value);
      } else {
        accumulator[key] = typeof value === 'string' ? value.trim() : value;
      }

      return accumulator;
    }, {});

    onSubmit?.(normalizedAnswers);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {contentBlocks.length > 0 ? (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <RichContentRenderer blocks={contentBlocks} />
        </div>
      ) : parsedQuestion.text_template ? (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-800 whitespace-pre-wrap">
          {parsedQuestion.text_template}
        </div>
      ) : null}

      <div className="space-y-4">
        {questionEntries.map(([key, innerQuestion], index) => (
          <div key={`${key}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Câu hỏi {index + 1}</p>
                <h4 className="mt-1 text-base font-semibold text-slate-900">
                  {innerQuestion?.content || `Câu hỏi nhỏ ${index + 1}`}
                </h4>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {String(innerQuestion?.type || 'SHORT_ANSWER').toUpperCase()}
              </span>
            </div>

            {Array.isArray(innerQuestion?.contentBlocks) && innerQuestion.contentBlocks.length > 0 ? (
              <div className="mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                <RichContentRenderer blocks={innerQuestion.contentBlocks} />
              </div>
            ) : null}

            {renderAnswerInput(key, innerQuestion)}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          Số ô đã trả lời: {Object.values(userAnswers).filter((value) => String(value ?? '').trim() !== '').length}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Nộp bài
        </button>
      </div>
    </div>
  );
}

export default ClozeQuestionPlayer;