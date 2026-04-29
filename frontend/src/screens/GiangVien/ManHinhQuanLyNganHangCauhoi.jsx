import { useEffect, useMemo, useState } from 'react';
import httpClient from '../../api/httpClient';
import {
  createQuestionApi,
  createQuizApi,
  deleteQuestionApi,
  getCourseChaptersApi,
  fetchQuestionsApi,
  fetchTeacherQuizzesApi,
  addQuestionToQuizApi,
  updateQuestionApi,
} from '../../api/teacherManagementApi';
import TeacherSidebar from '../../components/TeacherSidebar';

import './ManHinhQuanLyNganHangCauhoi.css';

const createEmptyDraft = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctIndex: 1,
});

const createEmptyQuizDraft = () => ({
  title: '',
  description: '',
  chapterId: '',
  duration: '45',
  passScore: '70',
  maxAttempts: '3',
});

function ManHinhQuanLyNganHangCauhoi() {
  const [draft, setDraft] = useState(createEmptyDraft());
  const [quizDraft, setQuizDraft] = useState(createEmptyQuizDraft());
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedQuizForAttach, setSelectedQuizForAttach] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [error, setError] = useState('');
  const [quizError, setQuizError] = useState('');

  const loadCourses = async () => {
    const response = await httpClient.get('/courses');
    const items = Array.isArray(response?.data?.data) ? response.data.data : [];
    setCourses(items);

    if (!selectedCourseId && items.length > 0) {
      const firstCourseId = items[0].id;
      setSelectedCourseId(String(firstCourseId));
      await loadChapters(firstCourseId);
    }
  };

  const loadChapters = async (courseId) => {
    if (!courseId) {
      setChapters([]);
      return;
    }

    const items = await getCourseChaptersApi(courseId);
    setChapters(Array.isArray(items) ? items : []);
  };

  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    setQuizError('');

    try {
      const items = await fetchTeacherQuizzesApi();
      setQuizzes(Array.isArray(items) ? items : []);
    } catch (err) {
      setQuizError(err?.response?.data?.message || 'Không thể tải danh sách quiz.');
      setQuizzes([]);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  const toggleQuestionSelection = (id) => {
    setSelectedQuestionIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const handleAttachSelectedQuestions = async () => {
    if (!selectedQuizForAttach) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng chọn quiz để gắn câu hỏi.');
      return;
    }

    if (!selectedQuestionIds.length) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng chọn ít nhất 1 câu hỏi.');
      return;
    }

    setIsAttaching(true);
    try {
      for (const qid of selectedQuestionIds) {
        // attach each question (backend handles ordering/points if provided)
        // eslint-disable-next-line no-await-in-loop
        await addQuestionToQuizApi(Number(selectedQuizForAttach), qid, {});
      }

      // eslint-disable-next-line no-alert
      alert('Đã gắn câu hỏi vào quiz.');
      setSelectedQuestionIds([]);
      await loadQuizzes();
      await loadQuestions();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.response?.data?.message || 'Không thể gắn câu hỏi vào quiz.');
    } finally {
      setIsAttaching(false);
    }
  };

  const loadQuestions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const items = await fetchQuestionsApi();
      setQuestions(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải câu hỏi.');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadQuestions(), loadCourses(), loadQuizzes()]);
    };

    bootstrap();
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

  const resetQuizDraft = () => {
    setQuizDraft(createEmptyQuizDraft());
  };

  const addOrUpdateQuestion = async () => {
    const questionText = draft.questionText.trim();
    const normalizedOptions = draft.options.map((item) => item.trim()).filter(Boolean);
    const hasEnoughOptions = normalizedOptions.length >= 2;

    if (!questionText || !hasEnoughOptions) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập nội dung câu hỏi và ít nhất 2 đáp án.');
      return;
    }

    const preservedCorrectValue = draft.options[draft.correctIndex]?.trim();
    const normalizedCorrectIndex = Math.max(normalizedOptions.indexOf(preservedCorrectValue), 0);

    const payload = {
      questionText,
      options: normalizedOptions,
      correctIndex: normalizedCorrectIndex,
    };

    try {
      if (editingId) {
        await updateQuestionApi(editingId, payload);
        // eslint-disable-next-line no-alert
        alert('Đã cập nhật câu hỏi.');
      } else {
        await createQuestionApi(payload);
        // eslint-disable-next-line no-alert
        alert('Đã thêm câu hỏi mới.');
      }

      await loadQuestions();
      resetDraft();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.response?.data?.message || (editingId ? 'Không thể cập nhật câu hỏi.' : 'Không thể thêm câu hỏi.'));
    }
  };

  const startEditQuestion = (id) => {
    const question = questions.find((item) => item.id === id);
    if (!question) return;

    setEditingId(id);
    setDraft({
      questionText: question.questionText || '',
      options: Array.isArray(question.options) && question.options.length ? question.options : ['', '', '', ''],
      correctIndex: Number.isInteger(question.correctIndex) ? question.correctIndex : 0,
    });
  };

  const deleteQuestion = async (id) => {
    try {
      await deleteQuestionApi(id);
      setQuestions((previous) => previous.filter((q) => q.id !== id));
      if (editingId === id) {
        resetDraft();
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.response?.data?.message || 'Không thể xóa câu hỏi.');
    }
  };

  const handleSelectCourse = async (courseId) => {
    setSelectedCourseId(String(courseId));
    await loadChapters(courseId);
  };

  const handleCreateQuiz = async () => {
    const title = quizDraft.title.trim();
    if (!selectedCourseId) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng chọn khóa học cho quiz.');
      return;
    }

    if (!title) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập tên quiz.');
      return;
    }

    try {
      await createQuizApi({
        courseId: Number(selectedCourseId),
        chapterId: quizDraft.chapterId ? Number(quizDraft.chapterId) : undefined,
        title,
        description: quizDraft.description.trim(),
        duration: Number(quizDraft.duration || 45),
        passScore: Number(quizDraft.passScore || 70),
        maxAttempts: Number(quizDraft.maxAttempts || 3),
      });
      resetQuizDraft();
      await loadQuizzes();
      // eslint-disable-next-line no-alert
      alert('Đã tạo quiz mới.');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.response?.data?.message || 'Không thể tạo quiz.');
    }
  };

  const handlePublishQuiz = async (quizId) => {
    try {
      await httpClient.post(`/quiz-manager/${quizId}/publish`);
      await loadQuizzes();
      // eslint-disable-next-line no-alert
      alert('Đã xuất bản quiz.');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.response?.data?.message || 'Không thể xuất bản quiz.');
    }
  };

  return (
    <div className="instructor-question-bank-page">
      <TeacherSidebar />

      <main className="instructor-question-bank-main-content">
        <header className="instructor-question-bank-page-header">
          <h1 className="instructor-question-bank-page-title">Quản lý Ngân hàng câu hỏi</h1>
        </header>

        {error ? (
          <section className="instructor-question-bank-card" style={{ color: 'red' }}>
            <p>Lỗi: {error}</p>
          </section>
        ) : null}

        {quizError ? (
          <section className="instructor-question-bank-card" style={{ color: 'red' }}>
            <p>Lỗi quiz: {quizError}</p>
          </section>
        ) : null}

        <section className="instructor-question-bank-card highlighted">
          <h2 className="instructor-question-bank-card-title">
            {editingId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
          </h2>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="question-content">
              Nội dung câu hỏi
            </label>
            <textarea
              className="instructor-question-bank-form-control"
              id="question-content"
              onChange={(event) => setDraft((previous) => ({ ...previous, questionText: event.target.value }))}
              placeholder="Nhập nội dung câu hỏi tại đây..."
              value={draft.questionText}
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
                  placeholder={`Nhập đáp án ${String.fromCharCode(65 + index)}`}
                  type="text"
                  value={option}
                />
              </label>
            ))}
          </div>

          <div className="instructor-question-bank-actions">
            <button className="instructor-question-bank-btn instructor-question-bank-btn-success" onClick={addOrUpdateQuestion} type="button">
              {editingId ? 'Cập nhật câu hỏi' : '+ Thêm câu hỏi'}
            </button>
            {editingId ? (
              <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={resetDraft} type="button">
                Hủy sửa
              </button>
            ) : null}
          </div>
        </section>

        <section className="instructor-question-bank-card">
          <h2 className="instructor-question-bank-card-title">Tạo quiz</h2>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-course">Chọn khóa học</label>
            <select
              className="instructor-question-bank-form-control"
              id="quiz-course"
              value={selectedCourseId}
              onChange={async (event) => handleSelectCourse(event.target.value)}
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-chapter">Chương (không bắt buộc)</label>
            <select
              className="instructor-question-bank-form-control"
              id="quiz-chapter"
              value={quizDraft.chapterId || ''}
              onChange={(event) => setQuizDraft((previous) => ({ ...previous, chapterId: event.target.value }))}
            >
              <option value="">-- Theo toàn khóa học --</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-title">Tên quiz</label>
            <input
              className="instructor-question-bank-form-control"
              id="quiz-title"
              value={quizDraft.title}
              onChange={(event) => setQuizDraft((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Ví dụ: Quiz chương 1"
            />
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-description">Mô tả</label>
            <textarea
              className="instructor-question-bank-form-control"
              id="quiz-description"
              value={quizDraft.description}
              onChange={(event) => setQuizDraft((previous) => ({ ...previous, description: event.target.value }))}
            />
          </div>

          <div className="instructor-question-bank-options-list" style={{ gap: '12px' }}>
            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-duration">Thời gian (phút)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-duration"
                type="number"
                value={quizDraft.duration}
                onChange={(event) => setQuizDraft((previous) => ({ ...previous, duration: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-pass-score">Điểm đạt (%)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-pass-score"
                type="number"
                value={quizDraft.passScore}
                onChange={(event) => setQuizDraft((previous) => ({ ...previous, passScore: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-max-attempts">Số lần làm</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-max-attempts"
                type="number"
                value={quizDraft.maxAttempts}
                onChange={(event) => setQuizDraft((previous) => ({ ...previous, maxAttempts: event.target.value }))}
              />
            </div>
          </div>

          <div className="instructor-question-bank-actions">
            <button className="instructor-question-bank-btn instructor-question-bank-btn-success" onClick={handleCreateQuiz} type="button">
              Tạo quiz
            </button>
            <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={resetQuizDraft} type="button">
              Làm mới
            </button>
          </div>
        </section>

        <section className="instructor-question-bank-card">
          <h2 className="instructor-question-bank-card-title">Danh sách quiz của tôi</h2>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <label style={{ marginRight: 6 }}>Chọn quiz để gắn câu hỏi:</label>
            <select
              value={selectedQuizForAttach}
              onChange={(e) => setSelectedQuizForAttach(e.target.value)}
              style={{ padding: '6px 8px' }}
            >
              <option value="">-- Chọn quiz --</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
            <button
              className="instructor-question-bank-btn instructor-question-bank-btn-primary"
              type="button"
              onClick={handleAttachSelectedQuestions}
              disabled={isAttaching}
            >
              {isAttaching ? 'Đang gắn...' : 'Gắn câu hỏi đã chọn'}
            </button>
          </div>

          {isLoadingQuizzes ? <p>Đang tải danh sách quiz...</p> : null}

          <div className="instructor-question-bank-question-list">
            {quizzes.map((quiz) => (
              <article className="instructor-question-bank-q-item" key={quiz.id}>
                <div className="instructor-question-bank-q-content">
                  <h4>{quiz.title}</h4>
                  <span className="instructor-question-bank-q-correct">
                    Khóa học: {quiz.course?.title || quiz.courseTitle || 'N/A'} · Trạng thái: {quiz.isPublished ? 'Đã xuất bản' : 'Nháp'}
                  </span>
                </div>

                <div className="instructor-question-bank-q-actions">
                  {!quiz.isPublished ? (
                    <button className="instructor-question-bank-btn-icon edit" onClick={() => handlePublishQuiz(quiz.id)} title="Xuất bản" type="button">
                      P
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!quizzes.length && !isLoadingQuizzes ? <p>Chưa có quiz nào.</p> : null}
          </div>
        </section>

        <section className="instructor-question-bank-card">
          <h2 className="instructor-question-bank-card-title">Danh sách câu hỏi đã thêm ({questionCount})</h2>

          {isLoading ? <p>Đang tải dữ liệu từ CSDL...</p> : null}

          <div className="instructor-question-bank-question-list">
            {questions.map((question, index) => (
              <article className="instructor-question-bank-q-item" key={question.id}>
                <div className="instructor-question-bank-q-content">
                  <h4>
                    {index + 1}. {question.questionText || question.content || 'Không có nội dung'}
                  </h4>
                  <span className="instructor-question-bank-q-correct">
                    Đáp án đúng:{' '}
                    {Array.isArray(question.options) && question.options[question.correctIndex]
                      ? `${String.fromCharCode(65 + Number(question.correctIndex || 0))}. ${question.options[question.correctIndex]}`
                      : 'Chưa thiết lập'}
                  </span>
                </div>

                <div className="instructor-question-bank-q-actions">
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(question.id)}
                      onChange={() => toggleQuestionSelection(question.id)}
                    />
                    <span style={{ fontSize: 12 }}>Chọn</span>
                  </label>

                  <button className="instructor-question-bank-btn-icon edit" onClick={() => startEditQuestion(question.id)} title="Sửa" type="button">
                    E
                  </button>
                  <button className="instructor-question-bank-btn-icon delete" onClick={() => deleteQuestion(question.id)} title="Xóa" type="button">
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
