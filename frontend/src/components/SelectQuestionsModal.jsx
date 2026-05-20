import React, { useEffect, useState } from 'react';
import { fetchQuestionsApi } from '../api/teacherManagementApi';

const SelectQuestionsModal = ({ isOpen, onClose, filters = {}, initial = [], initialRandomCount = 0, onConfirm }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(initial || []);
  const [randomCount, setRandomCount] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const questionTitleById = (questionId) => {
    const found = (questions || []).find((question) => Number(question.id) === Number(questionId));
    return found ? (found.title || found.content || `Câu #${found.id}`) : `Câu #${questionId}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchQuestionsApi(filters)
      .then((res) => {
        setQuestions(res || []);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [isOpen, JSON.stringify(filters)]);

  useEffect(() => setSelected(initial || []), [initial]);

  useEffect(() => {
    if (!isOpen) return;
    setRandomCount(Number(initialRandomCount || 0));
  }, [isOpen, initialRandomCount]);

  useEffect(() => setPage(1), [query]);

  if (!isOpen) return null;

  const qlist = (questions || []).filter((q) => {
    if (!query) return true;
    const s = `${String(q.content || '')} ${String(q.title || '')} ${String(q.id || '')}`.toLowerCase();
    return s.indexOf(query.toLowerCase()) !== -1;
  });

  const totalPages = Math.max(1, Math.ceil(qlist.length / pageSize));
  const pageIndex = Math.min(Math.max(1, page), totalPages);
  const pageItems = qlist.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000 }}
      onClick={onClose}
    >
      <div style={{ width: '90%', maxWidth: 900, background: 'white', borderRadius: 8, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <h3>Chọn câu hỏi cho bài tập</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 12 }}>
            <input type="checkbox" checked={randomCount > 0} onChange={(e) => setRandomCount(e.target.checked ? 1 : 0)} /> Thêm câu ngẫu nhiên
          </label>
          {randomCount > 0 && (
            <label style={{ marginLeft: 12 }}>
              Số câu ngẫu nhiên:
              <input
                type="number"
                min="1"
                value={randomCount}
                onChange={(e) => setRandomCount(Math.max(1, Number(e.target.value || 1)))}
                style={{ width: 100, marginLeft: 8 }}
              />
            </label>
          )}
          <div style={{ marginTop: 8, color: '#6b7280' }}>
            Bạn có thể chọn một số câu cụ thể và yêu cầu hệ thống thêm {randomCount || 0} câu ngẫu nhiên bổ sung từ bộ lọc hiện tại.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input
            placeholder="Tìm kiếm nội dung hoặc ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <div style={{ color: '#6b7280' }}>{questions.length} câu hỏi</div>
        </div>

        <div style={{ maxHeight: 340, overflow: 'auto', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6 }}>
          {loading ? (
            <div>Đang tải...</div>
          ) : qlist.length ? (
            <>
              {pageItems.map((q) => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={selected.indexOf(q.id) !== -1}
                    onChange={(e) => {
                      if (e.target.checked) setSelected((s) => [...s, q.id]);
                      else setSelected((s) => s.filter((id) => id !== q.id));
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{q.title || q.content || `Câu #${q.id}`}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{q.type}</div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <div style={{ color: '#6b7280' }}>Hiển thị trang {pageIndex} / {totalPages} — {qlist.length} kết quả</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="form-button secondary" disabled={pageIndex <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
                  <button type="button" className="form-button secondary" disabled={pageIndex >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Tiếp</button>
                </div>
              </div>
            </>
          ) : (
            <div>Không tìm thấy câu hỏi cho bộ lọc này.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#f3f4f6',
              color: '#374151',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm({
                randomize: Number(randomCount || 0) > 0,
                randomCount: Number(randomCount || 0),
                questionIds: selected,
                questionTitles: selected.map((questionId) => questionTitleById(questionId)),
              });
              onClose();
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#7c3aed',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
              boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)',
            }}
          >
            ✓ Chọn
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuestionsModal;
