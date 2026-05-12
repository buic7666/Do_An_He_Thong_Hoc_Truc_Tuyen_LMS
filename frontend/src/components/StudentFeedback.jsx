import React, { useEffect, useState } from 'react';
import { fetchSurveysByCourseApi, getSurveyDetailApi, submitSurveyResponseApi, getSurveyResponsesApi } from '../api/teacherManagementApi';
import './StudentFeedback.css';

export default function StudentFeedback({ courseId }) {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!courseId) return;
    loadSurveys();
  }, [courseId]);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const items = await fetchSurveysByCourseApi(courseId);
      setSurveys(Array.isArray(items) ? items.filter(s => s.isPublished) : []);
    } catch (err) {
      console.error('Error loading surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  const openSurvey = async (id) => {
    try {
      const s = await getSurveyDetailApi(id);
      setSelectedSurvey(s);
      // load public responses for display
      try {
        const resp = await getSurveyResponsesApi(id);
        setResponses(Array.isArray(resp) ? resp : []);
      } catch (e) {
        console.error('Error loading survey responses', e);
        setResponses([]);
      }
      setMessage('');
    } catch (err) {
      console.error('Error loading survey:', err);
      setMessage('Không thể tải khảo sát.');
    }
  };

  const [responses, setResponses] = useState([]);

  const submitResponse = async (survey) => {
    try {
      setSubmitting(true);
      const answers = {};
      (survey.questions || []).forEach((q) => {
        const el = document.querySelector(`[name="answer-${q.id}"]`);
        if (!el) return;
        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
          answers[q.id] = { value: el.value };
        } else {
          answers[q.id] = { text: el.value };
        }
      });
      await submitSurveyResponseApi(survey.id, { answers, anonymous: survey.isAnonymous });
      setMessage('Cảm ơn bạn đã gửi phản hồi!');
      setSelectedSurvey(null);
      // Reload surveys to refresh state
      loadSurveys();
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="student-feedback">Đang tải khảo sát...</div>;
  }

  if (surveys.length === 0) {
    return <div className="student-feedback-empty">Không có khảo sát nào cho khóa học này.</div>;
  }

  if (selectedSurvey) {
    return (
      <section className="student-feedback">
        <div className="feedback-header">
          <button className="feedback-back-btn" onClick={() => setSelectedSurvey(null)}>← Quay lại</button>
          <h3>{selectedSurvey.title}</h3>
        </div>
        {selectedSurvey.description && <p className="feedback-description">{selectedSurvey.description}</p>}
        {message && <div className={`feedback-message ${message.includes('Lỗi') ? 'error' : 'success'}`}>{message}</div>}
        <div className="feedback-questions">
          {(selectedSurvey.questions || []).map((q) => (
            <div key={q.id} className="feedback-q-item">
              <label className="feedback-q-label">{q.questionText}</label>
              {q.type === 'MULTIPLE_CHOICE' && (
                <div className="feedback-options">
                  {(q.metadata?.options || []).map((opt, idx) => (
                    <label key={idx} className="feedback-option">
                      <input type="radio" name={`answer-${q.id}`} value={opt} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'TRUE_FALSE' && (
                <div className="feedback-options">
                  <label className="feedback-option">
                    <input type="radio" name={`answer-${q.id}`} value="true" />
                    <span>Đúng</span>
                  </label>
                  <label className="feedback-option">
                    <input type="radio" name={`answer-${q.id}`} value="false" />
                    <span>Sai</span>
                  </label>
                </div>
              )}
              {q.type === 'SHORT_TEXT' && (
                <input
                  type="text"
                  name={`answer-${q.id}`}
                  className="feedback-text-input"
                  placeholder="Nhập câu trả lời của bạn..."
                />
              )}
            </div>
          ))}
        </div>
        <button
          className="feedback-submit-btn"
          onClick={() => submitResponse(selectedSurvey)}
          disabled={submitting}
        >
          {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
        </button>
        {/* Public responses */}
        <div style={{ marginTop: 24 }}>
          <h4>Phản hồi đã gửi</h4>
          {responses.length === 0 ? (
            <p>Chưa có phản hồi nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {responses.map((r) => (
                <div key={r.id} style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e6e6e6' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{new Date(r.createdAt).toLocaleString()}</div>
                  {Object.keys(r.readableAnswers || {}).map((k) => (
                    <div key={k} style={{ marginBottom: 6 }}>
                      <div style={{ fontWeight: 600 }}>{r.readableAnswers[k].questionText}</div>
                      <div style={{ color: '#333' }}>{String(r.readableAnswers[k].answer)}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="student-feedback">
      <h3>Khảo sát và phản hồi</h3>
      <div className="feedback-list">
        {surveys.map((survey) => (
          <div key={survey.id} className="feedback-item">
            <div className="feedback-item-content">
              <h4>{survey.title}</h4>
              {survey.description && <p>{survey.description}</p>}
              <span className="feedback-anonymous-badge">{survey.isAnonymous ? '🔒 Ẩn danh' : 'Công khai'}</span>
            </div>
            <button className="feedback-open-btn" onClick={() => openSurvey(survey.id)}>
              Trả lời
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
