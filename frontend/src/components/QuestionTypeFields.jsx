import React from 'react';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText } from './RichContentEditor';
import ClozeQuestionForm from './ClozeQuestionForm';

const ensureArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

function QuestionTypeFields({ draft, setDraft }) {
  const updateDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const addOption = () => {
    setDraft((prev) => {
      if ((prev.options || []).length >= 10) return prev;
      return {
        ...prev,
        options: [...(prev.options || []), ''],
        optionsRich: [...(prev.optionsRich || []), createEmptyRichBlocks()],
      };
    });
  };

  const removeOption = (index) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đáp án này?')) return;
    setDraft((prev) => {
      if ((prev.options || []).length <= 2) return prev;
      const nextOptions = [...(prev.options || [])];
      const nextRich = [...(prev.optionsRich || [])];
      nextOptions.splice(index, 1);
      nextRich.splice(index, 1);
      const nextCorrect = (prev.correctIndices || []).map((i) => (i > index ? i - 1 : i)).filter((i) => i >= 0 && i < nextOptions.length);
      if (!nextCorrect.length && nextOptions.length) nextCorrect.push(0);
      return { ...prev, options: nextOptions, optionsRich: nextRich, correctIndices: nextCorrect };
    });
  };

  const toggleCorrectIndex = (index) => {
    setDraft((prev) => {
      if (prev.allowMultipleCorrect) {
        const next = new Set(prev.correctIndices || []);
        if (next.has(index)) next.delete(index); else next.add(index);
        const arr = Array.from(next).sort((a, b) => a - b);
        return { ...prev, correctIndices: arr.length ? arr : [0] };
      }
      return { ...prev, correctIndices: [index] };
    });
  };

  const updateRubricItem = (index, field, value) => {
    setDraft((prev) => {
      const next = [...(prev.rubric || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, rubric: next };
    });
  };

  const addRubricItem = () => setDraft((prev) => ({ ...prev, rubric: [...(prev.rubric || []), { name: '', weight: 0, description: '' }] }));
  const removeRubricItem = (index) => setDraft((prev) => ({ ...prev, rubric: (prev.rubric || []).filter((_, i) => i !== index) }));

  if (draft.type === 'MULTIPLE_CHOICE') {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="instructor-question-bank-form-label">Các lựa chọn đáp án</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={Boolean(draft.allowMultipleCorrect)} onChange={(e) => updateDraft({ allowMultipleCorrect: e.target.checked, correctIndices: e.target.checked ? draft.correctIndices : [draft.correctIndices?.[0] ?? 0] })} />
            <span style={{ fontSize: 13 }}>Cho phép nhiều đáp án đúng</span>
          </label>
        </div>
        <div className="instructor-question-bank-options-list">
          {ensureArray(draft.optionsRich, []).map((optionBlocks, index) => (
            <div className="instructor-question-bank-option-row" key={`option-${index + 1}`} style={{ alignItems: 'stretch', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input checked={ensureArray(draft.correctIndices, []).includes(index)} className="instructor-question-bank-option-radio" onChange={() => toggleCorrectIndex(index)} name="question-correct-answer" type="radio" />
                <span className="instructor-question-bank-option-letter">{String.fromCharCode(65 + index)}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>Đáp án {String.fromCharCode(65 + index)}</span>
                <button className="instructor-question-bank-btn-icon delete" onClick={() => removeOption(index)} title="Xóa lựa chọn" type="button" disabled={(draft.options || []).length <= 2}>−</button>
              </div>
              <RichContentEditor title="" helperText="Có thể dùng văn bản, ảnh hoặc video cho đáp án này." value={optionBlocks} onChange={(nextBlocks) => {
                const nextRich = [...(draft.optionsRich || [])];
                nextRich[index] = nextBlocks;
                const nextOptions = [...(draft.options || [])];
                nextOptions[index] = richContentToPlainText(nextBlocks);
                setDraft((prev) => ({ ...prev, optionsRich: nextRich, options: nextOptions }));
              }} />
            </div>
          ))}
        </div>
        <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" type="button" onClick={addOption} disabled={(draft.options || []).length >= 10}>+ Thêm lựa chọn</button>
      </>
    );
  }

  if (draft.type === 'TRUE_FALSE') {
    return (
      <div className="instructor-question-bank-form-group">
        <label className="instructor-question-bank-form-label" htmlFor="tf-answer">Đáp án đúng</label>
        <select className="instructor-question-bank-form-control" id="tf-answer" value={String(draft.correctAnswer)} onChange={(event) => updateDraft({ correctAnswer: event.target.value === 'true' })}>
          <option value="true">Đúng</option>
          <option value="false">Sai</option>
        </select>
      </div>
    );
  }

  if (draft.type === 'SHORT_ANSWER') {
    return (
      <>
        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label" htmlFor="sa-answers">Danh sách đáp án chấp nhận (mỗi dòng 1 đáp án)</label>
          <textarea className="instructor-question-bank-form-control" id="sa-answers" value={draft.acceptedAnswersText} onChange={(event) => updateDraft({ acceptedAnswersText: event.target.value })} />
        </div>
        <div className="instructor-question-bank-options-list" style={{ gap: 12 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={Boolean(draft.caseSensitive)} onChange={(event) => updateDraft({ caseSensitive: event.target.checked })} />
            <span>Phân biệt chữ hoa/thường</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={Boolean(draft.fuzzyMatch)} onChange={(event) => updateDraft({ fuzzyMatch: event.target.checked })} />
            <span>Khớp mềm (fuzzy match)</span>
          </label>
        </div>
      </>
    );
  }

  if (draft.type === 'CLOZE') {
    return (
      <div style={{ marginTop: 8 }}>
        <ClozeQuestionForm compact initialValue={{ text_template: draft.content, inner_questions: draft.metadata?.inner_questions || {} }} templateText={draft.content} onChange={(nextMetadata) => setDraft((prev) => ({ ...prev, metadata: nextMetadata }))} />
      </div>
    );
  }

  return (
    <>
      <div className="instructor-question-bank-form-group">
        <label className="instructor-question-bank-form-label" htmlFor="essay-instructions">Hướng dẫn bài viết</label>
        <textarea className="instructor-question-bank-form-control" id="essay-instructions" value={draft.instructions} onChange={(event) => updateDraft({ instructions: event.target.value })} />
      </div>

      <div className="instructor-question-bank-options-list" style={{ gap: '12px' }}>
        <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
          <label className="instructor-question-bank-form-label" htmlFor="essay-word-min">Số từ tối thiểu</label>
          <input className="instructor-question-bank-form-control" id="essay-word-min" type="number" min="0" value={draft.wordLimitMin} onChange={(event) => updateDraft({ wordLimitMin: event.target.value })} />
        </div>
        <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
          <label className="instructor-question-bank-form-label" htmlFor="essay-word-max">Số từ tối đa</label>
          <input className="instructor-question-bank-form-control" id="essay-word-max" type="number" min="1" value={draft.wordLimitMax} onChange={(event) => updateDraft({ wordLimitMax: event.target.value })} />
        </div>
        <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
          <label className="instructor-question-bank-form-label" htmlFor="essay-grading-method">Cách chấm</label>
          <select
            className="instructor-question-bank-form-control"
            id="essay-grading-method"
            value={draft.gradingMethod || 'ai'}
            onChange={(event) => updateDraft({ gradingMethod: event.target.value })}
          >
            <option value="ai">AI</option>
            <option value="external_api">API ngoài</option>
            <option value="manual">Chấm tay</option>
          </select>
        </div>
      </div>

      {(draft.gradingMethod || 'ai') === 'ai' ? (
        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label" htmlFor="essay-model">Mô hình AI</label>
          <select className="instructor-question-bank-form-control" id="essay-model" value={draft.aiModel} onChange={(event) => updateDraft({ aiModel: event.target.value })}>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            <option value="gpt-4">gpt-4</option>
            <option value="gpt-4o">gpt-4o</option>
          </select>
        </div>
      ) : null}

      {(draft.gradingMethod || 'ai') === 'external_api' ? (
        <div className="instructor-question-bank-form-group">
         <p style={{ color: '#64748b', margin: 0 }}>
            Hệ thống sẽ sử dụng API chấm tự luận ngoài do admin cấu hình.
             Giảng viên không cần nhập URL hoặc token API.
         </p>
       </div>
      ) : null}

      <div className="instructor-question-bank-form-group">
        <label className="instructor-question-bank-form-label">Rubric</label>
        {ensureArray(draft.rubric, []).map((item, index) => (
          <div className="instructor-question-bank-q-item" key={`rubric-${index + 1}`}>
            <div className="instructor-question-bank-q-content" style={{ width: '100%' }}>
              <input className="instructor-question-bank-form-control" placeholder="Tên tiêu chí" value={item.name} onChange={(event) => updateRubricItem(index, 'name', event.target.value)} />
              <input className="instructor-question-bank-form-control" style={{ marginTop: 10 }} type="number" placeholder="Trọng số" value={item.weight} onChange={(event) => updateRubricItem(index, 'weight', event.target.value)} />
              <textarea className="instructor-question-bank-form-control" style={{ marginTop: 10 }} placeholder="Mô tả tiêu chí" value={item.description} onChange={(event) => updateRubricItem(index, 'description', event.target.value)} />
            </div>
            <div className="instructor-question-bank-q-actions">
              {ensureArray(draft.rubric, []).length > 1 ? (<button className="instructor-question-bank-btn-icon delete" type="button" onClick={() => removeRubricItem(index)}>D</button>) : null}
            </div>
          </div>
        ))}
        <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" type="button" onClick={addRubricItem}>+ Thêm mục đánh giá</button>
      </div>
    </>
  );
}

export default QuestionTypeFields;
