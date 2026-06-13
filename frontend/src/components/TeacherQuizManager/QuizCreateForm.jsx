import React from 'react';
import SelectQuestionsModal from '../SelectQuestionsModal';

const QuizCreateForm = ({
  quizDraft,
  setQuizDraft,
  chapters,
  questions,
  editingQuizId,
  quizSelectedQuestionCount,
  quizRandomQuestionCount,
  quizQuestionTotal,
  selectQuizQuestionsModalOpen,
  setSelectQuizQuestionsModalOpen,
  selectedCourseId,
  truncateQuizText,
  handleCreateQuiz,
  resetQuizDraft
}) => {
  return (
    <>
      <SelectQuestionsModal
        isOpen={selectQuizQuestionsModalOpen}
        onClose={() => setSelectQuizQuestionsModalOpen(false)}
        filters={{
          courseId: selectedCourseId ? Number(selectedCourseId) : undefined,
          chapterId: quizDraft.chapterId ? Number(quizDraft.chapterId) : undefined,
        }}
        initial={quizDraft.questionIds}
        initialRandomCount={quizDraft.randomize ? quizDraft.randomCount : 0}
        onConfirm={(selection) => {
          setQuizDraft((prev) => ({
            ...prev,
            questionIds: Array.isArray(selection.questionIds) ? selection.questionIds : [],
            questionTitles: Array.isArray(selection.questionTitles) ? selection.questionTitles : [],
            randomize: Boolean(selection.randomize),
            randomCount: Number(selection.randomCount || 0),
          }));
        }}
      />

      <section className="instructor-question-bank-card highlighted">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h2 className="instructor-question-bank-card-title" style={{ marginBottom: 6 }}>
              {editingQuizId ? 'Sửa bài kiểm tra' : 'Thiết lập bài kiểm tra từ ngân hàng câu hỏi'}
            </h2>
            <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.5 }}>
              Cách tạo giống phần thêm bài tập trong bài học: giáo viên chọn câu hỏi cụ thể từ ngân hàng, có thể random thêm câu, sau đó xem lại đề trước khi xuất bản.
            </p>
          </div>

          <div style={{ padding: '8px 12px', borderRadius: 999, background: '#ede9fe', color: '#5b21b6', fontWeight: 800 }}>
            🧪 {quizQuestionTotal} câu
          </div>
        </div>

        <div className="instructor-question-bank-form-group" style={{ marginTop: 16 }}>
          <label className="instructor-question-bank-form-label" htmlFor="quiz-chapter">Chương</label>
          <select
            className="instructor-question-bank-form-control"
            id="quiz-chapter"
            value={quizDraft.chapterId || ''}
            onChange={(event) => setQuizDraft((prev) => ({
              ...prev,
              chapterId: event.target.value,
              questionIds: [],
              questionTitles: [],
              randomize: false,
              randomCount: 0,
            }))}
            disabled={Boolean(editingQuizId)}
          >
            <option value="">-- Chọn chương --</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </select>
        </div>

        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label" htmlFor="quiz-title">Tên bài kiểm tra</label>
          <input
            className="instructor-question-bank-form-control"
            id="quiz-title"
            value={quizDraft.title}
            onChange={(event) => setQuizDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Ví dụ: Kiểm tra chương 1"
          />
        </div>

        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label" htmlFor="quiz-description">Mô tả / hướng dẫn</label>
          <textarea
            className="instructor-question-bank-form-control"
            id="quiz-description"
            value={quizDraft.description}
            onChange={(event) => setQuizDraft((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Ví dụ: Làm bài trong 45 phút, không sử dụng tài liệu."
            rows={3}
          />
        </div>

        <div className="instructor-question-bank-options-list" style={{ gap: '12px' }}>
          <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
            <label className="instructor-question-bank-form-label" htmlFor="quiz-duration">Thời gian làm bài</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-duration"
                type="number"
                min="1"
                value={quizDraft.duration}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, duration: event.target.value }))}
              />
              <span style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>phút</span>
            </div>
          </div>

          <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
            <label className="instructor-question-bank-form-label" htmlFor="quiz-pass-score">Điểm đạt</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-pass-score"
                type="number"
                min="0"
                max="100"
                value={quizDraft.passScore}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, passScore: event.target.value }))}
              />
              <span style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>%</span>
            </div>
          </div>

          <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
            <label className="instructor-question-bank-form-label" htmlFor="quiz-max-attempts">Số lần làm</label>
            <input
              className="instructor-question-bank-form-control"
              id="quiz-max-attempts"
              type="number"
              min="0"
              value={quizDraft.maxAttempts}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, maxAttempts: event.target.value }))}
              placeholder="0 = vô hạn"
            />
          </div>
        </div>

        {!editingQuizId ? (
          <div style={{ marginTop: 16, padding: 16, background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#4c1d95' }}>Ngân hàng câu hỏi</div>
                <div style={{ marginTop: 4, color: '#5b21b6', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong>
                    {quizSelectedQuestionCount > 0
                      ? `${quizSelectedQuestionCount} câu đã chọn`
                      : 'Chưa chọn câu nào'}
                  </strong>
                  {quizRandomQuestionCount > 0 ? (
                    <span style={{ color: '#7c3aed' }}>
                      Random thêm {quizRandomQuestionCount} câu
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                className="instructor-question-bank-btn instructor-question-bank-btn-success"
                onClick={() => {
                  if (!quizDraft.chapterId) {
                    alert('Vui lòng chọn chương trước khi chọn câu hỏi.');
                    return;
                  }
                  setSelectQuizQuestionsModalOpen(true);
                }}
                style={{ background: '#7c3aed' }}
              >
                📚 Chọn từ Ngân hàng Câu hỏi
              </button>
            </div>

            {quizRandomQuestionCount > quizSelectedQuestionCount && quizSelectedQuestionCount > 0 ? (
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', fontSize: 13, fontWeight: 600 }}>
                Số câu random đang lớn hơn số câu đã chọn. Hãy cân nhắc giảm số random hoặc chọn thêm câu để đề kiểm tra cân bằng hơn.
              </div>
            ) : null}

            {Array.isArray(quizDraft.questionTitles) && quizDraft.questionTitles.length ? (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: '#111827' }}>Câu hỏi đã chọn</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {quizDraft.questionTitles.map((questionTitle, questionIndex) => (
                    <span
                      key={`${questionTitle}-${questionIndex}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: '#ede9fe',
                        color: '#5b21b6',
                        fontWeight: 700,
                        fontSize: 13,
                        maxWidth: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      {questionIndex + 1}. {truncateQuizText(questionTitle, 80)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {quizRandomQuestionCount > 0 ? (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: '#6b21a8' }}>Câu hỏi random thêm</div>
                <div style={{ color: '#7c3aed', fontWeight: 700 }}>
                  Sẽ lấy ngẫu nhiên {quizRandomQuestionCount} câu công khai trong chương đã chọn, không trùng với các câu đã chọn thủ công.
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p style={{ marginTop: 12, color: '#6b7280' }}>
            Khi sửa bài kiểm tra, chỉ cập nhật thông tin chung. Muốn thay câu hỏi thì dùng phần xem lại câu hỏi bên dưới.
          </p>
        )}

        <div className="instructor-question-bank-actions" style={{ marginTop: 16 }}>
          <button className="instructor-question-bank-btn instructor-question-bank-btn-success" onClick={handleCreateQuiz} type="button">
            {editingQuizId ? 'Lưu bài kiểm tra' : '💾 Lưu bài kiểm tra'}
          </button>
          <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={resetQuizDraft} type="button">
            Làm mới
          </button>
        </div>
      </section>
    </>
  );
};

export default QuizCreateForm;
