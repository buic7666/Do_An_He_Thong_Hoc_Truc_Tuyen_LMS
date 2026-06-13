import { useMemo, useState } from 'react';

function QuizAssignmentStyleForm({
  quizDraft,
  setQuizDraft,
  chapters,
  questions,
  selectedQuestionIds,
  setSelectedQuestionIds,
  onSubmit,
  editingQuizId,
  getQuestionTextForQuiz,
  truncateQuizText,
  questionTypeLabels,
}) {
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  const selectedQuestions = useMemo(() => {
    const selectedSet = new Set(selectedQuestionIds.map((id) => Number(id)));

    return questions.filter((question) => selectedSet.has(Number(question.id)));
  }, [questions, selectedQuestionIds]);

  const selectableQuestions = useMemo(() => {
    const chapterId = quizDraft.chapterId;
    const keyword = questionSearch.trim().toLowerCase();

    return questions.filter((question) => {
      if (!question.isPublished) {
        return false;
      }

      if (chapterId && Number(question.chapterId) !== Number(chapterId)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = getQuestionTextForQuiz(question).toLowerCase();
      const type = String(question.type || '').toLowerCase();

      return text.includes(keyword) || type.includes(keyword);
    });
  }, [questions, quizDraft.chapterId, questionSearch, getQuestionTextForQuiz]);

  const toggleQuestionSelection = (questionId) => {
    const id = Number(questionId);

    setSelectedQuestionIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  };

  return (
    <section className="instructor-question-bank-card highlighted">
      <div className="instructor-question-bank-list-header">
        <div>
          <h2 className="instructor-question-bank-card-title">
            {editingQuizId ? 'Sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
          </h2>

          <p style={{ margin: 0, color: '#6b7280' }}>
            Chọn câu hỏi trực tiếp từ ngân hàng, giống cách thêm bài tập trong phần học.
          </p>
        </div>
      </div>

      <div className="instructor-question-bank-form-grid">
        <label className="instructor-question-bank-form-group">
          <span className="instructor-question-bank-form-label">Chương</span>
          <select
            className="instructor-question-bank-form-control"
            value={quizDraft.chapterId}
            onChange={(event) => {
              setQuizDraft((prev) => ({
                ...prev,
                chapterId: event.target.value,
              }));
              setSelectedQuestionIds([]);
            }}
          >
            <option value="">-- Chọn chương --</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.title}
              </option>
            ))}
          </select>
        </label>

        <label className="instructor-question-bank-form-group">
          <span className="instructor-question-bank-form-label">Tên bài kiểm tra</span>
          <input
            className="instructor-question-bank-form-control"
            value={quizDraft.title}
            onChange={(event) => setQuizDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Ví dụ: Bài kiểm tra chương 1"
          />
        </label>

        <label className="instructor-question-bank-form-group">
          <span className="instructor-question-bank-form-label">Thời lượng làm bài, phút</span>
          <input
            className="instructor-question-bank-form-control"
            type="number"
            min="1"
            value={quizDraft.duration}
            onChange={(event) => setQuizDraft((prev) => ({ ...prev, duration: event.target.value }))}
          />
        </label>

        <label className="instructor-question-bank-form-group">
          <span className="instructor-question-bank-form-label">Điểm đạt, %</span>
          <input
            className="instructor-question-bank-form-control"
            type="number"
            min="0"
            max="100"
            value={quizDraft.passScore}
            onChange={(event) => setQuizDraft((prev) => ({ ...prev, passScore: event.target.value }))}
          />
        </label>

        <label className="instructor-question-bank-form-group">
          <span className="instructor-question-bank-form-label">Số lần làm tối đa</span>
          <input
            className="instructor-question-bank-form-control"
            type="number"
            min="0"
            value={quizDraft.maxAttempts}
            onChange={(event) => setQuizDraft((prev) => ({ ...prev, maxAttempts: event.target.value }))}
          />
          <small style={{ color: '#6b7280' }}>
            Nhập 0 nếu cho phép làm không giới hạn.
          </small>
        </label>
      </div>

      <label className="instructor-question-bank-form-group">
        <span className="instructor-question-bank-form-label">Mô tả</span>
        <textarea
          className="instructor-question-bank-form-control"
          rows={4}
          value={quizDraft.description}
          onChange={(event) => setQuizDraft((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Nhập mô tả hoặc hướng dẫn làm bài cho học viên"
        />
      </label>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Câu hỏi trong bài kiểm tra</h3>
            <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
              Đã chọn {selectedQuestions.length} câu hỏi.
            </p>
          </div>

          <button
            className="instructor-question-bank-btn instructor-question-bank-btn-primary"
            type="button"
            onClick={() => setShowQuestionPicker((prev) => !prev)}
          >
            {showQuestionPicker ? 'Ẩn ngân hàng câu hỏi' : 'Chọn từ Ngân hàng Câu hỏi'}
          </button>
        </div>

        {showQuestionPicker ? (
          <div style={{ marginTop: 16 }}>
            <input
              className="instructor-question-bank-form-control"
              value={questionSearch}
              onChange={(event) => setQuestionSearch(event.target.value)}
              placeholder="Tìm câu hỏi theo nội dung..."
            />

            <div className="instructor-question-bank-question-list" style={{ marginTop: 12 }}>
              {selectableQuestions.map((question) => {
                const type = String(question.type || 'MULTIPLE_CHOICE').toUpperCase();
                const text = getQuestionTextForQuiz(question);
                const isSelected = selectedQuestionIds.includes(Number(question.id));

                return (
                  <article className="instructor-question-bank-q-item" key={`picker-${question.id}`}>
                    <div className="instructor-question-bank-q-content">
                      <h4>{truncateQuizText(text || 'Câu hỏi chưa có nội dung', 160)}</h4>

                      <span className="instructor-question-bank-q-correct">
                        Loại: {questionTypeLabels[type] || type} · 
                        Chương: {chapters.find((chapter) => Number(chapter.id) === Number(question.chapterId))?.title || '—'}
                      </span>
                    </div>

                    <div className="instructor-question-bank-q-actions">
                      <button
                        className={`instructor-question-bank-btn-icon ${isSelected ? 'delete' : 'edit'}`}
                        type="button"
                        onClick={() => toggleQuestionSelection(question.id)}
                      >
                        {isSelected ? 'Bỏ chọn' : 'Chọn câu này'}
                      </button>
                    </div>
                  </article>
                );
              })}

              {!selectableQuestions.length ? (
                <p style={{ color: '#6b7280' }}>
                  Không có câu hỏi phù hợp. Hãy chọn chương khác hoặc kiểm tra lại ngân hàng câu hỏi.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 10 }}>Danh sách câu hỏi đã chọn</h4>

          {selectedQuestions.length ? (
            <div className="instructor-question-bank-question-list">
              {selectedQuestions.map((question, index) => {
                const type = String(question.type || 'MULTIPLE_CHOICE').toUpperCase();
                const text = getQuestionTextForQuiz(question);

                return (
                  <article className="instructor-question-bank-q-item" key={`selected-${question.id}`}>
                    <div className="instructor-question-bank-q-content">
                      <h4>
                        {index + 1}. {truncateQuizText(text || 'Câu hỏi chưa có nội dung', 160)}
                      </h4>

                      <span className="instructor-question-bank-q-correct">
                        Loại: {questionTypeLabels[type] || type}
                      </span>
                    </div>

                    <div className="instructor-question-bank-q-actions">
                      <button
                        className="instructor-question-bank-btn-icon delete"
                        type="button"
                        onClick={() => toggleQuestionSelection(question.id)}
                      >
                        Xóa khỏi bài kiểm tra
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>
              Chưa chọn câu hỏi nào. Bấm “Chọn từ Ngân hàng Câu hỏi” để thêm câu hỏi vào bài kiểm tra.
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button
          className="instructor-question-bank-btn instructor-question-bank-btn-success"
          type="button"
          onClick={onSubmit}
        >
          {editingQuizId ? 'Lưu bài kiểm tra' : 'Lưu bài kiểm tra'}
        </button>
      </div>
    </section>
  );
}

export default QuizAssignmentStyleForm;