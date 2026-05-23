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

function ClozeQuestionPlayer({ questionData, onSubmit, initialAnswers = {} }) {
  const parsedQuestion = useMemo(() => parseQuestionData(questionData), [questionData]);
  const [userAnswers, setUserAnswers] = useState(() => ({
    ...normalizeInitialAnswers(questionData),
    ...initialAnswers,
  }));

  const innerQuestions = parsedQuestion.inner_questions;
  const segments = useMemo(() => tokenizeTemplate(parsedQuestion.text_template), [parsedQuestion.text_template]);

  const getInnerQuestion = (key) => innerQuestions?.[key] || null;

  const setAnswer = (key, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-8 text-slate-800">
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            return (
              <span key={`text-${index}`} className="whitespace-pre-wrap">
                {segment.value}
              </span>
            );
          }

          return (
            <span key={`${segment.key}-${index}`} className="inline-flex align-middle">
              {renderInput(segment.key)}
            </span>
          );
        })}
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