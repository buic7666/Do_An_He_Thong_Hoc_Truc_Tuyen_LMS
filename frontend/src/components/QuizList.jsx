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
  lessonId = null,
  scope = 'all',
  onSelectQuiz,
  emptyMessage = 'Khóa học này chưa có bài kiểm tra nào',
}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, [courseId, lessonId, scope]);

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
        filteredQuizzes = allQuizzes.filter((quiz) => !quiz.lessonId);
      } else if (lessonId) {
        filteredQuizzes = allQuizzes.filter((quiz) => Number(quiz.lessonId) === Number(lessonId) || !quiz.lessonId);
      }

      setQuizzes(filteredQuizzes);

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
const QuizCard = ({ quiz, score, onSelect }) => {
  const passScore = quiz.passScore || 70;
  const maxAttempts = quiz.maxAttempts || 3;
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
            {score?.attemptNumber || 0}/{maxAttempts}
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

      <button onClick={onSelect} className="btn btn--primary btn--block">
        {!hasAttemptScore ? 'Bắt đầu làm' : 'Làm lại'}
      </button>
    </div>
  );
};

export default QuizList;
