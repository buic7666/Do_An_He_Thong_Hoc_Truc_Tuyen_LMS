import { useEffect, useState } from 'react';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText } from './RichContentEditor';

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
};

function QuestionFormModal({
  isOpen,
  draft,
  onDraftChange,
  onConfirm,
  onCancel,
  renderTypeSpecificForm,
  chapterId,
  lectureId,
  segmentId,
  chapterTitle,
  lectureTitle,
  segmentTitle,
}) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const contentText = richContentToPlainText(draft.contentBlocks) || String(draft.content || '').trim();
  const contentLen = contentText.length;
  const canGoNext = contentLen >= 10;
  const validateDraft = (d) => {
    const errors = [];
    const contentLength = (richContentToPlainText(d.contentBlocks) || String(d.content || '').trim()).length;
    if (contentLength < 10) {
      errors.push('Nội dung câu hỏi cần ít nhất 10 ký tự.');
    }

    if (d.type === 'MULTIPLE_CHOICE') {
      const opts = Array.isArray(d.options) ? d.options.map((s) => String(s || '').trim()).filter(Boolean) : [];
      if (opts.length < 2) errors.push('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án.');
      const correct = Array.isArray(d.correctIndices) ? d.correctIndices.filter((n) => Number.isFinite(Number(n))) : [];
      if (!correct.length) errors.push('Hãy chọn ít nhất 1 đáp án đúng.');
    }

    if (d.type === 'SHORT_ANSWER') {
      const accepted = String(d.acceptedAnswersText || '').split('\n').map(s => s.trim()).filter(Boolean);
      if (!accepted.length) errors.push('Câu trả lời ngắn cần ít nhất 1 đáp án chấp nhận.');
    }

    if (d.type === 'ESSAY') {
      const rubric = Array.isArray(d.rubric) ? d.rubric : [];
      if (!rubric.length) errors.push('Câu tự luận cần ít nhất 1 tiêu chí (rubric).');
      else {
        let total = 0;
        rubric.forEach((r, i) => {
          const name = String(r?.name || '').trim();
          const desc = String(r?.description || '').trim();
          const weight = Number(r?.weight || 0);
          if (name.length < 3) errors.push(`Tiêu chí #${i + 1} cần tên ít nhất 3 ký tự.`);
          if (desc.length < 10) errors.push(`Tiêu chí #${i + 1} cần mô tả ít nhất 10 ký tự.`);
          if (!Number.isFinite(weight)) errors.push(`Tiêu chí #${i + 1} trọng số không hợp lệ.`);
          total += Number.isFinite(weight) ? weight : 0;
        });
        if (Math.round(total) !== 100) errors.push('Tổng trọng số rubric phải bằng 100.');
      }
    }

    return { ok: errors.length === 0, errors };
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#111' }}>
            Tạo Câu Hỏi Theo Từng Bước
          </h2>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
            Loại câu hỏi: <strong>{QUESTION_TYPE_LABELS[draft.type] || draft.type}</strong>
          </p>
          {(chapterTitle || lectureTitle || segmentTitle) && (
            <p style={{ margin: '0 0 0 0', fontSize: '13px', color: '#888', fontStyle: 'italic' }}>
              Scope: {chapterTitle && <span><strong>Chương:</strong> {chapterTitle}</span>}
              {lectureTitle && <span> • <strong>Bài:</strong> {lectureTitle}</span>}
              {segmentTitle && <span> • <strong>Phần:</strong> {segmentTitle}</span>}
              {!chapterTitle && !lectureTitle && segmentId && <span>Segment ID: {segmentId}</span>}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: step === 1 ? '#dbeafe' : '#f3f4f6',
              color: step === 1 ? '#1d4ed8' : '#6b7280',
              fontWeight: 600,
              fontSize: 12,
            }}>
              Bước 1: Nhập nội dung
            </span>
            <span style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: step === 2 ? '#dcfce7' : '#f3f4f6',
              color: step === 2 ? '#15803d' : '#6b7280',
              fontWeight: 600,
              fontSize: 12,
            }}>
              Bước 2: Xác nhận thêm câu hỏi
            </span>
          </div>

          <div>
            <label style={{ marginRight: 8, color: '#374151', fontWeight: 600 }}>Loại câu hỏi</label>
            <select
              value={draft.type}
              onChange={(e) => {
                const newType = e.target.value;
                let next = { ...draft, type: newType };
                if (newType === 'MULTIPLE_CHOICE') {
                  next = {
                    ...next,
                    options: next.options && next.options.length ? next.options : ['', '', '', ''],
                    optionsRich: next.optionsRich && next.optionsRich.length ? next.optionsRich : [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()],
                    correctIndices: next.correctIndices || [0],
                  };
                } else if (newType === 'TRUE_FALSE') {
                  next = { ...next, correctAnswer: typeof next.correctAnswer === 'boolean' ? next.correctAnswer : true };
                } else if (newType === 'SHORT_ANSWER') {
                  next = { ...next, acceptedAnswersText: next.acceptedAnswersText || '' };
                } else if (newType === 'ESSAY') {
                  next = { ...next, rubric: next.rubric && next.rubric.length ? next.rubric : [{ name: 'Nội dung', weight: 100, description: '' }], instructions: next.instructions || '' };
                }
                onDraftChange(next);
              }}
              style={{ padding: '6px 10px', borderRadius: 6 }}
            >
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="TRUE_FALSE">Đúng/Sai</option>
              <option value="SHORT_ANSWER">Trả lời ngắn</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>
        </div>

        {step === 1 ? (
            <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Nội dung câu hỏi *
              </label>
              <RichContentEditor
                title=""
                helperText="Có thể thêm nhiều khối văn bản, ảnh hoặc video cho nội dung câu hỏi."
                value={draft.contentBlocks}
                onChange={(nextBlocks) => onDraftChange({
                  ...draft,
                  contentBlocks: nextBlocks,
                  content: richContentToPlainText(nextBlocks),
                })}
              />
            </div>
            {contentLen > 0 && contentLen < 10 ? (
              <div style={{ color: '#b91c1c', marginBottom: 12 }}>Nội dung câu hỏi cần ít nhất 10 ký tự (hiện có {contentLen}).</div>
            ) : null}

            <div style={{ marginBottom: '20px' }}>
              {renderTypeSpecificForm()}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Giải thích (không bắt buộc)
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '80px',
                }}
                placeholder="Nhập giải thích để giúp học sinh hiểu rõ hơn..."
                value={draft.explanation}
                onChange={(e) => onDraftChange({ ...draft, explanation: e.target.value })}
              />
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={draft.isPublished}
                onChange={(e) => onDraftChange({ ...draft, isPublished: e.target.checked })}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>Công khai câu hỏi ngay sau khi lưu</span>
            </label>
          </div>
        ) : (
          (() => {
            const result = validateDraft(draft);
            return (
              <div style={{ marginBottom: '24px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Xác nhận thông tin câu hỏi</h3>
                <p style={{ margin: '0 0 10px 0' }}><strong>Loại:</strong> {QUESTION_TYPE_LABELS[draft.type] || draft.type}</p>
                <p style={{ margin: '0 0 10px 0' }}><strong>Công khai:</strong> {draft.isPublished ? 'Có' : 'Không'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Nội dung câu hỏi:</strong></p>
                <div style={{ whiteSpace: 'pre-wrap', color: '#111827' }}>{draft.content || '(Trống)'}</div>
                {result.errors && result.errors.length ? (
                  <div style={{ marginTop: 12, color: '#b91c1c' }}>
                    {result.errors.map((err, idx) => (
                      <div key={idx}>• {err}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })()
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canGoNext}
                style={{
                  padding: '10px 20px',
                  backgroundColor: canGoNext ? '#2563eb' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canGoNext ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                Tiếp tục
              </button>
            </>
          ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                  }}
                >
                  Quay lại bước 1
                </button>
                {(() => {
                  const result = validateDraft(draft);
                  return (
                    <button
                      type="button"
                      onClick={() => { if (result.ok) onConfirm(); else alert('Validation failed: vui lòng sửa các lỗi hiển thị.'); }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: result.ok ? '#16a34a' : '#9ca3af',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: result.ok ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                      }}
                      disabled={!result.ok}
                    >
                      Xác nhận thêm câu hỏi
                    </button>
                  );
                })()}
              </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionFormModal;
