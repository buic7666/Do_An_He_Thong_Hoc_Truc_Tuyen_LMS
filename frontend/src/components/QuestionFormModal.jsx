import { useEffect, useState } from 'react';

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

  const canGoNext = Boolean(draft.content?.trim());

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
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Loại câu hỏi: <strong>{QUESTION_TYPE_LABELS[draft.type] || draft.type}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
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

        {step === 1 ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Nội dung câu hỏi *
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
                  minHeight: '100px',
                }}
                placeholder="Nhập nội dung câu hỏi..."
                value={draft.content}
                onChange={(e) => onDraftChange({ ...draft, content: e.target.value })}
              />
            </div>

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
          <div style={{ marginBottom: '24px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Xác nhận thông tin câu hỏi</h3>
            <p style={{ margin: '0 0 10px 0' }}><strong>Loại:</strong> {QUESTION_TYPE_LABELS[draft.type] || draft.type}</p>
            <p style={{ margin: '0 0 10px 0' }}><strong>Công khai:</strong> {draft.isPublished ? 'Có' : 'Không'}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Nội dung câu hỏi:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', color: '#111827' }}>{draft.content || '(Trống)'}</div>
          </div>
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
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#16a34a',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                Xác nhận thêm câu hỏi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionFormModal;
