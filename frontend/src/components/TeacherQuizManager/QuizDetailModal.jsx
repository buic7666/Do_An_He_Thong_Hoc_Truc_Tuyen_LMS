import React from 'react';

const QuizDetailModal = ({
  selectedQuizDetail,
  setSelectedQuizDetail,
  getQuizChapterTitle,
  quizAddQuestionId,
  setQuizAddQuestionId,
  availableQuestionsForQuiz,
  getQuestionTextForQuiz,
  truncateQuizText,
  handleAddQuestionToQuiz,
  isLoadingQuizDetail,
  handleRemoveQuestionFromQuiz,
  QUESTION_TYPE_LABELS
}) => {
  if (!selectedQuizDetail) return null;

  return (
    <section className="instructor-question-bank-card highlighted">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h2 className="instructor-question-bank-card-title">
            Xem lại câu hỏi: {selectedQuizDetail.title}
          </h2>

          <p style={{ margin: 0, color: '#6b7280' }}>
            Chương: {getQuizChapterTitle(selectedQuizDetail)} ·{' '}
            Số câu: {(selectedQuizDetail.questions || []).length} ·{' '}
            Thời gian: {selectedQuizDetail.duration || 0} phút ·{' '}
            Điểm đạt: {selectedQuizDetail.passScore || 0}% ·{' '}
            Trạng thái: {selectedQuizDetail.isPublished ? 'Đã xuất bản' : 'Nháp'}
          </p>
        </div>

        <button
          className="instructor-question-bank-btn instructor-question-bank-btn-primary"
          type="button"
          onClick={() => setSelectedQuizDetail(null)}
        >
          Đóng
        </button>
      </div>

      <div className="instructor-question-bank-form-group" style={{ marginTop: 16 }}>
        <label className="instructor-question-bank-form-label">
          Thêm câu hỏi từ ngân hàng
        </label>

        <div className="instructor-question-bank-options-list" style={{ gap: 8 }}>
          <select
            className="instructor-question-bank-form-control"
            value={quizAddQuestionId}
            onChange={(event) => setQuizAddQuestionId(event.target.value)}
          >
            <option value="">-- Chọn câu hỏi cần thêm --</option>

            {availableQuestionsForQuiz.map((question) => {
              const type = String(question.type || 'MULTIPLE_CHOICE').toUpperCase();
              const text = getQuestionTextForQuiz(question);

              return (
                <option key={question.id} value={question.id}>
                  [{QUESTION_TYPE_LABELS[type] || type}] {truncateQuizText(text, 90)}
                </option>
              );
            })}
          </select>

          <button
            className="instructor-question-bank-btn instructor-question-bank-btn-success"
            type="button"
            onClick={handleAddQuestionToQuiz}
          >
            Thêm câu
          </button>
        </div>

        {selectedQuizDetail.isPublished ? (
          <p style={{ color: '#6b7280', marginTop: 8 }}>
            Bài kiểm tra đã xuất bản. Nếu thêm hoặc xóa câu hỏi, hệ thống sẽ chuyển bài kiểm tra về Nháp để bạn kiểm tra lại trước khi xuất bản.
          </p>
        ) : null}

        {!availableQuestionsForQuiz.length ? (
          <p style={{ color: '#6b7280', marginTop: 8 }}>
            Không có câu hỏi nào khác trong cùng khóa học/chương để thêm.
          </p>
        ) : null}
      </div>

      {isLoadingQuizDetail ? (
        <p>Đang tải chi tiết bài kiểm tra...</p>
      ) : null}

      <div className="instructor-question-bank-question-list" style={{ marginTop: 16 }}>
        {(selectedQuizDetail.questions || []).map((question, index) => {
          const type = String(question.type || 'MULTIPLE_CHOICE').toUpperCase();
          const text = getQuestionTextForQuiz(question);

          return (
            <article className="instructor-question-bank-q-item" key={question.id}>
              <div className="instructor-question-bank-q-content">
                <h4>
                  {index + 1}. {truncateQuizText(text || 'Câu hỏi chưa có nội dung', 160)}
                </h4>

                <span className="instructor-question-bank-q-correct">
                  Loại: {QUESTION_TYPE_LABELS[type] || type} ·{' '}
                  Điểm: {question.QuizQuestion?.points || question.quizQuestion?.points || 1}
                </span>
              </div>

              <div className="instructor-question-bank-q-actions">
                <button
                  className="instructor-question-bank-btn-icon delete"
                  type="button"
                  onClick={() => handleRemoveQuestionFromQuiz(selectedQuizDetail.id, question.id)}
                >
                  Xóa khỏi bài kiểm tra
                </button>
              </div>
            </article>
          );
        })}

        {!(selectedQuizDetail.questions || []).length ? (
          <p>Chưa có câu hỏi nào trong bài kiểm tra.</p>
        ) : null}
      </div>

      <p style={{ marginTop: 12, color: '#6b7280' }}>
        Muốn thay câu hỏi: xóa câu hiện tại khỏi bài kiểm tra, sau đó chọn câu khác từ ngân hàng và bấm “Thêm câu”.
      </p>
    </section>
  );
};

export default QuizDetailModal;
