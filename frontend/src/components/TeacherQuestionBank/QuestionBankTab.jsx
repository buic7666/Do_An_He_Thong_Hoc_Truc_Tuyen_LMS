import React from 'react';
import QuestionFormModal from '../QuestionFormModal';
import RichContentRenderer from '../RichContentRenderer';
import QuestionDetailPanel from './QuestionDetailPanel';

const QuestionBankTab = ({
  questions,
  filteredQuestions,
  courses,
  chapters,
  lessons,
  segments,
  selectedChapterId,
  selectedLessonId,
  selectedSegmentId,
  selectedTypeFilter,
  loading,
  error,
  setSelectedChapterId,
  setSelectedLessonId,
  setSelectedSegmentId,
  setSelectedTypeFilter,
  startEditQuestion,
  deleteQuestion,
  addOrUpdateQuestion,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  questionCount,
  publishedCount,
  typeSummary,
  draft,
  setDraft,
  isModalOpen,
  setIsModalOpen,
  editingId,
  setEditingId,
  createEmptyDraft,
  renderTypeSpecificForm,
  expandedQuestionId,
  setExpandedQuestionId,
  parseJson,
  normalizeQuestionPreviewBlocks,
  resetDraft
}) => {
  return (
    <>
      {error ? (
        <section className="instructor-question-bank-card" style={{ color: 'red' }}>
          <p>Lỗi: {error}</p>
        </section>
      ) : null}

      <QuestionFormModal
        key={editingId ? `edit-${editingId}` : 'create-question'}
        isOpen={isModalOpen}
        draft={draft}
        onDraftChange={setDraft}
        onConfirm={addOrUpdateQuestion}
        onCancel={resetDraft}
        renderTypeSpecificForm={renderTypeSpecificForm}
        mode={editingId ? 'edit' : 'create'}
      />

      <section className="instructor-question-bank-card">
        <div className="instructor-question-bank-list-header">
          <div>
            <h2 className="instructor-question-bank-card-title">Danh sách câu hỏi ({filteredQuestions.length}/{questionCount})</h2>
          </div>
          <button
            className="instructor-question-bank-btn instructor-question-bank-btn-success"
            type="button"
            onClick={() => {
              setEditingId(null);
              setDraft(createEmptyDraft());
              setIsModalOpen(true);
            }}
          >
            Thêm Câu hỏi mới
          </button>
        </div>

        <div className="instructor-question-bank-stats-grid">
          <article className="instructor-question-bank-stat-card primary"><strong>{questionCount}</strong><span>Tổng câu hỏi</span></article>
          <article className="instructor-question-bank-stat-card success"><strong>{publishedCount}</strong><span>Đã xuất bản</span></article>
          <article className="instructor-question-bank-stat-card neutral"><strong>{Object.keys(typeSummary).length}</strong><span>Loại câu hỏi</span></article>
        </div>

        <div className="instructor-question-bank-filter-panel">
          <div className="instructor-question-bank-filter-grid">
            <label className="instructor-question-bank-form-group no-margin">
              <span className="instructor-question-bank-form-label">Chương</span>
              <select className="instructor-question-bank-form-control" value={selectedChapterId} onChange={(event) => setSelectedChapterId(event.target.value)}>
                <option value="">Tất cả chương</option>
                {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
              </select>
            </label>
            <label className="instructor-question-bank-form-group no-margin">
              <span className="instructor-question-bank-form-label">Bài giảng</span>
              <select className="instructor-question-bank-form-control" value={selectedLessonId} onChange={(event) => setSelectedLessonId(event.target.value)} disabled={!lessons.length}>
                <option value="">Tất cả bài giảng</option>
                {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
              </select>
            </label>
            <label className="instructor-question-bank-form-group no-margin">
              <span className="instructor-question-bank-form-label">Phần bài giảng</span>
              <select className="instructor-question-bank-form-control" value={selectedSegmentId} onChange={(event) => setSelectedSegmentId(event.target.value)} disabled={!segments.length}>
                <option value="">Tất cả phần</option>
                {segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.title}</option>)}
              </select>
            </label>
            <label className="instructor-question-bank-form-group no-margin">
              <span className="instructor-question-bank-form-label">Loại câu hỏi</span>
              <select className="instructor-question-bank-form-control" value={selectedTypeFilter} onChange={(event) => setSelectedTypeFilter(event.target.value)}>
                <option value="">Tất cả loại</option>
                {QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? <p>Đang tải dữ liệu từ CSDL...</p> : null}

        <div className="instructor-question-bank-question-list">
          {filteredQuestions.map((question, index) => {
            const metadata = parseJson(question.metadata, {});
            const type = question.type || 'MULTIPLE_CHOICE';
            let answerPreview = 'Chưa thiết lập';

            if (type === 'MULTIPLE_CHOICE') {
              answerPreview = `Đáp án đúng: ` + (metadata.correctIndices || []).map((item) => String.fromCharCode(65 + Number(item))).join(', ');
            } else if (type === 'TRUE_FALSE') {
              answerPreview = `Đáp án đúng: ` + (metadata.correctAnswer ? 'Đúng' : 'Sai');
            } else if (type === 'SHORT_ANSWER') {
              answerPreview = `Chấp nhận: ` + (metadata.acceptedAnswers || []).join(' | ');
            } else if (type === 'ESSAY') {
              answerPreview = `Mục đánh giá: ` + (metadata.rubric || []).length;
            }

            const previewBlocks = normalizeQuestionPreviewBlocks(question);

            return (
              <article className="question-bank-card-item" key={question.id}>
                <div className="question-bank-card-head">
                  <div className="instructor-question-bank-q-content">
                    <div className="question-bank-card-title-row">
                      <span className="question-bank-type-badge">{QUESTION_TYPE_LABELS[type]}</span>
                      <h4>{index + 1}. {question.content || question.questionText || 'Không có nội dung'}</h4>
                    </div>
                    {previewBlocks.length ? (
                      <div style={{ marginTop: 8, maxWidth: '100%' }}>
                        <RichContentRenderer blocks={previewBlocks} />
                      </div>
                    ) : null}
                    <p className="question-bank-card-preview">{answerPreview}</p>
                    <p className="question-bank-card-preview secondary">Khóa học: {courses.find((course) => String(course.id) === String(question.courseId))?.title || '—'} · Chương: {chapters.find((chapter) => String(chapter.id) === String(question.chapterId))?.title || '—'}</p>
                  </div>

                  <div className="question-bank-card-actions">
                    <button
                      className="btn-prev-item"
                      type="button"
                      onClick={() => setExpandedQuestionId((prev) => (prev === question.id ? null : question.id))}
                    >
                      {expandedQuestionId === question.id ? 'Thu gọn' : 'Xem chi tiết'}
                    </button>
                    <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={() => startEditQuestion(question.id)} type="button">Sửa</button>
                    <button className="instructor-question-bank-btn instructor-question-bank-btn-danger" onClick={() => deleteQuestion(question.id)} type="button">Xóa</button>
                  </div>
                </div>

                {expandedQuestionId === question.id ? (
                  <div className="question-bank-card-body">
                    <QuestionDetailPanel question={question} />
                  </div>
                ) : null}
              </article>
            );
          })}
          {!filteredQuestions.length && !loading ? <p className="instructor-question-bank-empty-state">Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.</p> : null}
        </div>
      </section>
    </>
  );
};

export default QuestionBankTab;
