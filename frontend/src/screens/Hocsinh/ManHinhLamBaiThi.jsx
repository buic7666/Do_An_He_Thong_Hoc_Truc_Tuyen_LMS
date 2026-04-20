import { useEffect, useMemo, useState } from 'react';
import './ManHinhLamBaiThi.css';

const TOTAL_QUESTIONS = 40;
const VISIBLE_QUESTIONS = 20;

const questionTemplate = {
  content:
    'Trong Flutter, widget nào được sử dụng để tạo một danh sách cuộn (scrollable list) tối ưu bộ nhớ cho số lượng lớn các phần tử (như danh sách phòng trọ, danh sách người dùng)?',
  options: [
    { value: 'A', text: 'A. Column kết hợp với SingleChildScrollView' },
    { value: 'B', text: 'B. ListView thông thường' },
    { value: 'C', text: 'C. ListView.builder' },
    { value: 'D', text: 'D. GridView.count' },
  ],
};

const initialAnswers = {
  1: 'A',
  2: 'C',
  3: 'B',
  4: 'A',
  5: 'D',
  6: 'B',
  7: 'C',
  9: 'A',
  10: 'D',
  11: 'B',
  12: 'C',
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function ManHinhLamBaiThi() {
  const [currentQuestion, setCurrentQuestion] = useState(12);
  const [timeLeft, setTimeLeft] = useState(44 * 60 + 59);
  const [answers, setAnswers] = useState(initialAnswers);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const handleSelectAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }));
  };

  const currentAnswer = answers[currentQuestion] || '';

  return (
    <div className='exam-page'>
      <header className='exam-header'>
        <h1 className='exam-title'>Kiểm tra Cuối kỳ - Lập trình Di động (Flutter)</h1>

        <div className='exam-timer-container'>
          <span className='exam-timer-icon'>⏱️</span>
          <span className='exam-timer-text'>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <main className='exam-layout'>
        <section className='exam-question-section'>
          <div className='exam-question-header'>
            <p className='exam-question-number'>
              Câu hỏi {currentQuestion} / {TOTAL_QUESTIONS}
            </p>
            <p className='exam-question-content'>{questionTemplate.content}</p>
          </div>

          <div className='exam-options-list'>
            {questionTemplate.options.map((option) => (
              <label key={option.value} className='exam-option-label'>
                <input
                  type='radio'
                  name={`q${currentQuestion}`}
                  value={option.value}
                  checked={currentAnswer === option.value}
                  className='exam-option-input'
                  onChange={() => handleSelectAnswer(option.value)}
                />
                <span className='exam-option-text'>{option.text}</span>
              </label>
            ))}
          </div>
        </section>

        <aside className='exam-navigation-section'>
          <h2 className='exam-nav-title'>Danh sách câu hỏi</h2>

          <div className='exam-nav-grid'>
            {Array.from({ length: VISIBLE_QUESTIONS }, (_, index) => {
              const questionNumber = index + 1;
              const isAnswered = Boolean(answers[questionNumber]);
              const isCurrent = currentQuestion === questionNumber;

              return (
                <button
                  key={questionNumber}
                  type='button'
                  className={`exam-nav-btn ${isAnswered ? 'is-answered' : ''} ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => setCurrentQuestion(questionNumber)}
                >
                  {questionNumber}
                </button>
              );
            })}
          </div>

          <div className='exam-stats'>
            <div className='exam-stat-item'>
              <span className='exam-color-box is-answered' />
              <span>Đã trả lời: {answeredCount}</span>
            </div>

            <div className='exam-stat-item'>
              <span className='exam-color-box is-unanswered' />
              <span>Chưa trả lời: {TOTAL_QUESTIONS - answeredCount}</span>
            </div>
          </div>
        </aside>
      </main>

      <footer className='exam-footer'>
        <div className='exam-btn-group'>
          <button
            type='button'
            className='exam-btn exam-btn-outline'
            onClick={() => setCurrentQuestion((prev) => Math.max(1, prev - 1))}
          >
            ⬅ Câu trước
          </button>

          <button
            type='button'
            className='exam-btn exam-btn-outline'
            onClick={() => setCurrentQuestion((prev) => Math.min(VISIBLE_QUESTIONS, prev + 1))}
          >
            Câu sau ➡
          </button>
        </div>

        <button type='button' className='exam-btn exam-btn-submit'>
          Nộp bài ngay
        </button>
      </footer>
    </div>
  );
}

export default ManHinhLamBaiThi;
