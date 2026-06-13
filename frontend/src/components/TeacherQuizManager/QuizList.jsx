import React from 'react';

const QuizList = ({
  isLoadingQuizzes,
  visibleQuizzes,
  getQuizChapterTitle,
  formatQuizDate,
  loadQuizDetail,
  handleStartEditQuiz,
  handlePublishQuiz,
  handleDeleteQuiz
}) => {
  return (
    <section className="instructor-question-bank-card">
      <h2 className="instructor-question-bank-card-title">Danh sách bài kiểm tra của tôi</h2>

      {isLoadingQuizzes ? <p>Đang tải danh sách bài kiểm tra...</p> : null}

      <div className="instructor-question-bank-question-list">
        {visibleQuizzes.map((quiz) => (
          <article className="instructor-question-bank-q-item" key={quiz.id}>
            <div className="instructor-question-bank-q-content">
              <h4>{quiz.title}</h4>

              <span className="instructor-question-bank-q-correct">
                Khóa học: {quiz.course?.title || quiz.courseTitle || 'N/A'} ·{' '}
                Chương: {getQuizChapterTitle(quiz)} ·{' '}
                Trạng thái: {quiz.isPublished ? 'Đã xuất bản' : 'Nháp'}
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 8,
                  marginTop: 10,
                  color: '#475569',
                  fontSize: 14,
                }}
              >
                <span>
                  Số câu: <strong>{quiz.questionCount ?? quiz.questions?.length ?? 0}</strong>
                </span>

                <span>
                  Thời gian: <strong>{quiz.duration || 0} phút</strong>
                </span>

                <span>
                  Điểm đạt: <strong>{quiz.passScore || 0}%</strong>
                </span>

                <span>
                  Số lần làm tối đa:{' '}
                  <strong>{Number(quiz.maxAttempts || 0) === 0 ? 'Vô hạn' : quiz.maxAttempts}</strong>
                </span>

                <span>
                  Ngày tạo: <strong>{formatQuizDate(quiz.createdAt)}</strong>
                </span>
              </div>
            </div>

            <div className="instructor-question-bank-q-actions">
              <button
                className="instructor-question-bank-btn-icon view"
                onClick={() => loadQuizDetail(quiz.id)}
                title="Xem chi tiết"
                type="button"
              >
                Xem chi tiết
              </button>

              <button
                className="instructor-question-bank-btn-icon view"
                onClick={() => loadQuizDetail(quiz.id)}
                title="Xem trước"
                type="button"
              >
                Xem trước
              </button>

              {!quiz.isPublished ? (
                <button
                  className="instructor-question-bank-btn-icon edit"
                  onClick={() => handleStartEditQuiz(quiz)}
                  title="Sửa"
                  type="button"
                >
                  Sửa
                </button>
              ) : null}

              {!quiz.isPublished ? (
                <button
                  className="instructor-question-bank-btn-icon edit"
                  onClick={() => handlePublishQuiz(quiz.id)}
                  title="Xuất bản"
                  type="button"
                >
                  Xuất bản
                </button>
              ) : null}

              <button
                className="instructor-question-bank-btn-icon delete"
                onClick={() => handleDeleteQuiz(quiz.id)}
                title="Xóa"
                type="button"
              >
                Xóa
              </button>
            </div>
          </article>
        ))}

        {!visibleQuizzes.length && !isLoadingQuizzes ? (
          <p>Chưa có bài kiểm tra nào trong khóa học này.</p>
        ) : null}
      </div>
    </section>
  );
};

export default QuizList;
