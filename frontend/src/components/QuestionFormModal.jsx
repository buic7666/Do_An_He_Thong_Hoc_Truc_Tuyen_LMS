import { useState } from 'react';

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
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onToggleCorrectIndex,
  renderTypeSpecificForm,
}) {
  if (!isOpen) {
    return null;
  }

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
            Nhập Nội Dung Câu Hỏi
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Loại câu hỏi: <strong>{QUESTION_TYPE_LABELS[draft.type] || draft.type}</strong> · 
            Độ khó: <strong>{draft.difficulty}</strong>
          </p>
        </div>

        {/* Form Content */}
        <div style={{ marginBottom: '24px' }}>
          {/* Question Content */}
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

          {/* Type-Specific Fields */}
          <div style={{ marginBottom: '20px' }}>
            {renderTypeSpecificForm()}
          </div>

          {/* Explanation */}
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

          {/* Publish Checkbox */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => onDraftChange({ ...draft, isPublished: e.target.checked })}
            />
            <span style={{ fontSize: '14px', color: '#333' }}>Công khai câu hỏi ngay sau khi lưu</span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
            }}
          >
            Quay lại
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
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#15803d';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#16a34a';
            }}
          >
            Xác nhận thêm câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuestionFormModal;
