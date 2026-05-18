import React, { useState, useEffect } from 'react';
import httpClient from '../api/httpClient';
import './QuizList.css';

/**
 * QuizList Component
 * Displays all quizzes available for a course
 * Shows quiz details, student's best score, and allows starting new attempts
 */

const QuizList = ({
  courseId,
  chapterId = null,
  lessonId = null,
  scope = 'all',
  onSelectQuiz,
  emptyMessage = 'Khóa học này chưa có bài kiểm tra nào',
}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [scores, setScores] = useState({});
  const [attemptsByQuiz, setAttemptsByQuiz] = useState({});
  const [attemptDetailsByKey, setAttemptDetailsByKey] = useState({});
  const [expandedHistoryQuizId, setExpandedHistoryQuizId] = useState(null);
  const [selectedAttemptByQuiz, setSelectedAttemptByQuiz] = useState({});
  const [loadingAttemptsByQuiz, setLoadingAttemptsByQuiz] = useState({});
  const [loadingAttemptDetailsByKey, setLoadingAttemptDetailsByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, [courseId, chapterId, lessonId, scope]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/courses/${courseId}/quizzes`);
      const allQuizzes = Array.isArray(response?.data?.data) ? response.data.data : [];
      let filteredQuizzes = allQuizzes;

      if (scope === 'lesson') {
        filteredQuizzes = lessonId
          ? allQuizzes.filter((quiz) => Number(quiz.lessonId) === Number(lessonId))
          : [];
      } else if (scope === 'chapter') {
        filteredQuizzes = chapterId
          ? allQuizzes.filter((quiz) => Number(quiz.chapterId) === Number(chapterId))
          : allQuizzes.filter((quiz) => !quiz.lessonId);
      } else if (lessonId) {
        filteredQuizzes = allQuizzes.filter((quiz) => Number(quiz.lessonId) === Number(lessonId) || !quiz.lessonId);
      }

      setQuizzes(filteredQuizzes);
      setAttemptsByQuiz({});
      setAttemptDetailsByKey({});
      setExpandedHistoryQuizId(null);
      setSelectedAttemptByQuiz({});
      setLoadingAttemptsByQuiz({});
      setLoadingAttemptDetailsByKey({});

      // Load scores for each quiz
      for (const quiz of filteredQuizzes) {
        try {
          const scoreResponse = await httpClient.get(`/quizzes/${quiz.id}/score`);
          setScores((prev) => ({
            ...prev,
            [quiz.id]: scoreResponse.data.data,
          }));
        } catch (err) {
          // No score yet
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };


  const getAttemptDetailKey = (quizId, attemptId) => `${quizId}-${attemptId}`;

  const handleToggleAttemptHistory = async (quizId) => {
    if (expandedHistoryQuizId === quizId) {
      setExpandedHistoryQuizId(null);
      return;
    }

    setExpandedHistoryQuizId(quizId);

    if (Array.isArray(attemptsByQuiz[quizId])) {
      return;
    }

    setLoadingAttemptsByQuiz((prev) => ({ ...prev, [quizId]: true }));
    try {
      const response = await httpClient.get(`/quizzes/${quizId}/attempts`);
      const attempts = Array.isArray(response?.data?.data) ? response.data.data : [];
      const sortedAttempts = [...attempts].sort((a, b) => Number(b.attemptNumber || 0) - Number(a.attemptNumber || 0));

      setAttemptsByQuiz((prev) => ({
        ...prev,
        [quizId]: sortedAttempts,
      }));

      if (sortedAttempts.length > 0) {
        setSelectedAttemptByQuiz((prev) => ({ ...prev, [quizId]: sortedAttempts[0].id }));
      }
    } catch (_error) {
      setAttemptsByQuiz((prev) => ({ ...prev, [quizId]: [] }));
    } finally {
      setLoadingAttemptsByQuiz((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  const handleSelectAttempt = async (quizId, attemptId) => {
    setSelectedAttemptByQuiz((prev) => ({ ...prev, [quizId]: attemptId }));
    const detailKey = getAttemptDetailKey(quizId, attemptId);

    if (attemptDetailsByKey[detailKey]) {
      return;
    }

    setLoadingAttemptDetailsByKey((prev) => ({ ...prev, [detailKey]: true }));
    try {
      const response = await httpClient.get(`/quizzes/${quizId}/attempts/${attemptId}`);
      setAttemptDetailsByKey((prev) => ({
        ...prev,
        [detailKey]: response?.data?.data || null,
      }));
    } catch (_error) {
      setAttemptDetailsByKey((prev) => ({
        ...prev,
        [detailKey]: { answers: [] },
      }));
    } finally {
      setLoadingAttemptDetailsByKey((prev) => ({ ...prev, [detailKey]: false }));
    }
  };
  if (loading) {
    return (
      <div className="quiz-list quiz-list--loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách bài kiểm tra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-list quiz-list--error">
        <h3>❌ Lỗi</h3>
        <p>{error}</p>
        <button onClick={loadQuizzes} className="btn btn--primary">
          Thử lại
        </button>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="quiz-list quiz-list--empty">
        <div className="empty-state">
          <h3>📚 Chưa có bài kiểm tra</h3>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list">
      <div className="quiz-list__header">
        <h2>📝 Bài Kiểm Tra</h2>
        <p className="quiz-list__subtitle">Tổng {quizzes.length} bài kiểm tra</p>
      </div>

      <div className="quiz-list__grid">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            score={scores[quiz.id]}
            onSelect={() => onSelectQuiz(quiz.id)}
            isHistoryOpen={expandedHistoryQuizId === quiz.id}
            attempts={attemptsByQuiz[quiz.id] || []}
            selectedAttemptId={selectedAttemptByQuiz[quiz.id] || null}
            attemptDetails={attemptDetailsByKey[getAttemptDetailKey(quiz.id, selectedAttemptByQuiz[quiz.id])] || null}
            loadingAttempts={Boolean(loadingAttemptsByQuiz[quiz.id])}
            loadingAttemptDetails={Boolean(loadingAttemptDetailsByKey[getAttemptDetailKey(quiz.id, selectedAttemptByQuiz[quiz.id])])}
            onToggleHistory={() => handleToggleAttemptHistory(quiz.id)}
            onSelectAttempt={(attemptId) => handleSelectAttempt(quiz.id, attemptId)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * QuizCard Component
 * Individual quiz card showing quiz info and score
 */
const formatAnswerValue = (answerValue, questionType) => {
  if (answerValue == null) {
    return 'Chưa trả lời';
  }

  if (questionType === 'MULTIPLE_CHOICE') {
    const indices = Array.isArray(answerValue?.indices) ? answerValue.indices : [];
    return indices.length > 0 ? `Đã chọn đáp án ${indices.map((index) => index + 1).join(', ')}` : 'Chưa trả lời';
  }

  if (questionType === 'TRUE_FALSE') {
    if (typeof answerValue?.value === 'boolean') {
      return answerValue.value ? 'Đúng' : 'Sai';
    }
    return 'Chưa trả lời';
  }

  if (typeof answerValue?.text === 'string') {
    return answerValue.text.trim() || 'Chưa trả lời';
  }

  if (typeof answerValue === 'string') {
    return answerValue.trim() || 'Chưa trả lời';
  }

  return JSON.stringify(answerValue);
};

const getGradingSummary = (gradingDetails, questionType) => {
  const details = gradingDetails || {};
  if (questionType === 'MULTIPLE_CHOICE') {
    const correctIndices = Array.isArray(details.correctIndices) ? details.correctIndices : [];
    return correctIndices.length ? `Đáp án đúng: ${correctIndices.map((index) => index + 1).join(', ')}` : 'Không có đáp án mẫu';
  }
  if (questionType === 'TRUE_FALSE') {
    return typeof details.correctAnswer === 'boolean'
      ? `Đáp án đúng: ${details.correctAnswer ? 'Đúng' : 'Sai'}`
      : 'Không có đáp án mẫu';
  }
  if (questionType === 'SHORT_ANSWER') {
    return details.matchedAnswer
      ? `Khớp với đáp án: ${details.matchedAnswer}`
      : 'Không khớp đáp án ngắn';
  }
  if (questionType === 'ESSAY') {
    return details.totalScore != null
      ? `Điểm AI tự luận: ${Number(details.totalScore).toFixed(1)}`
      : 'Đã chấm tự luận';
  }
  return 'Đã chấm';
};

const QuizCard = ({
  quiz,
  score,
  onSelect,
  isHistoryOpen,
  attempts,
  selectedAttemptId,
  attemptDetails,
  loadingAttempts,
  loadingAttemptDetails,
  onToggleHistory,
  onSelectAttempt,
}) => {
  const passScore = quiz.passScore || 70;
  const maxAttempts = Number(quiz.maxAttempts || 0);
  const maxAttemptsLabel = maxAttempts > 0 ? maxAttempts : 'Vô hạn';
  const studentScore = score?.totalScore;
  const hasAttemptScore = Number.isFinite(Number(studentScore));
  const displayScore = hasAttemptScore ? Number(studentScore) : null;
  const studentPassed = score?.isPassed;

  const getStatusIcon = () => {
    if (!hasAttemptScore) return '⭕';
    if (studentPassed) return '✅';
    return '❌';
  };

  const getStatusColor = () => {
    if (!hasAttemptScore) return 'not-attempted';
    if (studentPassed) return 'passed';
    return 'failed';
  };

  return (
    <div className={`quiz-card status-${getStatusColor()}`}>
      <div className="quiz-card__header">
        <h3 className="quiz-card__title">{quiz.title}</h3>
        <span className="quiz-card__status">{getStatusIcon()}</span>
      </div>

      {quiz.description && (
        <p className="quiz-card__description">{quiz.description}</p>
      )}

      <div className="quiz-card__info">
        <div className="info-item">
          <span className="info-label">⏱️ Thời gian:</span>
          <span className="info-value">{quiz.duration} phút</span>
        </div>

        <div className="info-item">
          <span className="info-label">📊 Câu hỏi:</span>
          <span className="info-value">{quiz.questions}</span>
        </div>

        <div className="info-item">
          <span className="info-label">✔️ Điểm đỗ:</span>
          <span className="info-value">{passScore}%</span>
        </div>

        <div className="info-item">
          <span className="info-label">🔄 Lần làm:</span>
          <span className="info-value">
            {score?.attemptNumber || 0}/{maxAttemptsLabel}
          </span>
        </div>
      </div>

      {hasAttemptScore && (
        <div className="quiz-card__score">
          <div className="score-display">
            <span className="score-value">{displayScore.toFixed(1)}%</span>
            <span className={`score-status ${studentPassed ? 'passed' : 'failed'}`}>
              {studentPassed ? 'Đã đạt' : 'Chưa đạt'}
            </span>
          </div>
        </div>
      )}

      {hasAttemptScore ? (
        <button onClick={onToggleHistory} className="btn btn--secondary btn--block" type="button">
          {isHistoryOpen ? 'Ẩn lần làm trước' : 'Xem lần làm trước'}
        </button>
      ) : null}

      {isHistoryOpen ? (
        <div className="quiz-attempt-history">
          <h4 className="quiz-attempt-history__title">Lịch sử lần làm</h4>

          {loadingAttempts ? <p className="quiz-attempt-history__loading">Đang tải danh sách lần làm...</p> : null}

          {!loadingAttempts && attempts.length === 0 ? (
            <p className="quiz-attempt-history__loading">Chưa có lần làm nào để xem lại.</p>
          ) : null}

          {!loadingAttempts && attempts.length > 0 ? (
            <div className="quiz-attempt-history__attempts">
              {attempts.map((attempt) => {
                const isActive = Number(selectedAttemptId) === Number(attempt.id);
                return (
                  <button
                    key={attempt.id}
                    type="button"
                    className={`attempt-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSelectAttempt(attempt.id)}
                  >
                    Lần {attempt.attemptNumber} - {Number(attempt.totalScore || 0).toFixed(1)}%
                  </button>
                );
              })}
            </div>
          ) : null}

          {selectedAttemptId && loadingAttemptDetails ? (
            <p className="quiz-attempt-history__loading">Đang tải chi tiết chấm điểm...</p>
          ) : null}

          {selectedAttemptId && !loadingAttemptDetails && Array.isArray(attemptDetails?.answers) ? (
            <div className="quiz-attempt-history__details">
              {attemptDetails.answers.map((answerItem, index) => {
                const questionType = answerItem?.question?.type || answerItem?.answerType || 'UNKNOWN';
                const answerScore = Number(answerItem?.score || 0);
                const hasPoint = answerScore > 0;
                return (
                  <article className="attempt-question" key={`${answerItem.questionId}-${index + 1}`}>
                    <div className="attempt-question__head">
                      <strong>Câu {index + 1}</strong>
                      <span className={`attempt-question__score ${hasPoint ? 'has-point' : 'no-point'}`}>
                        {answerScore.toFixed(1)} điểm
                      </span>
                    </div>
                    <p className="attempt-question__text">{answerItem?.question?.content || `Question ${answerItem.questionId}`}</p>
                    <p className="attempt-question__meta">Loại câu: {questionType}</p>
                    <p className="attempt-question__meta">Bài làm của bạn: {formatAnswerValue(answerItem.answerValue, questionType)}</p>
                    <p className="attempt-question__meta">Cách chấm: {getGradingSummary(answerItem.gradingDetails, questionType)}</p>
                    {answerItem.aiFeedback ? <p className="attempt-question__feedback">Phản hồi AI: {answerItem.aiFeedback}</p> : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <button onClick={onSelect} className="btn btn--primary btn--block">
        {!hasAttemptScore ? 'Bắt đầu làm' : 'Làm lại'}
      </button>
    </div>
  );
};

export default QuizList;
