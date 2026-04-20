import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createTeacherQuestionApi,
  deleteTeacherQuestionApi,
  fetchTeacherQuestionsApi,
  updateTeacherQuestionApi,
} from '../../api/teacherApi';

import './ManHinhQuanLyNganHangCauhoi.css';
import { logout } from '../../utils/authSession';

const createEmptyDraft = () => ({
  content: '',
  options: ['', '', '', ''],
  correctIndex: 1,
});

function ManHinhQuanLyNganHangCauhoi() {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout({ navigate });
  };
  const [testName, setTestName] = useState('Kiểm tra Cuối kỳ - Flutter UI & State Management');
  const [duration, setDuration] = useState('45');
  const [passScore, setPassScore] = useState('70');
  const [draft, setDraft] = useState(createEmptyDraft());
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuestions = async () => {
    setIsLoading(true);

    try {
      const data = await fetchTeacherQuestionsApi();
      const config = data?.config || {};
      const items = Array.isArray(data?.questions) ? data.questions : [];

      setTestName(config.testName || 'Kiểm tra Cuối kỳ');
      setDuration(String(config.duration || 45));
      setPassScore(String(config.passScore || 70));
      setQuestions(items);
    } catch (_error) {
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const questionCount = useMemo(() => questions.length, [questions]);

  const handleOptionChange = (index, value) => {
    setDraft((previous) => {
      const nextOptions = [...previous.options];
      nextOptions[index] = value;
      return {
        ...previous,
        options: nextOptions,
      };
    });
  };

  const resetDraft = () => {
    setDraft(createEmptyDraft());
    setEditingId(null);
  };

  const addOrUpdateQuestion = async () => {
    const content = draft.content.trim();
    const hasEnoughOptions = draft.options.filter((option) => option.trim()).length >= 2;
    if (!content || !hasEnoughOptions) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập nội dung câu hỏi và ít nhất 2 đáp án.');
      return;
    }

    const normalizedOptions = draft.options.map((item) => item.trim()).filter(Boolean);
    const preservedCorrectValue = draft.options[draft.correctIndex]?.trim();
    const normalizedCorrectIndex = Math.max(normalizedOptions.indexOf(preservedCorrectValue), 0);

    const payload = {
      testName,
      duration: Number(duration || 45),
      passScore: Number(passScore || 70),
      content,
      options: normalizedOptions,
      correctIndex: normalizedCorrectIndex,
    };

    if (editingId) {
      try {
        await updateTeacherQuestionApi(editingId, payload);
        await loadQuestions();
        // eslint-disable-next-line no-alert
        alert('Đã cập nhật câu hỏi.');
        resetDraft();
        return;
      } catch (error) {
        // eslint-disable-next-line no-alert
        alert(error?.response?.data?.message || 'Không thể cập nhật câu hỏi.');
        return;
      }
    }

    try {
      await createTeacherQuestionApi(payload);
      await loadQuestions();
      // eslint-disable-next-line no-alert
      alert('Đã thêm câu hỏi mới.');
      resetDraft();
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể thêm câu hỏi.');
    }
  };

  const startEditQuestion = (id) => {
    const question = questions.find((item) => item.id === id);
    if (!question) return;
    setEditingId(id);
    setDraft({
      content: question.content,
      options: [...question.options],
      correctIndex: question.correctIndex,
    });
  };

  const deleteQuestion = async (id) => {
    try {
      await deleteTeacherQuestionApi(id);
      setQuestions((previous) => previous.filter((q) => q.id !== id));
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Khong the xoa cau hoi.');
      return;
    }

    if (editingId === id) {
      resetDraft();
    }
  };

  const saveQuiz = () => {
    // eslint-disable-next-line no-alert
    alert(`Da cap nhat cau hinh bai kiem tra: ${testName}. Cau hinh se ap dung cho cau hoi tao/sua tiep theo.`);
  };

  return (
    <div className="instructor-question-bank-page">
      <aside className="instructor-question-bank-sidebar">
        <div className="instructor-question-bank-brand">
          <div className="instructor-question-bank-brand-icon">L</div>
          <span>LMS Admin</span>
        </div>

        <ul className="instructor-question-bank-nav-menu">
          <li>
            <button className="instructor-question-bank-nav-link" onClick={() => navigate('/teacher/dashboard')} type="button">
              Tổng quan
            </button>
          </li>
          <li>
            <button className="instructor-question-bank-nav-link" onClick={() => navigate('/teacher/courses')} type="button">
              Quản lý khóa học
            </button>
          </li>
          <li>
            <button className="instructor-question-bank-nav-link active" onClick={() => navigate('/teacher/questions')} type="button">
              Ngân hàng câu hỏi
            </button>
          </li>
          <li>
            <button className="instructor-question-bank-nav-link" onClick={() => navigate('/teacher/students')} type="button">
              Quản lý học viên
            </button>
          </li>
          <li>
            <button className="instructor-question-bank-nav-link" onClick={() => navigate('/teacher/interaction')} type="button">
              Tương tác học viên
            </button>
          </li>
          <li>
            <button className="instructor-question-bank-nav-link" onClick={() => navigate('/teacher/profile')} type="button">
              Hồ sơ giảng viên
            </button>
          </li>
          <li>
            <button className="instructor-question-bank-nav-link" onClick={() => navigate('/teacher/revenue')} type="button">
              Doanh thu
            </button>
          </li>
        </ul>

        <button className="instructor-question-bank-logout-btn" type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="instructor-question-bank-main-content">
        <header className="instructor-question-bank-page-header">
          <h1 className="instructor-question-bank-page-title">Quản lý Bài kiểm tra</h1>
          <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={saveQuiz} type="button">
            Lưu Bài kiểm tra
          </button>
        </header>

        <section className="instructor-question-bank-card">
          <h2 className="instructor-question-bank-card-title">Cấu hình chung</h2>
          {isLoading ? <p>Đang tải dữ liệu từ CSDL...</p> : null}

          <div className="instructor-question-bank-config-grid">
            <div className="instructor-question-bank-form-group no-margin">
              <label className="instructor-question-bank-form-label" htmlFor="quiz-name">
                Tên bài kiểm tra
              </label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-name"
                onChange={(event) => setTestName(event.target.value)}
                type="text"
                value={testName}
              />
            </div>

            <div className="instructor-question-bank-form-group no-margin">
              <label className="instructor-question-bank-form-label" htmlFor="quiz-duration">
                Thời gian (Phút)
              </label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-duration"
                onChange={(event) => setDuration(event.target.value)}
                type="number"
                value={duration}
              />
            </div>

            <div className="instructor-question-bank-form-group no-margin">
              <label className="instructor-question-bank-form-label" htmlFor="quiz-pass-score">
                Điểm đạt tối thiểu (%)
              </label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-pass-score"
                onChange={(event) => setPassScore(event.target.value)}
                type="number"
                value={passScore}
              />
            </div>
          </div>
        </section>

        <section className="instructor-question-bank-card highlighted">
          <h2 className="instructor-question-bank-card-title">Thêm câu hỏi trắc nghiệm</h2>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="question-content">
              Nội dung câu hỏi
            </label>
            <textarea
              className="instructor-question-bank-form-control"
              id="question-content"
              onChange={(event) => setDraft((previous) => ({ ...previous, content: event.target.value }))}
              placeholder="Nhập nội dung câu hỏi tại đây..."
              value={draft.content}
            />
          </div>

          <label className="instructor-question-bank-form-label">Các lựa chọn đáp án (Chọn 1 đáp án đúng)</label>

          <div className="instructor-question-bank-options-list">
            {draft.options.map((option, index) => (
              <label className="instructor-question-bank-option-row" key={`option-${index + 1}`}>
                <input
                  checked={draft.correctIndex === index}
                  className="instructor-question-bank-option-radio"
                  name="correct-answer"
                  onChange={() => setDraft((previous) => ({ ...previous, correctIndex: index }))}
                  type="radio"
                />
                <span className="instructor-question-bank-option-letter">{String.fromCharCode(65 + index)}</span>
                <input
                  className="instructor-question-bank-option-input"
                  onChange={(event) => handleOptionChange(index, event.target.value)}
                  placeholder={`Nhap dap an ${String.fromCharCode(65 + index)}`}
                  type="text"
                  value={option}
                />
              </label>
            ))}
          </div>

          <button className="instructor-question-bank-btn instructor-question-bank-btn-success" onClick={addOrUpdateQuestion} type="button">
            {editingId ? 'Cap nhat cau hoi' : '+ Them cau hoi'}
          </button>
        </section>

        <section className="instructor-question-bank-card">
          <h2 className="instructor-question-bank-card-title">Danh sach cau hoi da them ({questionCount})</h2>

          <div className="instructor-question-bank-question-list">
            {questions.map((question, index) => (
              <article className="instructor-question-bank-q-item" key={question.id}>
                <div className="instructor-question-bank-q-content">
                  <h4>
                    {index + 1}. {question.content}
                  </h4>
                  <span className="instructor-question-bank-q-correct">
                    Dap an dung: {String.fromCharCode(65 + question.correctIndex)}. {question.options[question.correctIndex]}
                  </span>
                </div>

                <div className="instructor-question-bank-q-actions">
                  <button className="instructor-question-bank-btn-icon edit" onClick={() => startEditQuestion(question.id)} title="Sua" type="button">
                    E
                  </button>
                  <button className="instructor-question-bank-btn-icon delete" onClick={() => deleteQuestion(question.id)} title="Xoa" type="button">
                    D
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ManHinhQuanLyNganHangCauhoi;
