import React, { useState, useEffect, useRef, useCallback } from 'react';
import httpClient from '../api/httpClient';
import './QuizTaker.css';

const parseJson = (value, fallback = {}) => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }
  return value;
};

const isAnswered = (entry) => {
  if (!entry) {
    return false;
  }

  const { type, value } = entry;
  if (type === 'MULTIPLE_CHOICE') {
    return Array.isArray(value?.indices) && value.indices.length > 0;
  }
  if (type === 'TRUE_FALSE') {
    return typeof value?.value === 'boolean';
  }
  return Boolean(value?.text?.trim());
};

const formatAnswerValue = (answerValue, questionType) => {
  if (answerValue == null) {
    return 'Chưa trả lời';
  }

  if (questionType === 'MULTIPLE_CHOICE') {
    const indices = Array.isArray(answerValue?.indices) ? answerValue.indices : [];
    return indices.length > 0 ? `Đã chọn ${indices.map((index) => index + 1).join(', ')}` : 'Chưa trả lời';
  }

  if (questionType === 'TRUE_FALSE') {
    if (typeof answerValue?.value === 'boolean') {
      return answerValue.value ? 'Đúng' : 'Sai';
    }
    return 'Chưa trả lời';
  }

  if (typeof answerValue === 'string') {
    return answerValue.trim() || 'Chưa trả lời';
  }

  if (typeof answerValue?.text === 'string') {
    return answerValue.text.trim() || 'Chưa trả lời';
  }

  return JSON.stringify(answerValue);
};

const formatGradingDetails = (item) => {
  const details = item?.gradingDetails || {};
  const questionType = item?.question?.type || item?.answerType;

  if (questionType === 'MULTIPLE_CHOICE') {
    const correctIndices = Array.isArray(details.correctIndices) ? details.correctIndices : [];
    const studentIndices = Array.isArray(details.studentIndices) ? details.studentIndices : [];
    return [
      `Đáp án đúng: ${correctIndices.length ? correctIndices.map((index) => index + 1).join(', ') : 'Không có dữ liệu'}`,
      `Lựa chọn của bạn: ${studentIndices.length ? studentIndices.map((index) => index + 1).join(', ') : 'Chưa trả lời'}`,
      details.explanation ? `Giải thích: ${details.explanation}` : null,
    ].filter(Boolean);
  }

  if (questionType === 'TRUE_FALSE') {
    return [
      typeof details.correctAnswer === 'boolean'
        ? `Đáp án đúng: ${details.correctAnswer ? 'Đúng' : 'Sai'}`
        : 'Đáp án đúng: Không có dữ liệu',
      typeof details.studentValue === 'boolean'
        ? `Lựa chọn của bạn: ${details.studentValue ? 'Đúng' : 'Sai'}`
        : 'Lựa chọn của bạn: Chưa trả lời',
      details.explanation ? `Giải thích: ${details.explanation}` : null,
    ].filter(Boolean);
  }

  if (questionType === 'SHORT_ANSWER') {
    return [
      details.matchedAnswer ? `Đáp án khớp: ${details.matchedAnswer}` : null,
      Array.isArray(details.acceptedAnswers) && details.acceptedAnswers.length
        ? `Các đáp án chấp nhận: ${details.acceptedAnswers.join(', ')}`
        : null,
      details.explanation ? `Giải thích: ${details.explanation}` : null,
    ].filter(Boolean);
  }

  if (questionType === 'ESSAY') {
    const criteria = Array.isArray(details.criteria) ? details.criteria : [];
    return [
      typeof details.wordCount === 'number' ? `Số từ: ${details.wordCount}` : null,
      typeof details.withinWordLimit === 'boolean' ? `Đúng giới hạn từ: ${details.withinWordLimit ? 'Có' : 'Không'}` : null,
      criteria.length ? `Tiêu chí chấm: ${criteria.map((criterion) => `${criterion.name} ${criterion.score}`).join(' | ')}` : null,
    ].filter(Boolean);
  }

  return [];
};

const QuizTaker = ({ quizId, onBack, onSubmit }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoSaveIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const autoAdvanceTimeoutRef = useRef(null);
  const previousAnswerRef = useRef({});

  const loadQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/quizzes/${quizId}`);
      const payload = response?.data?.data || {};
      const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];

      const normalizedQuestions = rawQuestions.map((item) => {
        const metadata = parseJson(item.metadata, {});
        return {
          ...item,
          questionText: item.questionText || item.content || '',
          content: item.content || item.questionText || '',
          type: item.type || 'MULTIPLE_CHOICE',
          metadata,
          options: Array.isArray(item.options) ? item.options : (Array.isArray(metadata.options) ? metadata.options : []),
        };
      });

      setQuiz({
        ...payload,
        questions: normalizedQuestions,
      });
      setTimeLeft(Number(payload.duration || 0) * 60);

      const attemptResponse = await httpClient.post(`/quizzes/${quizId}/start`);
      setAttemptId(attemptResponse?.data?.data?.id || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải bài kiểm tra');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const saveAnswers = useCallback(async () => {
    if (!attemptId || isSubmitted) {
      return;
    }

    setIsSaving(true);
    try {
      for (const [questionId, answerEntry] of Object.entries(answers)) {
        // eslint-disable-next-line no-await-in-loop
        await httpClient.post(`/quizzes/${quizId}/save-answer`, {
          questionId: Number(questionId),
          answer: answerEntry.value,
        });
      }
    } catch (err) {
      console.error('Không thể lưu câu trả lời:', err);
    } finally {
      setIsSaving(false);
    }
  }, [quizId, attemptId, answers, isSubmitted]);

  useEffect(() => {
    if (!attemptId || isSubmitted) {
      return undefined;
    }

    autoSaveIntervalRef.current = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveAnswers();
      }
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [attemptId, answers, isSubmitted, saveAnswers]);

  const handleSubmit = useCallback(async () => {
    if (!attemptId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await httpClient.post(
        `/quizzes/${quizId}/submit`,
        {
          answers,
        },
        {
          timeout: 120000,
        },
      );

      setIsSubmitted(true);
      setResult(response?.data?.data || null);

      if (onSubmit) {
        onSubmit(response?.data?.data || null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể nộp bài kiểm tra');
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, answers, onSubmit, quizId]);

  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0 || isSubmitted) {
      return undefined;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timeLeft, isSubmitted, handleSubmit]);

  useEffect(() => {
    return () => {
      if (!isSubmitted && Object.keys(answers).length > 0) {
        saveAnswers();
      }
    };
  }, [answers, isSubmitted, saveAnswers]);

  const setQuestionAnswer = (questionId, type, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        type,
        value,
      },
    }));
  };

  // Auto-advance to next question after answering
  useEffect(() => {
    if (isSubmitted || !quiz?.questions?.length) {
      return;
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) {
      return;
    }

    const currentAnswer = answers[currentQuestion.id];
    const previousAnswer = previousAnswerRef.current[currentQuestion.id];

    // Check if a new answer was just provided
    if (currentAnswer && !previousAnswer && isAnswered({ type: currentAnswer.type, value: currentAnswer.value })) {
      previousAnswerRef.current[currentQuestion.id] = currentAnswer;

      // Clear any existing timeout
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }

      // Auto-advance to next question after 1 second
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        const nextIndex = Math.min(currentQuestionIndex + 1, quiz.questions.length - 1);
        if (nextIndex > currentQuestionIndex) {
          setCurrentQuestionIndex(nextIndex);
        }
      }, 1000);
    }

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [answers, currentQuestionIndex, isSubmitted, quiz?.questions]);

  const toggleMultipleChoiceOption = (questionId, optionIndex) => {
    const current = answers[questionId]?.value?.indices || [];
    const hasIndex = current.includes(optionIndex);
    const next = hasIndex ? current.filter((item) => item !== optionIndex) : [...current, optionIndex];
    setQuestionAnswer(questionId, 'MULTIPLE_CHOICE', { indices: next });
  };

  const formatTime = (seconds) => {
    if (!seconds) {
      return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = (question) => {
    const questionType = question.type || 'MULTIPLE_CHOICE';
    const metadata = parseJson(question.metadata, {});

    if (questionType === 'MULTIPLE_CHOICE') {
      const selectedIndices = answers[question.id]?.value?.indices || [];
      const options = Array.isArray(question.options) ? question.options : [];

      return (
        <div className="question-options">
          {options.map((option, index) => (
            <label key={`${question.id}-opt-${index + 1}`} className="option">
              <input
                type="checkbox"
                checked={selectedIndices.includes(index)}
                onChange={() => toggleMultipleChoiceOption(question.id, index)}
                disabled={isSubmitted}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (questionType === 'TRUE_FALSE') {
      const selected = answers[question.id]?.value?.value;
      return (
        <div className="question-options">
          <label className="option">
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={selected === true}
              onChange={() => setQuestionAnswer(question.id, 'TRUE_FALSE', { value: true })}
              disabled={isSubmitted}
            />
            <span className="option-text">Đúng</span>
          </label>
          <label className="option">
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={selected === false}
              onChange={() => setQuestionAnswer(question.id, 'TRUE_FALSE', { value: false })}
              disabled={isSubmitted}
            />
            <span className="option-text">Sai</span>
          </label>
        </div>
      );
    }

    if (questionType === 'SHORT_ANSWER') {
      const value = answers[question.id]?.value?.text || '';
      return (
        <div className="question-options">
          <input
            className="option-text"
            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
            value={value}
            onChange={(event) => setQuestionAnswer(question.id, 'SHORT_ANSWER', { text: event.target.value })}
            placeholder="Nhập câu trả lời ngắn..."
            disabled={isSubmitted}
          />
        </div>
      );
    }

    const essayText = answers[question.id]?.value?.text || '';
    const rubric = Array.isArray(metadata.rubric) ? metadata.rubric : [];
    return (
      <div className="question-options">
        {metadata.instructions ? <p style={{ marginBottom: 8 }}>Hướng dẫn: {metadata.instructions}</p> : null}
        {rubric.length ? (
          <details style={{ marginBottom: 10 }}>
            <summary>Xem rubric chấm điểm</summary>
            <ul>
              {rubric.map((item, index) => (
                <li key={`${question.id}-rubric-${index + 1}`}>
                  {item.name}: {item.weight}% - {item.description}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <textarea
          className="option-text"
          style={{ width: '100%', minHeight: 140, padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
          value={essayText}
          onChange={(event) => setQuestionAnswer(question.id, 'ESSAY', { text: event.target.value })}
          placeholder="Nhập bài viết tự luận..."
          disabled={isSubmitted}
        />
        <small>Số từ: {essayText.trim() ? essayText.trim().split(/\s+/).length : 0}</small>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="quiz-taker quiz-taker--loading">
        <div className="spinner"></div>
        <p>Đang tải đề thi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-taker quiz-taker--error">
        <h3>Lỗi</h3>
        <p>{error}</p>
        <button onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  if (!quiz) {
    return <div className="quiz-taker">Đang tải...</div>;
  }

  if (isSubmitted && result) {
    return <QuizResult quiz={quiz} result={result} onBack={onBack} />;
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const questionCount = questions.length;

  if (questionCount === 0) {
    return (
      <div className="quiz-taker quiz-taker--error">
        <h3>Bài kiểm tra chưa có câu hỏi</h3>
        <p>Giảng viên chưa cấu hình câu hỏi cho bài kiểm tra này.</p>
        <button onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  const safeQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, questionCount - 1));
  const currentQuestion = questions[safeQuestionIndex] || null;
  const progressPercent = ((safeQuestionIndex + 1) / questionCount) * 100;
  const isTimeWarning = timeLeft && timeLeft < 60;
  const isTimeDanger = timeLeft && timeLeft < 10;
  const answeredCount = Object.values(answers).filter((entry) => isAnswered(entry)).length;

  return (
    <div className="quiz-taker">
      <div className="quiz-taker__header">
        <div className="quiz-taker__title">
          <h2>{quiz.title}</h2>
        </div>
        <div className={`quiz-taker__timer ${isTimeDanger ? 'danger' : isTimeWarning ? 'warning' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="quiz-taker__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="progress-text">
          Câu {safeQuestionIndex + 1}/{questionCount}
        </p>
      </div>

      {currentQuestion ? (
        <div className="quiz-taker__question">
          <h3 className="question-text">{currentQuestion.questionText}</h3>
          {renderQuestionInput(currentQuestion)}
        </div>
      ) : null}

      <div className="quiz-taker__navigation">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, safeQuestionIndex - 1))}
          disabled={safeQuestionIndex === 0 || isSubmitted}
          className="btn btn--secondary"
        >
          Câu trước
        </button>

        <div className="question-selector">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`question-btn ${index === safeQuestionIndex ? 'active' : ''} ${isAnswered(answers[q.id]) ? 'answered' : ''}`}
              disabled={isSubmitted}
              title={`Câu ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentQuestionIndex(Math.min(questionCount - 1, safeQuestionIndex + 1))}
          disabled={safeQuestionIndex === questionCount - 1 || isSubmitted}
          className="btn btn--secondary"
        >
          Câu sau
        </button>
      </div>

      <div className="quiz-taker__footer">
        {isSaving ? <span className="saving-status">Đang lưu...</span> : null}
        <button onClick={handleSubmit} disabled={isSubmitted || isSubmitting} className="btn btn--primary btn--large">
          {isSubmitting ? 'Đang nộp bài...' : `Nộp bài (${answeredCount}/${questionCount} câu)`}
        </button>
      </div>
    </div>
  );
};

/**
 * QuizResult Component
 * Displays quiz results and score
 */
const QuizResult = ({ quiz, result, onBack }) => {
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const loadAttemptDetails = async () => {
      if (!quiz?.id || !result?.id) {
        return;
      }
      try {
        setLoadingDetails(true);
        const response = await httpClient.get(`/quizzes/${quiz.id}/attempts/${result.id}`);
        setAttemptDetails(response?.data?.data || null);
      } catch (_error) {
        setAttemptDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadAttemptDetails();
  }, [quiz?.id, result?.id]);

  const scorePercent = Number(result.totalScore || 0);
  const isPassed = result.isPassed;
  const questionCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
  const attemptAnswers = Array.isArray(attemptDetails?.answers) ? attemptDetails.answers : [];

  return (
    <div className="quiz-result">
      <div className="result-header">
        <h2>{quiz.title}</h2>
        <p className="result-subtitle">Kết quả làm bài</p>
      </div>

      <div className={`result-score ${isPassed ? 'passed' : 'failed'}`}>
        <div className="score-circle">
          <span className="score-number">{scorePercent.toFixed(1)}</span>
          <span className="score-percent">%</span>
        </div>

        <div className="score-status">
          {isPassed ? (
            <>
              <h3>✅ Đạt yêu cầu!</h3>
              <p>Chúc mừng bạn đã hoàn thành bài kiểm tra!</p>
            </>
          ) : (
            <>
              <h3>❌ Chưa đạt</h3>
              <p>Điểm yêu cầu: {quiz.passScore}%</p>
            </>
          )}
        </div>
      </div>

      <div className="result-details">
        <div className="detail-item">
          <span className="detail-label">Điểm yêu cầu:</span>
          <span className="detail-value">{quiz.passScore}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Tổng câu hỏi:</span>
          <span className="detail-value">{questionCount}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Lần làm thứ:</span>
          <span className="detail-value">{result.attemptNumber}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Thời gian làm:</span>
          <span className="detail-value">{quiz.duration} phút</span>
        </div>
        {attemptAnswers.length > 0 && (
          <>
            <div className="detail-item">
              <span className="detail-label">✅ Câu trả lời đúng:</span>
              <span className="detail-value">{attemptAnswers.filter(a => Number(a.score || 0) >= Number(a.maxScore || 1) * 0.5).length}/{questionCount}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">❌ Câu trả lời sai:</span>
              <span className="detail-value">{attemptAnswers.filter(a => Number(a.score || 0) < Number(a.maxScore || 1) * 0.5).length}/{questionCount}</span>
            </div>
          </>
        )}
      </div>

      <div className="result-breakdown">
        <div className="result-breakdown__header">
          <h3>📋 Chi tiết chấm điểm từng câu</h3>
          <p>Mỗi câu hiển thị điểm, câu trả lời của bạn và tiêu chí chấm tương ứng.</p>
          
          {attemptAnswers.length > 0 && (
            <div style={{
              marginTop: '12px',
              display: 'flex',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <span>✅ Đúng: <strong>{attemptAnswers.filter(a => Number(a.score || 0) >= Number(a.maxScore || 1) * 0.5).length}</strong></span>
              <span>❌ Sai: <strong>{attemptAnswers.filter(a => Number(a.score || 0) < Number(a.maxScore || 1) * 0.5).length}</strong></span>
            </div>
          )}
        </div>

        {loadingDetails ? <p>Đang tải chi tiết chấm điểm...</p> : null}

        {!loadingDetails && attemptAnswers.length === 0 ? (
          <p>Chưa có dữ liệu chấm chi tiết cho lần làm này.</p>
        ) : null}

        {!loadingDetails && attemptAnswers.length > 0
          ? attemptAnswers.map((item, index) => {
              const questionType = item.question?.type || item.answerType || 'MULTIPLE_CHOICE';
              const detailLines = formatGradingDetails(item);

              return (
                <article className="result-question-card" key={`answer-${item.questionId}`}>
                  <div className="result-question-card__top">
                    <div>
                      <div className="result-question-card__label">Câu {index + 1}</div>
                      <h4>{item.question?.content || `Câu hỏi ${item.questionId}`}</h4>
                    </div>
                    <div className="result-question-card__score" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {Number(item.score || 0) >= Number(item.maxScore || 1) * 0.5 ? '✅' : '❌'}
                      <span>{Number(item.score || 0).toFixed(1)}/{Number(item.maxScore || 10).toFixed(1)} điểm</span>
                    </div>
                  </div>

                  <div className="result-question-card__meta">
                    <span>{questionType}</span>
                    <span>Câu trả lời của bạn: {formatAnswerValue(item.answerValue, questionType)}</span>
                  </div>

                  {detailLines.length ? (
                    <div className="result-question-card__details">
                      {detailLines.map((line) => (
                        <p key={`${item.questionId}-${line}`}>{line}</p>
                      ))}
                    </div>
                  ) : null}

                  {item.aiFeedback ? (
                    <div className="result-question-card__feedback">
                      <strong>💡 Phản hồi AI:</strong>
                      <p>{typeof item.aiFeedback === 'string' ? item.aiFeedback : JSON.stringify(item.aiFeedback)}</p>
                    </div>
                  ) : null}
                </article>
              );
            })
          : null}
      </div>

      <button onClick={onBack} className="btn btn--primary btn--large">
        Quay lại
      </button>
    </div>
  );
};

export default QuizTaker;
