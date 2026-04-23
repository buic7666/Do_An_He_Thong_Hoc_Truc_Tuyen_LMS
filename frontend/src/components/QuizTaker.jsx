import React, { useState, useEffect, useRef, useCallback } from 'react';
import httpClient from '../api/httpClient';
import './QuizTaker.css';

/**
 * QuizTaker Component
 * Allows students to take quizzes and track their progress
 * Features:
 * - Auto-save answers every 30 seconds
 * - Timer countdown
 * - Question navigation
 * - Score tracking
 * - Pass/fail status
 */

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

  const autoSaveIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Load quiz details
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const response = await httpClient.get(`/quizzes/${quizId}`);
        const payload = response?.data?.data || {};
        const normalizedQuestions = Array.isArray(payload.questions) ? payload.questions : [];

        setQuiz({
          ...payload,
          questions: normalizedQuestions,
        });
        setTimeLeft(Number(payload.duration || 0) * 60); // Convert to seconds

        // Start quiz attempt
        const attemptResponse = await httpClient.post(`/quizzes/${quizId}/start`);
        setAttemptId(attemptResponse.data.data.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  // Auto-save answers
  useEffect(() => {
    if (!attemptId || isSubmitted) return;

    autoSaveIntervalRef.current = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveAnswers();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [attemptId, answers, isSubmitted]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitted) return;

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
  }, [timeLeft, isSubmitted]);

  // Save answers before leaving
  useEffect(() => {
    return () => {
      if (!isSubmitted && Object.keys(answers).length > 0) {
        saveAnswers();
      }
    };
  }, []);

  const saveAnswers = useCallback(async () => {
    if (!attemptId || isSubmitted) return;

    setIsSaving(true);
    try {
      for (const [questionId, selectedIndex] of Object.entries(answers)) {
        await httpClient.post(`/quizzes/${quizId}/save-answer`, {
          questionId: Number(questionId),
          selectedIndex: Number(selectedIndex),
        });
      }
    } catch (err) {
      console.error('Failed to save answers:', err);
    } finally {
      setIsSaving(false);
    }
  }, [quizId, attemptId, answers, isSubmitted]);

  const handleSelectAnswer = (questionId, selectedIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    try {
      const response = await httpClient.post(`/quizzes/${quizId}/submit`, {
        answers,
      });

      setIsSubmitted(true);
      setResult(response.data.data);

      if (onSubmit) {
        onSubmit(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        <h3>❌ Lỗi</h3>
        <p>{error}</p>
        <button onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  if (!quiz) {
    return <div className="quiz-taker">Loading...</div>;
  }

  if (isSubmitted && result) {
    return <QuizResult quiz={quiz} result={result} onBack={onBack} />;
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const questionCount = questions.length;

  if (questionCount === 0) {
    return (
      <div className="quiz-taker quiz-taker--error">
        <h3>📚 Bài kiểm tra chưa có câu hỏi</h3>
        <p>Giảng viên chưa cấu hình câu hỏi cho bài kiểm tra này.</p>
        <button onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  const safeQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, questionCount - 1));
  const currentQuestion = questions[safeQuestionIndex] || null;
  const questionOptions = Array.isArray(currentQuestion?.options) ? currentQuestion.options : [];
  const progressPercent = ((safeQuestionIndex + 1) / questionCount) * 100;
  const isTimeWarning = timeLeft && timeLeft < 60;
  const isTimeDanger = timeLeft && timeLeft < 10;

  return (
    <div className="quiz-taker">
      {/* Header */}
      <div className="quiz-taker__header">
        <div className="quiz-taker__title">
          <h2>{quiz.title}</h2>
        </div>
        <div className={`quiz-taker__timer ${isTimeDanger ? 'danger' : isTimeWarning ? 'warning' : ''}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-taker__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="progress-text">
          Câu {safeQuestionIndex + 1}/{questionCount}
        </p>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="quiz-taker__question">
          <h3 className="question-text">{currentQuestion.questionText}</h3>

          {/* Options */}
          <div className="question-options">
            {questionOptions.map((option, index) => (
              <label key={index} className="option">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={answers[currentQuestion.id] === index}
                  onChange={() => handleSelectAnswer(currentQuestion.id, index)}
                  disabled={isSubmitted}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="quiz-taker__navigation">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0 || isSubmitted}
          className="btn btn--secondary"
        >
          ← Câu trước
        </button>

        {/* Question selector */}
        <div className="question-selector">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`question-btn ${index === safeQuestionIndex ? 'active' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
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
          Câu sau →
        </button>
      </div>

      {/* Submit Button */}
      <div className="quiz-taker__footer">
        {isSaving && <span className="saving-status">💾 Đang lưu...</span>}
        <button onClick={handleSubmit} disabled={isSubmitted} className="btn btn--primary btn--large">
          Nộp bài ({Object.keys(answers).length}/{questionCount} câu)
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
  const scorePercent = Number(result.totalScore || 0);
  const isPassed = result.isPassed;
  const questionCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;

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
      </div>

      <button onClick={onBack} className="btn btn--primary btn--large">
        Quay lại
      </button>
    </div>
  );
};

export default QuizTaker;
