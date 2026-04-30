import { useEffect, useMemo, useState } from 'react';
import httpClient from '../../api/httpClient';
import {
  createQuestionApi,
  createQuizApi,
  deleteQuestionApi,
  fetchQuestionsApi,
  fetchTeacherQuizzesApi,
  getCourseChaptersApi,
  updateQuestionApi,
} from '../../api/teacherManagementApi';
import TeacherSidebar from '../../components/TeacherSidebar';

import './ManHinhQuanLyNganHangCauhoi.css';

const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
};

const QUIZ_PRESETS = [
  {
    label: 'Mặc định 3-3-3-1',
    value: {
      multipleChoiceCount: '3',
      trueFalseCount: '3',
      shortAnswerCount: '3',
      essayCount: '1',
    },
  },
  {
    label: 'Trắc nghiệm nhiều hơn 5-3-1-1',
    value: {
      multipleChoiceCount: '5',
      trueFalseCount: '3',
      shortAnswerCount: '1',
      essayCount: '1',
    },
  },
  {
    label: 'Ngắn gọn 2-2-2-1',
    value: {
      multipleChoiceCount: '2',
      trueFalseCount: '2',
      shortAnswerCount: '2',
      essayCount: '1',
    },
  },
];

const QUIZ_QUOTA_STORAGE_KEY = 'teacher-quiz-quota-defaults';

const parseJson = (value, fallback = {}) => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }
  return value;
};

const createEmptyDraft = () => ({
  type: 'MULTIPLE_CHOICE',
  content: '',
  difficulty: 'MEDIUM',
  isPublished: false,
  options: ['', '', '', ''],
  correctIndices: [0],
  explanation: '',
  correctAnswer: true,
  acceptedAnswersText: '',
  caseSensitive: false,
  fuzzyMatch: true,
  instructions: '',
  rubric: [
    { name: 'Nội dung', weight: 40, description: '' },
    { name: 'Lập luận', weight: 30, description: '' },
    { name: 'Ngôn ngữ', weight: 30, description: '' },
  ],
  wordLimitMin: 100,
  wordLimitMax: 400,
  aiModel: 'gpt-3.5-turbo',
});

const createEmptyQuizDraft = () => ({
  title: '',
  description: '',
  chapterId: '',
  duration: '45',
  passScore: '70',
  maxAttempts: '0',
  multipleChoiceCount: '3',
  trueFalseCount: '3',
  shortAnswerCount: '3',
  essayCount: '1',
});

function ManHinhQuanLyNganHangCauhoi() {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'quizzes'
  const [draft, setDraft] = useState(createEmptyDraft());
  const [quizDraft, setQuizDraft] = useState(createEmptyQuizDraft());
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [error, setError] = useState('');
  const [quizError, setQuizError] = useState('');

  const questionCount = useMemo(() => questions.length, [questions]);

  const quizQuestionTotal = useMemo(() => (
    Number(quizDraft.multipleChoiceCount || 0)
    + Number(quizDraft.trueFalseCount || 0)
    + Number(quizDraft.shortAnswerCount || 0)
    + Number(quizDraft.essayCount || 0)
  ), [quizDraft]);

  useEffect(() => {
    try {
      const savedQuota = window.localStorage.getItem(QUIZ_QUOTA_STORAGE_KEY);
      if (!savedQuota) {
        return;
      }

      const parsedQuota = JSON.parse(savedQuota);
      if (!parsedQuota || typeof parsedQuota !== 'object') {
        return;
      }

      setQuizDraft((prev) => ({
        ...prev,
        multipleChoiceCount: String(parsedQuota.multipleChoiceCount ?? prev.multipleChoiceCount),
        trueFalseCount: String(parsedQuota.trueFalseCount ?? prev.trueFalseCount),
        shortAnswerCount: String(parsedQuota.shortAnswerCount ?? prev.shortAnswerCount),
        essayCount: String(parsedQuota.essayCount ?? prev.essayCount),
      }));
    } catch (_error) {
      window.localStorage.removeItem(QUIZ_QUOTA_STORAGE_KEY);
    }
  }, []);

  const loadChapters = async (courseId) => {
    if (!courseId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    const items = await getCourseChaptersApi(courseId);
    const nextChapters = Array.isArray(items) ? items : [];
    setChapters(nextChapters);
    setSelectedChapterId((previous) => {
      const stillExists = nextChapters.some((chapter) => String(chapter.id) === String(previous));
      if (stillExists) {
        return previous;
      }
      return nextChapters.length > 0 ? String(nextChapters[0].id) : '';
    });
    return nextChapters;
  };

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

  const loadQuestions = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!selectedCourseId) {
        setQuestions([]);
        return;
      }

      const items = await fetchQuestionsApi({
        courseId: Number(selectedCourseId),
        chapterId: selectedChapterId ? Number(selectedChapterId) : undefined,
      });
      setQuestions(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải câu hỏi.');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadCourses(), loadQuizzes()]);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedCourseId, selectedChapterId]);

  const handleOptionChange = (index, value) => {
    setDraft((prev) => {
      const nextOptions = [...prev.options];
      nextOptions[index] = value;
      return { ...prev, options: nextOptions };
    });
  };

  const toggleCorrectIndex = (index) => {
    setDraft((prev) => {
      const exists = prev.correctIndices.includes(index);
      const next = exists
        ? prev.correctIndices.filter((item) => item !== index)
        : [...prev.correctIndices, index];
      return {
        ...prev,
        correctIndices: next.length ? next : [index],
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

  const createQuestionPayload = () => {
    const content = draft.content.trim();
    if (!content) {
      throw new Error('Vui lòng nhập nội dung câu hỏi.');
    }
    if (!selectedCourseId) {
      throw new Error('Vui lòng chọn khóa học trước khi tạo câu hỏi.');
    }
    if (!selectedChapterId) {
      throw new Error('Vui lòng chọn chương trước khi tạo câu hỏi.');
    }

    const base = {
      type: draft.type,
      content,
      difficulty: draft.difficulty,
      courseId: Number(selectedCourseId),
      chapterId: selectedChapterId ? Number(selectedChapterId) : undefined,
      isPublished: draft.isPublished,
    };

    if (draft.type === 'MULTIPLE_CHOICE') {
      const pairs = draft.options
        .map((item, index) => ({ rawIndex: index, value: item.trim() }))
        .filter((item) => item.value);

      const options = pairs.map((item) => item.value);
      const correctIndices = pairs
        .map((item, index) => ({ index, isCorrect: draft.correctIndices.includes(item.rawIndex) }))
        .filter((item) => item.isCorrect)
        .map((item) => item.index);

      if (options.length < 2) {
        throw new Error('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án.');
      }
      if (!correctIndices.length) {
        throw new Error('Hãy chọn ít nhất 1 đáp án đúng.');
      }

      return {
        ...base,
        options,
        correctIndices,
        explanation: draft.explanation.trim() || undefined,
      };
    }

    if (draft.type === 'TRUE_FALSE') {
      return {
        ...base,
        correctAnswer: draft.correctAnswer,
        explanation: draft.explanation.trim() || undefined,
      };
    }

    if (draft.type === 'SHORT_ANSWER') {
      const acceptedAnswers = draft.acceptedAnswersText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!acceptedAnswers.length) {
        throw new Error('Câu trả lời ngắn cần ít nhất 1 đáp án chấp nhận.');
      }

      return {
        ...base,
        acceptedAnswers,
        caseSensitive: draft.caseSensitive,
        fuzzyMatch: draft.fuzzyMatch,
        explanation: draft.explanation.trim() || undefined,
      };
    }

    const rubric = draft.rubric
      .map((item) => ({
        name: item.name.trim(),
        weight: Number(item.weight),
        description: item.description.trim(),
      }))
      .filter((item) => item.name && item.description && Number.isFinite(item.weight));

    const totalWeight = rubric.reduce((sum, item) => sum + item.weight, 0);
    if (!rubric.length) {
      throw new Error('Câu tự luận cần ít nhất 1 tiêu chí hợp lệ.');
    }
    if (totalWeight !== 100) {
      throw new Error('Tổng trọng số rubric của ESSAY phải bằng 100.');
    }

    return {
      ...base,
      instructions: draft.instructions.trim(),
      rubric,
      wordLimit: {
        min: Number(draft.wordLimitMin),
        max: Number(draft.wordLimitMax),
      },
      aiModel: draft.aiModel,
    };
  };

  const addOrUpdateQuestion = async () => {
    try {
      const payload = createQuestionPayload();

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
      alert(err?.response?.data?.message || err.message || 'Không thể lưu câu hỏi.');
    }
  };

  const startEditQuestion = async (id) => {
    const question = questions.find((item) => item.id === id);
    if (!question) {
      return;
    }

    const metadata = parseJson(question.metadata, {});
    const type = QUESTION_TYPES.includes(question.type) ? question.type : 'MULTIPLE_CHOICE';

    setEditingId(id);
    if (question.courseId) {
      setSelectedCourseId(String(question.courseId));
      await loadChapters(question.courseId);
    }
    if (question.chapterId != null) {
      setSelectedChapterId(String(question.chapterId));
    }

    setDraft({
      ...createEmptyDraft(),
      type,
      content: question.content || question.questionText || '',
      difficulty: String(question.difficulty || 'MEDIUM').toUpperCase(),
      isPublished: Boolean(question.isPublished),
      options: metadata.options || question.options || ['', '', '', ''],
      correctIndices: metadata.correctIndices || (Number.isInteger(question.correctIndex) ? [question.correctIndex] : [0]),
      explanation: metadata.explanation || question.explanation || '',
      correctAnswer: metadata.correctAnswer === true,
      acceptedAnswersText: Array.isArray(metadata.acceptedAnswers) ? metadata.acceptedAnswers.join('\n') : '',
      caseSensitive: metadata.caseSensitive === true,
      fuzzyMatch: metadata.fuzzyMatch !== false,
      instructions: metadata.instructions || '',
      rubric: Array.isArray(metadata.rubric) && metadata.rubric.length ? metadata.rubric : createEmptyDraft().rubric,
      wordLimitMin: Number(metadata.wordLimit?.min ?? 100),
      wordLimitMax: Number(metadata.wordLimit?.max ?? 400),
      aiModel: metadata.aiModel || 'gpt-3.5-turbo',
    });
  };

  const deleteQuestion = async (id) => {
    try {
      await deleteQuestionApi(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
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
    const totalQuota = quizQuestionTotal;
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
    if (totalQuota <= 0) {
      // eslint-disable-next-line no-alert
      alert('Tổng số câu quiz phải lớn hơn 0.');
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
        maxAttempts: Number(quizDraft.maxAttempts || 0),
        questionQuotas: {
          multipleChoice: Number(quizDraft.multipleChoiceCount || 0),
          trueFalse: Number(quizDraft.trueFalseCount || 0),
          shortAnswer: Number(quizDraft.shortAnswerCount || 0),
          essay: Number(quizDraft.essayCount || 0),
        },
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

  const updateRubricItem = (index, field, value) => {
    setDraft((prev) => {
      const next = [...prev.rubric];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, rubric: next };
    });
  };

  const addRubricItem = () => {
    setDraft((prev) => ({
      ...prev,
      rubric: [...prev.rubric, { name: '', weight: 0, description: '' }],
    }));
  };

  const removeRubricItem = (index) => {
    setDraft((prev) => ({
      ...prev,
      rubric: prev.rubric.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const applyQuizPreset = (preset) => {
    setQuizDraft((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  const saveQuizQuotaDefaults = () => {
    const defaults = {
      multipleChoiceCount: quizDraft.multipleChoiceCount,
      trueFalseCount: quizDraft.trueFalseCount,
      shortAnswerCount: quizDraft.shortAnswerCount,
      essayCount: quizDraft.essayCount,
    };

    window.localStorage.setItem(QUIZ_QUOTA_STORAGE_KEY, JSON.stringify(defaults));
    // eslint-disable-next-line no-alert
    alert('Đã lưu preset quota mặc định.');
  };

  const clearQuizQuotaDefaults = () => {
    window.localStorage.removeItem(QUIZ_QUOTA_STORAGE_KEY);
    setQuizDraft((prev) => ({
      ...prev,
      multipleChoiceCount: '3',
      trueFalseCount: '3',
      shortAnswerCount: '3',
      essayCount: '1',
    }));
    // eslint-disable-next-line no-alert
    alert('Đã xóa preset quota mặc định.');
  };

  const renderTypeSpecificForm = () => {
    if (draft.type === 'MULTIPLE_CHOICE') {
      return (
        <>
          <label className="instructor-question-bank-form-label">Các lựa chọn đáp án (có thể chọn nhiều đáp án đúng)</label>
          <div className="instructor-question-bank-options-list">
            {draft.options.map((option, index) => (
              <label className="instructor-question-bank-option-row" key={`option-${index + 1}`}>
                <input
                  checked={draft.correctIndices.includes(index)}
                  className="instructor-question-bank-option-radio"
                  onChange={() => toggleCorrectIndex(index)}
                  type="checkbox"
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
        </>
      );
    }

    if (draft.type === 'TRUE_FALSE') {
      return (
        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label" htmlFor="tf-answer">Đáp án đúng</label>
          <select
            className="instructor-question-bank-form-control"
            id="tf-answer"
            value={String(draft.correctAnswer)}
            onChange={(event) => setDraft((prev) => ({ ...prev, correctAnswer: event.target.value === 'true' }))}
          >
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
            <textarea
              className="instructor-question-bank-form-control"
              id="sa-answers"
              value={draft.acceptedAnswersText}
              onChange={(event) => setDraft((prev) => ({ ...prev, acceptedAnswersText: event.target.value }))}
            />
          </div>
          <div className="instructor-question-bank-options-list" style={{ gap: 12 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={draft.caseSensitive}
                onChange={(event) => setDraft((prev) => ({ ...prev, caseSensitive: event.target.checked }))}
              />
              <span>Phân biệt chữ hoa/thường</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={draft.fuzzyMatch}
                onChange={(event) => setDraft((prev) => ({ ...prev, fuzzyMatch: event.target.checked }))}
              />
              <span>Khớp mềm (fuzzy match)</span>
            </label>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label" htmlFor="essay-instructions">Hướng dẫn bài viết</label>
          <textarea
            className="instructor-question-bank-form-control"
            id="essay-instructions"
            value={draft.instructions}
            onChange={(event) => setDraft((prev) => ({ ...prev, instructions: event.target.value }))}
          />
        </div>

        <div className="instructor-question-bank-options-list" style={{ gap: '12px' }}>
          <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
            <label className="instructor-question-bank-form-label" htmlFor="essay-word-min">Số từ tối thiểu</label>
            <input
              className="instructor-question-bank-form-control"
              id="essay-word-min"
              type="number"
              min="0"
              value={draft.wordLimitMin}
              onChange={(event) => setDraft((prev) => ({ ...prev, wordLimitMin: event.target.value }))}
            />
          </div>
          <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
            <label className="instructor-question-bank-form-label" htmlFor="essay-word-max">Số từ tối đa</label>
            <input
              className="instructor-question-bank-form-control"
              id="essay-word-max"
              type="number"
              min="1"
              value={draft.wordLimitMax}
              onChange={(event) => setDraft((prev) => ({ ...prev, wordLimitMax: event.target.value }))}
            />
          </div>
          <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
            <label className="instructor-question-bank-form-label" htmlFor="essay-model">Mô hình AI</label>
            <select
              className="instructor-question-bank-form-control"
              id="essay-model"
              value={draft.aiModel}
              onChange={(event) => setDraft((prev) => ({ ...prev, aiModel: event.target.value }))}
            >
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              <option value="gpt-4">gpt-4</option>
              <option value="gpt-4o">gpt-4o</option>
            </select>
          </div>
        </div>

        <div className="instructor-question-bank-form-group">
          <label className="instructor-question-bank-form-label">Rubric</label>
          {draft.rubric.map((item, index) => (
            <div className="instructor-question-bank-q-item" key={`rubric-${index + 1}`}>
              <div className="instructor-question-bank-q-content" style={{ width: '100%' }}>
                <input
                  className="instructor-question-bank-form-control"
                  placeholder="Tên tiêu chí"
                  value={item.name}
                  onChange={(event) => updateRubricItem(index, 'name', event.target.value)}
                />
                <input
                  className="instructor-question-bank-form-control"
                  style={{ marginTop: 10 }}
                  type="number"
                  placeholder="Trọng số"
                  value={item.weight}
                  onChange={(event) => updateRubricItem(index, 'weight', event.target.value)}
                />
                <textarea
                  className="instructor-question-bank-form-control"
                  style={{ marginTop: 10 }}
                  placeholder="Mô tả tiêu chí"
                  value={item.description}
                  onChange={(event) => updateRubricItem(index, 'description', event.target.value)}
                />
              </div>
              <div className="instructor-question-bank-q-actions">
                {draft.rubric.length > 1 ? (
                  <button className="instructor-question-bank-btn-icon delete" type="button" onClick={() => removeRubricItem(index)}>
                    D
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" type="button" onClick={addRubricItem}>
            + Thêm mục đánh giá
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="instructor-question-bank-page">
      <TeacherSidebar />

      <main className="instructor-question-bank-main-content">
        <header className="instructor-question-bank-page-header">
          <h1 className="instructor-question-bank-page-title">Quản lý Bài Học</h1>
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('questions')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'questions' ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === 'questions' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'questions' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              📚 Ngân hàng Câu hỏi
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'quizzes' ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === 'quizzes' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'quizzes' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              🎓 Quản lý Bài Kiểm Tra
            </button>
          </div>
        </header>

        {/* Common error display */}
        {error && activeTab === 'questions' ? (
          <section className="instructor-question-bank-card" style={{ color: 'red' }}>
            <p>Lỗi: {error}</p>
          </section>
        ) : null}

        {quizError && activeTab === 'quizzes' ? (
          <section className="instructor-question-bank-card" style={{ color: 'red' }}>
            <p>Lỗi quiz: {quizError}</p>
          </section>
        ) : null}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <>
            <section className="instructor-question-bank-card" style={{ marginBottom: 16, marginTop: 16 }}>
              <p style={{ margin: 0 }}>
                Đang xem ngân hàng câu hỏi của khóa học{' '}
                <strong>{courses.find((course) => String(course.id) === String(selectedCourseId))?.title || 'chưa chọn'}</strong>
                {' '}và chương{' '}
                <strong>{chapters.find((chapter) => String(chapter.id) === String(selectedChapterId))?.title || 'chưa chọn'}</strong>.
              </p>
            </section>

            <section className="instructor-question-bank-card highlighted">
              <h2 className="instructor-question-bank-card-title">{editingId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}</h2>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-course">Khóa học</label>
            <select
              className="instructor-question-bank-form-control"
              id="quiz-course"
              value={selectedCourseId}
              onChange={async (event) => handleSelectCourse(event.target.value)}
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="question-chapter">Chương</label>
            <select
              className="instructor-question-bank-form-control"
              id="question-chapter"
              value={selectedChapterId}
              onChange={(event) => setSelectedChapterId(event.target.value)}
              disabled={!chapters.length}
            >
              <option value="">-- Chọn chương --</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
              ))}
            </select>
          </div>

          <div className="instructor-question-bank-options-list" style={{ gap: '12px' }}>
            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="question-type">Loại câu hỏi</label>
              <select
                className="instructor-question-bank-form-control"
                id="question-type"
                value={draft.type}
                onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="question-difficulty">Độ khó</label>
              <select
                className="instructor-question-bank-form-control"
                id="question-difficulty"
                value={draft.difficulty}
                onChange={(event) => setDraft((prev) => ({ ...prev, difficulty: event.target.value }))}
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="question-content">Nội dung câu hỏi</label>
            <textarea
              className="instructor-question-bank-form-control"
              id="question-content"
              onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Nhập nội dung câu hỏi..."
              value={draft.content}
            />
          </div>

          {renderTypeSpecificForm()}

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="question-explanation">Giải thích (không bắt buộc)</label>
            <textarea
              className="instructor-question-bank-form-control"
              id="question-explanation"
              onChange={(event) => setDraft((prev) => ({ ...prev, explanation: event.target.value }))}
              value={draft.explanation}
            />
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(event) => setDraft((prev) => ({ ...prev, isPublished: event.target.checked }))}
            />
            <span>Công khai câu hỏi ngay sau khi lưu</span>
          </label>

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
          <h2 className="instructor-question-bank-card-title">Danh sách câu hỏi đã thêm ({questionCount})</h2>

          {isLoading ? <p>Đang tải dữ liệu từ CSDL...</p> : null}

          <div className="instructor-question-bank-question-list">
            {questions.map((question, index) => {
              const metadata = parseJson(question.metadata, {});
              const type = question.type || 'MULTIPLE_CHOICE';
              let answerPreview = 'Chưa thiết lập';

              if (type === 'MULTIPLE_CHOICE') {
                answerPreview = `Chỉ số đúng: ${(metadata.correctIndices || []).join(', ')}`;
              } else if (type === 'TRUE_FALSE') {
                answerPreview = `Đáp án đúng: ${metadata.correctAnswer ? 'Đúng' : 'Sai'}`;
              } else if (type === 'SHORT_ANSWER') {
                answerPreview = `Chấp nhận: ${(metadata.acceptedAnswers || []).join(' | ')}`;
              } else if (type === 'ESSAY') {
                answerPreview = `Mục đánh giá: ${(metadata.rubric || []).length}`;
              }

              return (
                <article className="instructor-question-bank-q-item" key={question.id}>
                  <div className="instructor-question-bank-q-content">
                    <h4>{index + 1}. {question.content || question.questionText || 'Không có nội dung'}</h4>
                    <span className="instructor-question-bank-q-correct">{QUESTION_TYPE_LABELS[type]} · {answerPreview}</span>
                  </div>

                  <div className="instructor-question-bank-q-actions">
                    <button className="instructor-question-bank-btn-icon edit" onClick={() => startEditQuestion(question.id)} title="Sửa" type="button">E</button>
                    <button className="instructor-question-bank-btn-icon delete" onClick={() => deleteQuestion(question.id)} title="Xóa" type="button">D</button>
                  </div>
                </article>
              );
            })}
            {!questions.length && !isLoading ? <p>Chưa có câu hỏi nào.</p> : null}
          </div>
        </section>
          </>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <>
            <section className="instructor-question-bank-card" style={{ marginBottom: 16, marginTop: 16 }}>
              <p style={{ margin: 0 }}>
                Quản lý các bài kiểm tra của khóa học{' '}
                <strong>{courses.find((course) => String(course.id) === String(selectedCourseId))?.title || 'chưa chọn'}</strong>.
              </p>
            </section>

            <section className="instructor-question-bank-card highlighted">
              <h2 className="instructor-question-bank-card-title">Tạo bài kiểm tra mới</h2>
          <p style={{ marginTop: -4, marginBottom: 16, color: '#6b7280' }}>
            Quiz sẽ tự động lấy 10 câu hỏi ngẫu nhiên từ ngân hàng của chương đã chọn theo tỷ lệ 3 trắc nghiệm, 3 đúng/sai, 3 trả lời ngắn và 1 tự luận.
          </p>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-chapter">Chương</label>
            <select
              className="instructor-question-bank-form-control"
              id="quiz-chapter"
              value={quizDraft.chapterId || ''}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, chapterId: event.target.value }))}
            >
              <option value="">-- Chọn chương --</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
              ))}
            </select>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-title">Tên quiz</label>
            <input
              className="instructor-question-bank-form-control"
              id="quiz-title"
              value={quizDraft.title}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label">Preset quota nhanh</label>
            <div className="instructor-question-bank-options-list" style={{ gap: 8, flexWrap: 'wrap' }}>
              {QUIZ_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="instructor-question-bank-btn instructor-question-bank-btn-primary"
                  type="button"
                  onClick={() => applyQuizPreset(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              className="instructor-question-bank-btn instructor-question-bank-btn-success"
              style={{ marginTop: 10, width: 'fit-content' }}
              type="button"
              onClick={saveQuizQuotaDefaults}
            >
              Lưu preset mặc định của tôi
            </button>
            <button
              className="instructor-question-bank-btn instructor-question-bank-btn-primary"
              style={{ marginTop: 10, marginLeft: 8, width: 'fit-content' }}
              type="button"
              onClick={clearQuizQuotaDefaults}
            >
              Xóa preset mặc định
            </button>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-description">Mô tả</label>
            <textarea
              className="instructor-question-bank-form-control"
              id="quiz-description"
              value={quizDraft.description}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, description: event.target.value }))}
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
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, duration: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-pass-score">Điểm đạt (%)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-pass-score"
                type="number"
                value={quizDraft.passScore}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, passScore: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-max-attempts">Số lần làm (0 = vô hạn)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-max-attempts"
                type="number"
                min="0"
                value={quizDraft.maxAttempts}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, maxAttempts: event.target.value }))}
              />
            </div>
          </div>

          <div className="instructor-question-bank-options-list" style={{ gap: '12px', marginTop: 12 }}>
            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-mc-count">Số câu trắc nghiệm</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-mc-count"
                min="0"
                type="number"
                value={quizDraft.multipleChoiceCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, multipleChoiceCount: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-tf-count">Số câu đúng/sai</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-tf-count"
                min="0"
                type="number"
                value={quizDraft.trueFalseCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, trueFalseCount: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-sa-count">Số câu trả lời ngắn</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-sa-count"
                min="0"
                type="number"
                value={quizDraft.shortAnswerCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, shortAnswerCount: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-essay-count">Số câu tự luận</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-essay-count"
                min="0"
                type="number"
                value={quizDraft.essayCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, essayCount: event.target.value }))}
              />
            </div>
          </div>

          <p style={{ marginTop: 8, marginBottom: 0, color: '#6b7280' }}>
            Tổng số câu quiz sẽ lấy tự động: {quizQuestionTotal}.
          </p>

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
          <h2 className="instructor-question-bank-card-title">Danh sách bài kiểm tra của tôi</h2>
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
                      Xuất bản
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!quizzes.length && !isLoadingQuizzes ? <p>Chưa có quiz nào.</p> : null}
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}

export default ManHinhQuanLyNganHangCauhoi;
