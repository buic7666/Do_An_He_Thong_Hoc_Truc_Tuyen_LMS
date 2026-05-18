import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import {
  createSurveyApi,
  fetchSurveysByCourseApi,
  getSurveyDetailApi,
  submitSurveyResponseApi,
  getCourseChaptersApi,
} from '../../api/teacherManagementApi';
import './SurveyActivity.css';

const emptyQuestion = () => ({ type: 'MULTIPLE_CHOICE', questionText: '', options: ['', ''], orderIndex: 0, correctIndex: 0 });

export default function SurveyActivity() {
  const { courseId } = useParams();
  const [surveys, setSurveys] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [draft, setDraft] = useState({ title: '', description: '', isAnonymous: true, isPublished: false, chapterId: '', questions: [emptyQuestion()] });
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    if (courseId) loadSurveys();
    (async () => {
      if (courseId) {
        const ch = await getCourseChaptersApi(courseId);
        setChapters(ch || []);
      }
    })();
  }, [courseId]);

  const loadSurveys = async () => {
    try {
      const items = await fetchSurveysByCourseApi(courseId);
      setSurveys(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
    }
  };

  const addQuestion = () => setDraft((d) => ({ ...d, questions: [...d.questions, emptyQuestion()] }));
  const removeQuestion = (i) => setDraft((d) => ({ ...d, questions: d.questions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i, patch) => setDraft((d) => ({ ...d, questions: d.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));

  const handleCreateSurvey = async () => {
    try {
      const payload = { ...draft, courseId: Number(courseId), chapterId: draft.chapterId ? Number(draft.chapterId) : undefined };
      await createSurveyApi(payload);
      alert('Survey created');
      setDraft({ title: '', description: '', isAnonymous: true, isPublished: false, chapterId: '', questions: [emptyQuestion()] });
      loadSurveys();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Error');
    }
  };

  const openSurvey = async (id) => {
    try {
      const s = await getSurveyDetailApi(id);
      setSelectedSurvey(s);
    } catch (err) {
      console.error(err);
    }
  };

  const submitResponse = async (survey) => {
    try {
      // collect answers from inputs
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
      alert('Cảm ơn phản hồi của bạn');
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi gửi phản hồi');
    }
  };

  return (
    <div className="survey-page">
      <TeacherSidebar />
      <main className="survey-main">
        <h1>Activity → Feedback (Survey)</h1>

        <section className="survey-creator">
          <h2>Tạo Survey</h2>
          <input placeholder="Tiêu đề" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <textarea placeholder="Mô tả" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          <label><input type="checkbox" checked={draft.isAnonymous} onChange={(e) => setDraft((d) => ({ ...d, isAnonymous: e.target.checked }))} /> Ẩn danh</label>
          <label>Chương
            <select value={draft.chapterId} onChange={(e) => setDraft((d) => ({ ...d, chapterId: e.target.value }))}>
              <option value="">-- Toàn khóa --</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <div className="questions-list">
            {draft.questions.map((q, i) => (
              <div className="q-item" key={i}>
                <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })}>
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="TRUE_FALSE">Đúng/Sai</option>
                  <option value="SHORT_TEXT">Văn bản ngắn</option>
                </select>
                <input placeholder="Nội dung câu hỏi" value={q.questionText} onChange={(e) => updateQuestion(i, { questionText: e.target.value })} />
                {q.type === 'MULTIPLE_CHOICE' && (
                  <div>
                    {(q.options || []).map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8 }}>
                        <input value={opt} onChange={(e) => updateQuestion(i, { options: q.options.map((o, ii) => ii === idx ? e.target.value : o) })} />
                        <label>
                          <input type="radio" name={`correct-${i}`} checked={q.correctIndex === idx} onChange={() => updateQuestion(i, { correctIndex: idx })} /> Đ
                        </label>
                      </div>
                    ))}
                    <button onClick={() => updateQuestion(i, { options: [...(q.options || []), ''] })}>+ Thêm lựa chọn</button>
                  </div>
                )}
                <button onClick={() => removeQuestion(i)}>Xóa câu hỏi</button>
              </div>
            ))}
          </div>
          <button onClick={addQuestion}>+ Thêm câu hỏi</button>
          <button onClick={handleCreateSurvey}>Lưu / Tạo survey</button>
        </section>

        <section className="survey-list">
          <h2>Survey hiện có</h2>
          {surveys.map((s) => (
            <div key={s.id} className="survey-row">
              <strong>{s.title}</strong>
              <button onClick={() => openSurvey(s.id)}>Mở</button>
            </div>
          ))}
        </section>

        {selectedSurvey && (
          <section className="survey-detail">
            <h2>{selectedSurvey.title}</h2>
            <p>{selectedSurvey.description}</p>
            <div className="survey-questions">
              {(selectedSurvey.questions || []).map((q) => (
                <div key={q.id} className="survey-q">
                  <p>{q.questionText}</p>
                  {q.type === 'MULTIPLE_CHOICE' && (q.metadata?.options || []).map((opt, idx) => (
                    <div key={idx}><label><input name={`answer-${q.id}`} type="radio" value={idx} /> {opt}</label></div>
                  ))}
                  {q.type === 'TRUE_FALSE' && (
                    <div>
                      <label><input name={`answer-${q.id}`} type="radio" value="true" /> Đúng</label>
                      <label><input name={`answer-${q.id}`} type="radio" value="false" /> Sai</label>
                    </div>
                  )}
                  {q.type === 'SHORT_TEXT' && <input name={`answer-${q.id}`} type="text" />}
                </div>
              ))}
            </div>
            <button onClick={() => submitResponse(selectedSurvey)}>Gửi phản hồi</button>
          </section>
        )}
      </main>
    </div>
  );
}
