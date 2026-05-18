import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import QuestionFormModal from '../../components/QuestionFormModal';
import SelectQuestionsModal from '../../components/SelectQuestionsModal';
import {
  fetchQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  updateLessonSegmentApi,
} from '../../api/teacherManagementApi';
import { uploadTeacherFileApi } from '../../api/teacherApi';
import './SegmentDetailView.css';

const SEGMENT_CONTENT_META = {
  text: { icon: '📝', title: 'Text', color: '#3498db' },
  document: { icon: '📎', title: 'Tài liệu', color: '#e74c3c' },
  question: { icon: '❓', title: 'Câu hỏi', color: '#f39c12' },
  quiz: { icon: '🧪', title: 'Bài tập', color: '#9b59b6' },
  videoClip: { icon: '🎬', title: 'Video Clip', color: '#1abc9c' },
};

const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
};

const createEmptyQuestionDraft = () => ({
  type: 'MULTIPLE_CHOICE',
  content: '',
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

const createEmptyContentItem = (type = 'text', orderIndex = 1) => ({
  type,
  title: '',
  content: '',
  resourceUrl: '',
  questionIds: [],
  questionTitles: [],
  randomize: false,
  randomCount: 0,
  startTime: '',
  endTime: '',
  orderIndex,
});

const normalizeContentItemForForm = (item, index) => ({
  type: item?.type || 'text',
  title: item?.title ?? '',
  content: item?.content ?? '',
  resourceUrl: item?.resourceUrl ?? '',
  questionIds: Array.isArray(item?.questionIds) ? item.questionIds : [],
  questionTitles: Array.isArray(item?.questionTitles) ? item.questionTitles : [],
  randomize: Boolean(item?.randomize),
  randomCount: Number(item?.randomCount || 0),
  startTime: item?.startTime ?? '',
  endTime: item?.endTime ?? '',
  orderIndex: Number.isInteger(Number(item?.orderIndex)) && Number(item.orderIndex) > 0
    ? Number(item.orderIndex)
    : index + 1,
});

const normalizeContentItemForPayload = (item, index) => ({
  type: item?.type || 'text',
  title: typeof item?.title === 'string' ? item.title.trim() : String(item?.title ?? '').trim(),
  content: typeof item?.content === 'string' ? item.content.trim() : String(item?.content ?? '').trim(),
  resourceUrl: typeof item?.resourceUrl === 'string' ? item.resourceUrl.trim() : '',
  questionIds: Array.isArray(item?.questionIds) ? item.questionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [],
  questionTitles: Array.isArray(item?.questionTitles) ? item.questionTitles.map((title) => String(title || '').trim()).filter(Boolean) : [],
  randomize: Boolean(item?.randomize),
  randomCount: Number(item?.randomCount || 0),
  ...(item?.startTime === '' || item?.startTime == null
    ? {}
    : { startTime: Number(item.startTime) }),
  ...(item?.endTime === '' || item?.endTime == null
    ? {}
    : { endTime: Number(item.endTime) }),
  orderIndex: index + 1,
});

function SegmentDetailView() {
  const { courseId, chapterId, lessonId, segmentId } = useParams();
  const navigate = useNavigate();
  const autoSaveTimerRef = useRef(null);
  const shouldSkipFirstAutoSaveRef = useRef(true);

  // State
  const [segment, setSegment] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [contentItems, setContentItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState(createEmptyQuestionDraft());
  const [questionEditingId, setQuestionEditingId] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [selectQuestionsModal, setSelectQuestionsModal] = useState({ open: false, itemIndex: null });

  const loadQuestions = async () => {
    if (!courseId || !chapterId || !lessonId || !segmentId) {
      setQuestions([]);
      return;
    }

    setQuestionLoading(true);
    setQuestionError('');

    try {
      const items = await fetchQuestionsApi({
        courseId: Number(courseId),
        chapterId: Number(chapterId),
        lectureId: Number(lessonId),
        segmentId: Number(segmentId),
      });

      setQuestions(Array.isArray(items) ? items : []);
    } catch (err) {
      setQuestionError(err?.response?.data?.message || 'Không thể tải danh sách câu hỏi.');
      setQuestions([]);
    } finally {
      setQuestionLoading(false);
    }
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load lesson details
        const lessonRes = await httpClient.get(`/lessons/${lessonId}`);
        setLesson(lessonRes.data?.data || {});

        // Load chapter
        const chapterRes = await httpClient.get(`/chapters/${chapterId}`);
        setChapter(chapterRes.data?.data || {});

        // Load course
        const courseRes = await httpClient.get(`/courses/${courseId}`);
        setCourse(courseRes.data?.data || {});

        // Load segment
        const segmentRes = await httpClient.get(`/lessons/${lessonId}/segments/${segmentId}`);
        const segmentData = segmentRes.data?.data || {};
        setSegment(segmentData);
        const initialItems = Array.isArray(segmentData.contentItems) && segmentData.contentItems.length > 0
          ? segmentData.contentItems.map((item, index) => normalizeContentItemForForm(item, index))
          : [createEmptyContentItem('text', 1)];
        setContentItems(initialItems);
        setCurrentItemIndex(0);
        shouldSkipFirstAutoSaveRef.current = true;
        await loadQuestions();
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err?.response?.data?.message || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, chapterId, lessonId, segmentId]);
  useEffect(() => {
    if (!segment || loading) {
      return undefined;
    }

    if (shouldSkipFirstAutoSaveRef.current) {
      shouldSkipFirstAutoSaveRef.current = false;
      return undefined;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const persistChanges = async () => {
        try {
          const payload = {
            title: segment.title,
            orderIndex: segment.orderIndex,
            contentItems: contentItems.map((item, index) => normalizeContentItemForPayload(item, index)),
          };

          await updateLessonSegmentApi(segmentId, payload);
          setSaveStatus('Đã đồng bộ tự động');
          setTimeout(() => setSaveStatus(''), 1800);
        } catch (err) {
          console.error('Auto save error:', err);
          setSaveStatus(err?.response?.data?.message || 'Không thể đồng bộ tự động');
        }
      };

      void persistChanges();
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [contentItems, loading, segment, segmentId]);

  // Handle thêm content item
  const handleAddContentItem = (type = 'text') => {
    const newItem = createEmptyContentItem(type, contentItems.length + 1);
    setContentItems([...contentItems, newItem]);
    if (type === 'quiz') {
      setTimeout(() => {
        setSelectQuestionsModal({ open: true, itemIndex: contentItems.length });
      }, 0);
    }
  };

  // Handle cập nhật content item
  const handleUpdateContentItem = (index, field, value) => {
    setContentItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle xóa content item
  const handleDeleteContentItem = (index) => {
    if (contentItems.length === 1) {
      alert('Phải có ít nhất một nội dung!');
      return;
    }
    setContentItems((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, orderIndex: idx + 1 }))
    );
    setCurrentItemIndex(Math.max(0, currentItemIndex - 1));
  };

  const handleAddQuestion = () => {
    setQuestionEditingId(null);
    setQuestionDraft(createEmptyQuestionDraft());
    setQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) {
      return;
    }

    try {
      await deleteQuestionApi(questionId);
      await loadQuestions();
      if (questionEditingId === questionId) {
        setQuestionEditingId(null);
        setQuestionDraft(createEmptyQuestionDraft());
        setQuestionModalOpen(false);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể xóa câu hỏi.');
    }
  };

  const startEditQuestion = (questionId) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) {
      return;
    }

    const metadata = parseJson(question.metadata, {});
    const type = QUESTION_TYPES.includes(question.type) ? question.type : 'MULTIPLE_CHOICE';

    setQuestionEditingId(questionId);
    setQuestionDraft({
      ...createEmptyQuestionDraft(),
      type,
      content: question.content || question.questionText || '',
      isPublished: Boolean(question.isPublished),
      options: metadata.options || question.options || ['', '', '', ''],
      correctIndices: metadata.correctIndices || (Number.isInteger(question.correctIndex) ? [question.correctIndex] : [0]),
      explanation: metadata.explanation || question.explanation || '',
      correctAnswer: metadata.correctAnswer === true,
      acceptedAnswersText: Array.isArray(metadata.acceptedAnswers) ? metadata.acceptedAnswers.join('\n') : '',
      caseSensitive: metadata.caseSensitive === true,
      fuzzyMatch: metadata.fuzzyMatch !== false,
      instructions: metadata.instructions || '',
      rubric: Array.isArray(metadata.rubric) && metadata.rubric.length ? metadata.rubric : createEmptyQuestionDraft().rubric,
      wordLimitMin: Number(metadata.wordLimit?.min ?? 100),
      wordLimitMax: Number(metadata.wordLimit?.max ?? 400),
      aiModel: metadata.aiModel || 'gpt-3.5-turbo',
    });
    setQuestionModalOpen(true);
  };

  const buildQuestionPayload = () => {
    const content = questionDraft.content.trim();

    if (!content) {
      throw new Error('Vui lòng nhập nội dung câu hỏi.');
    }

    const base = {
      type: questionDraft.type,
      content,
      courseId: Number(courseId),
      chapterId: Number(chapterId),
      lectureId: Number(lessonId),
      segmentId: Number(segmentId),
      isPublished: questionDraft.isPublished,
    };

    if (questionDraft.type === 'MULTIPLE_CHOICE') {
      const pairs = questionDraft.options
        .map((item, index) => ({ rawIndex: index, value: item.trim() }))
        .filter((item) => item.value);

      const options = pairs.map((item) => item.value);
      const selectedCorrectIndex = questionDraft.correctIndices[0];
      const correctIndices = pairs
        .map((item, index) => ({ index, isCorrect: item.rawIndex === selectedCorrectIndex }))
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
        explanation: questionDraft.explanation.trim() || undefined,
      };
    }

    if (questionDraft.type === 'TRUE_FALSE') {
      return {
        ...base,
        correctAnswer: questionDraft.correctAnswer,
        explanation: questionDraft.explanation.trim() || undefined,
      };
    }

    if (questionDraft.type === 'SHORT_ANSWER') {
      const acceptedAnswers = questionDraft.acceptedAnswersText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!acceptedAnswers.length) {
        throw new Error('Câu trả lời ngắn cần ít nhất 1 đáp án chấp nhận.');
      }

      return {
        ...base,
        acceptedAnswers,
        caseSensitive: questionDraft.caseSensitive,
        fuzzyMatch: questionDraft.fuzzyMatch,
        explanation: questionDraft.explanation.trim() || undefined,
      };
    }

    const rubric = questionDraft.rubric
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
      instructions: questionDraft.instructions.trim(),
      rubric,
      wordLimit: {
        min: Number(questionDraft.wordLimitMin),
        max: Number(questionDraft.wordLimitMax),
      },
      aiModel: questionDraft.aiModel,
    };
  };

  const handleSaveQuestion = async () => {
    try {
      const payload = buildQuestionPayload();

      if (questionEditingId) {
        await updateQuestionApi(questionEditingId, payload);
      } else {
        await createQuestionApi(payload);
      }

      setQuestionModalOpen(false);
      setQuestionEditingId(null);
      setQuestionDraft(createEmptyQuestionDraft());
      await loadQuestions();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Không thể lưu câu hỏi.');
    }
  };

  const renderQuestionTypeSpecificForm = () => {
    if (questionDraft.type === 'MULTIPLE_CHOICE') {
      return (
        <>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Các lựa chọn đáp án</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questionDraft.options.map((option, index) => (
              <label key={`question-option-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="radio"
                  name="question-correct-answer"
                  checked={questionDraft.correctIndices.includes(index)}
                  onChange={() => setQuestionDraft((prev) => ({ ...prev, correctIndices: [index] }))}
                />
                <span style={{ width: 22, fontWeight: 700 }}>{String.fromCharCode(65 + index)}</span>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={option}
                  onChange={(event) => {
                    const next = [...questionDraft.options];
                    next[index] = event.target.value;
                    setQuestionDraft((prev) => ({ ...prev, options: next }));
                  }}
                  placeholder={`Nhập đáp án ${String.fromCharCode(65 + index)}`}
                />
              </label>
            ))}
          </div>
        </>
      );
    }

    if (questionDraft.type === 'TRUE_FALSE') {
      return (
        <div className="form-group">
          <label>Đáp án đúng</label>
          <select
            className="form-input"
            value={String(questionDraft.correctAnswer)}
            onChange={(event) => setQuestionDraft((prev) => ({ ...prev, correctAnswer: event.target.value === 'true' }))}
          >
            <option value="true">Đúng</option>
            <option value="false">Sai</option>
          </select>
        </div>
      );
    }

    if (questionDraft.type === 'SHORT_ANSWER') {
      return (
        <>
          <div className="form-group">
            <label>Danh sách đáp án chấp nhận (mỗi dòng 1 đáp án)</label>
            <textarea
              className="form-textarea"
              value={questionDraft.acceptedAnswersText}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, acceptedAnswersText: event.target.value }))}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={questionDraft.caseSensitive}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, caseSensitive: event.target.checked }))}
            />
            <span>Phân biệt chữ hoa/thường</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={questionDraft.fuzzyMatch}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, fuzzyMatch: event.target.checked }))}
            />
            <span>Khớp mềm (fuzzy match)</span>
          </label>
        </>
      );
    }

    return (
      <>
        <div className="form-group">
          <label>Hướng dẫn bài viết</label>
          <textarea
            className="form-textarea"
            value={questionDraft.instructions}
            onChange={(event) => setQuestionDraft((prev) => ({ ...prev, instructions: event.target.value }))}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Số từ tối thiểu</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={questionDraft.wordLimitMin}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, wordLimitMin: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Số từ tối đa</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={questionDraft.wordLimitMax}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, wordLimitMax: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Mô hình AI</label>
            <select
              className="form-input"
              value={questionDraft.aiModel}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, aiModel: event.target.value }))}
            >
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              <option value="gpt-4">gpt-4</option>
              <option value="gpt-4o">gpt-4o</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Rubric</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questionDraft.rubric.map((item, index) => (
              <div key={`rubric-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 2fr', gap: 10 }}>
                <input
                  className="form-input"
                  placeholder="Tên tiêu chí"
                  value={item.name}
                  onChange={(event) => {
                    const next = [...questionDraft.rubric];
                    next[index] = { ...next[index], name: event.target.value };
                    setQuestionDraft((prev) => ({ ...prev, rubric: next }));
                  }}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Trọng số"
                  value={item.weight}
                  onChange={(event) => {
                    const next = [...questionDraft.rubric];
                    next[index] = { ...next[index], weight: event.target.value };
                    setQuestionDraft((prev) => ({ ...prev, rubric: next }));
                  }}
                />
                <textarea
                  className="form-textarea"
                  placeholder="Mô tả tiêu chí"
                  value={item.description}
                  onChange={(event) => {
                    const next = [...questionDraft.rubric];
                    next[index] = { ...next[index], description: event.target.value };
                    setQuestionDraft((prev) => ({ ...prev, rubric: next }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // Handle upload file
  const handleUploadFile = async (index) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
        setUploadMessage('');

        try {
          const response = await uploadTeacherFileApi(file);
          const fileUrl = response.data?.data?.fileUrl || '';

          handleUpdateContentItem(index, 'resourceUrl', fileUrl);
          setUploadMessage('✅ Upload thành công');
          setTimeout(() => setUploadMessage(''), 2000);
        } catch (uploadErr) {
          setUploadMessage('❌ Upload thất bại');
          console.error('Upload error:', uploadErr);
        } finally {
          setUploadingIndex(null);
        }
      };
      input.click();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage('❌ Lỗi');
    }
  };

  const buildSegmentSaveData = () => ({
    title: segment?.title,
    orderIndex: segment?.orderIndex,
    contentItems: contentItems.map((item, idx) => normalizeContentItemForPayload(item, idx)),
  });

  const persistSegmentChanges = async ({ successMessage = '✅ Lưu thành công!', shouldNavigate = true } = {}) => {
    if (!segment) return;

    try {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setIsSaving(true);

      await updateLessonSegmentApi(segmentId, buildSegmentSaveData());

      alert(successMessage);

      if (shouldNavigate) {
        navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuizItem = async () => {
    const quizItem = contentItems[currentItemIndex];

    if (!quizItem || quizItem.type !== 'quiz') {
      alert('Vui lòng chọn đúng nội dung bài tập để lưu.');
      return;
    }

    if (quizItem.randomize) {
      if (Number(quizItem.randomCount || 0) < 1) {
        alert('Hãy nhập số câu random hợp lệ trước khi lưu bài tập.');
        return;
      }
    } else if (!Array.isArray(quizItem.questionIds) || quizItem.questionIds.length === 0) {
      alert('Hãy chọn ít nhất một câu hỏi trước khi lưu bài tập.');
      return;
    }

    await persistSegmentChanges({
      successMessage: '✅ Đã lưu bài tập thành công!',
      shouldNavigate: false,
    });
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    await persistSegmentChanges({
      successMessage: '✅ Lưu thành công!',
      shouldNavigate: true,
    });
  };

  // Back button
  const handleGoBack = () => {
    navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  };

  const handleOpenQuestionManager = () => {
    // Navigate to the course-level question bank with filters for this chapter/lesson/segment
    const qs = new URLSearchParams();
    if (chapterId) qs.set('chapterId', String(chapterId));
    if (lessonId) qs.set('lectureId', String(lessonId));
    if (segmentId) qs.set('segmentId', String(segmentId));
    navigate(`/teacher/courses/${courseId}/question-bank?${qs.toString()}`);
  };

  // Navigation giữa các items
  const currentItem = contentItems[currentItemIndex];
  const meta = SEGMENT_CONTENT_META[currentItem?.type] || SEGMENT_CONTENT_META.text;
  const isCurrentQuizReadyToSave = currentItem?.type === 'quiz' && (
    currentItem.randomize
      ? Number(currentItem.randomCount || 0) > 0
      : Array.isArray(currentItem.questionIds) && currentItem.questionIds.length > 0
  );

  return (
    <div className="container-segment-detail">
      <TeacherSidebar />
      <div className="content-segment-detail">
        {/* Breadcrumb */}
        <div className="segment-detail-breadcrumb">
          <button onClick={handleGoBack} className="btn-breadcrumb">
            ← Quay lại
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text">{course?.title}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text">{chapter?.title}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text">{lesson?.title}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text-active">Phần {segment?.orderIndex}: {segment?.title}</span>
        </div>

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="segment-detail-container">
            {/* Left Panel - Content List */}
            <div className="segment-detail-left">
              <div className="content-list-header">
                <h3>Nội dung ({contentItems.length})</h3>
                <div className="add-content-dropdown">
                  <select
                    className="add-content-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddContentItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">+ Thêm nội dung</option>
                    <option value="text">📝 Text</option>
                    <option value="document">📎 Tài liệu</option>
                    <option value="question">❓ Câu hỏi</option>
                    <option value="quiz">🧪 Bài tập</option>
                    <option value="videoClip">🎬 Video Clip</option>
                  </select>
                </div>
              </div>

              <div className="content-list">
                {contentItems.map((item, index) => {
                  const itemMeta = SEGMENT_CONTENT_META[item.type] || SEGMENT_CONTENT_META.text;
                  return (
                    <div
                      key={index}
                      className={`content-list-item ${index === currentItemIndex ? 'active' : ''}`}
                      onClick={() => setCurrentItemIndex(index)}
                    >
                      <div className="list-item-number">{index + 1}</div>
                      <div className="list-item-content">
                        <div className="list-item-type">{itemMeta.icon} {itemMeta.title}</div>
                        <div className="list-item-title">{item.title || 'Chưa đặt tên'}</div>
                      </div>
                      {contentItems.length > 1 && (
                        <button
                          className="btn-delete-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContentItem(index);
                          }}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Content Editor */}
            <div className="segment-detail-right">
              {currentItem ? (
                <div className="content-editor">
                  <div className="editor-header">
                    <div className="editor-title">
                      <span className="editor-type-badge">{meta.icon} {meta.title}</span>
                      <h2>Nội dung {currentItemIndex + 1} của {contentItems.length}</h2>
                    </div>
                  </div>

                  <div className="editor-form">
                    {currentItem.type === 'question' ? (
                      <div className="form-group" style={{ padding: 16, background: '#f8fafc', border: '1px dashed #d1d5db', borderRadius: 8 }}>
                        <label style={{ fontWeight: 600 }}>Quản lý câu hỏi của nội dung này</label>
                        <p style={{ margin: '8px 0 12px', color: '#6b7280' }}>Phần nội dung này là loại câu hỏi — không cần tiêu đề hoặc mô tả tại đây. Bấm nút để mở màn hình quản lý câu hỏi của phần.</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="button" className="btn-save-all" onClick={handleOpenQuestionManager}>
                            Thêm câu hỏi
                          </button>
                        </div>
                      </div>
                    ) : currentItem.type === 'quiz' ? (
                      <div className="form-group" style={{ padding: 16, background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: 12 }}>
                        <label style={{ fontWeight: 700, color: '#4c1d95' }}>Thiết lập bài tập từ ngân hàng câu hỏi</label>
                        <p style={{ margin: '8px 0 12px', color: '#6b7280', lineHeight: 1.5 }}>
                          Bài tập này sẽ lấy câu hỏi từ ngân hàng của đúng phần học đang mở. Bạn có thể chọn từng câu hoặc random số câu.
                        </p>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#4c1d95' }}>Ngân hàng câu hỏi</div>
                            <div style={{ marginTop: 4, color: '#5b21b6' }}>
                              {currentItem.randomize ? (
                                <strong>Random {Number(currentItem.randomCount || 0)} câu</strong>
                              ) : Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length ? (
                                <strong>{currentItem.questionTitles.length} câu đã chọn</strong>
                              ) : Array.isArray(currentItem.questionIds) && currentItem.questionIds.length ? (
                                <strong>{currentItem.questionIds.length} câu đã chọn</strong>
                              ) : (
                                <span>Chưa chọn câu nào</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={() => setSelectQuestionsModal({ open: true, itemIndex: currentItemIndex })}
                            style={{ background: '#7c3aed' }}
                          >
                            📚 Chọn từ Ngân hàng Câu hỏi
                          </button>
                        </div>

                        <div style={{ marginTop: 14, padding: 12, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#374151' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(currentItem.randomize)}
                              onChange={(event) => {
                                handleUpdateContentItem(currentItemIndex, 'randomize', event.target.checked);
                                if (event.target.checked) {
                                  handleUpdateContentItem(currentItemIndex, 'questionIds', []);
                                  handleUpdateContentItem(currentItemIndex, 'questionTitles', []);
                                } else {
                                  handleUpdateContentItem(currentItemIndex, 'randomCount', 0);
                                }
                              }}
                            />
                            Random câu hỏi
                          </label>
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#6b7280' }}>Số câu:</span>
                            <input
                              type="number"
                              min="1"
                              disabled={!currentItem.randomize}
                              value={currentItem.randomCount || ''}
                              onChange={(e) => handleUpdateContentItem(currentItemIndex, 'randomCount', e.target.value)}
                              className="form-input"
                              style={{ width: 120 }}
                            />
                          </div>
                        </div>

                        {((Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length) || (Array.isArray(currentItem.questionIds) && currentItem.questionIds.length)) && !currentItem.randomize ? (
                          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#111827' }}>Câu hỏi đã chọn</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {(Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length ? currentItem.questionTitles : currentItem.questionIds).map((questionValue, questionIndex) => (
                                <span key={`${questionValue}-${questionIndex}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: '#ede9fe', color: '#5b21b6', fontWeight: 700, fontSize: 13 }}>
                                  {Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length ? questionValue : `Câu #${questionValue}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={handleSaveQuizItem}
                            disabled={!isCurrentQuizReadyToSave || isSaving}
                            style={{
                              background: isCurrentQuizReadyToSave ? '#7c3aed' : '#c4b5fd',
                              opacity: isCurrentQuizReadyToSave && !isSaving ? 1 : 0.7,
                              cursor: isCurrentQuizReadyToSave && !isSaving ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isSaving ? 'Đang lưu...' : '💾 Lưu bài tập'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>Tiêu đề *</label>
                          <input
                            type="text"
                            value={currentItem.title}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'title', e.target.value)}
                            placeholder="Nhập tiêu đề"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Nội dung *</label>
                          <textarea
                            value={currentItem.content}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'content', e.target.value)}
                            placeholder="Nhập nội dung"
                            className="form-textarea"
                            rows="8"
                          />
                        </div>
                      </>
                    )}

                    {(currentItem.type === 'document' || currentItem.type === 'videoClip') && (
                      <div className="form-group">
                        <label>
                          URL Tài Nguyên {currentItem.type === 'videoClip' ? '(YouTube)' : ''}
                        </label>
                        <div className="resource-input-group">
                          <input
                            type="text"
                            value={currentItem.resourceUrl || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'resourceUrl', e.target.value)}
                            placeholder={currentItem.type === 'videoClip' ? 'https://youtube.com/...' : 'https://...'}
                            className="form-input"
                          />
                          <button
                            className="btn-upload"
                            onClick={() => handleUploadFile(currentItemIndex)}
                            disabled={uploadingIndex === currentItemIndex}
                          >
                            {uploadingIndex === currentItemIndex ? '⏳ Uploading...' : '📤 Upload'}
                          </button>
                        </div>
                        {uploadMessage && (
                          <div className="upload-message">{uploadMessage}</div>
                        )}
                      </div>
                    )}

                    {currentItem.type === 'videoClip' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Bắt đầu (giây)</label>
                          <input
                            type="number"
                            min="0"
                            value={currentItem.startTime || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'startTime', e.target.value)}
                            placeholder="0"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Kết thúc (giây)</label>
                          <input
                            type="number"
                            min="1"
                            value={currentItem.endTime || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'endTime', e.target.value)}
                            placeholder="30"
                            className="form-input"
                          />
                        </div>
                      </div>
                    )}

                    {currentItem.type === 'question' && (
                      <div className="question-bank-inline">
                        <div className="question-bank-inline-header">
                          <div>
                            <h3>Câu hỏi của phần này</h3>
                            <p>Quản lý câu hỏi thuộc đúng khóa học, bài giảng và phần bài giảng đang mở.</p>
                          </div>
                          {questions.length > 0 ? (
                            <button
                              type="button"
                              className="btn-save-all"
                              onClick={handleAddQuestion}
                            >
                              + Thêm câu hỏi
                            </button>
                          ) : null}
                        </div>

                        {questionError ? <div className="error-message" style={{ marginTop: 12 }}>{questionError}</div> : null}
                        {questionLoading ? <p style={{ marginTop: 12 }}>Đang tải câu hỏi...</p> : null}

                        {!questionLoading && !questions.length ? (
                          <div className="question-bank-list" style={{ marginTop: 16 }}>
                            <p>Chưa có câu hỏi nào cho nội dung này.</p>
                          </div>
                        ) : (
                          <div className="question-bank-list" style={{ marginTop: 16 }}>
                            {questions.map((question, index) => {
                              const metadata = parseJson(question.metadata, {});
                              const type = question.type || 'MULTIPLE_CHOICE';
                              const isExpanded = expandedQuestionId === question.id;

                              let answerPreview = 'Chưa thiết lập';
                              if (type === 'MULTIPLE_CHOICE') {
                                answerPreview = `Đáp án đúng: ${(metadata.correctIndices || []).map((answerIndex) => String.fromCharCode(65 + Number(answerIndex))).join(', ')}`;
                              } else if (type === 'TRUE_FALSE') {
                                answerPreview = `Đáp án đúng: ${metadata.correctAnswer ? 'Đúng' : 'Sai'}`;
                              } else if (type === 'SHORT_ANSWER') {
                                answerPreview = `Chấp nhận: ${(metadata.acceptedAnswers || []).join(' | ')}`;
                              } else if (type === 'ESSAY') {
                                answerPreview = `Mục đánh giá: ${(metadata.rubric || []).length}`;
                              }

                              return (
                                <article key={question.id} className="question-bank-card-item">
                                  <div className="question-bank-card-head">
                                    <div>
                                      <div className="question-bank-card-title-row">
                                        <span className="question-bank-type-badge">{QUESTION_TYPE_LABELS[type] || type}</span>
                                        <h4>{index + 1}. {question.content || question.questionText || 'Không có nội dung'}</h4>
                                      </div>
                                      <p className="question-bank-card-preview">{answerPreview}</p>
                                    </div>
                                    <div className="question-bank-card-actions">
                                      <button type="button" className="btn-prev-item" onClick={() => setExpandedQuestionId(isExpanded ? null : question.id)}>
                                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                      </button>
                                      <button type="button" className="btn-next-item" onClick={() => startEditQuestion(question.id)}>
                                        Sửa
                                      </button>
                                      <button type="button" className="btn-delete-item" onClick={() => handleDeleteQuestion(question.id)}>
                                        Xóa
                                      </button>
                                    </div>
                                  </div>

                                  {isExpanded ? (
                                    <div className="question-bank-card-body">
                                      {metadata.explanation ? <p><strong>Giải thích:</strong> {metadata.explanation}</p> : null}
                                      {type === 'SHORT_ANSWER' ? (
                                        <p><strong>Đáp án chấp nhận:</strong> {(metadata.acceptedAnswers || []).join(' | ')}</p>
                                      ) : null}
                                      {type === 'ESSAY' ? (
                                        <p><strong>Rubric:</strong> {(metadata.rubric || []).map((item) => item.name).join(', ') || 'Chưa có'}</p>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <QuestionFormModal
                    isOpen={questionModalOpen}
                    draft={questionDraft}
                    onDraftChange={setQuestionDraft}
                    onConfirm={handleSaveQuestion}
                    onCancel={() => {
                      setQuestionModalOpen(false);
                      setQuestionEditingId(null);
                      setQuestionDraft(createEmptyQuestionDraft());
                    }}
                    renderTypeSpecificForm={renderQuestionTypeSpecificForm}
                    chapterId={chapterId}
                    lectureId={lessonId}
                    segmentId={segmentId}
                    chapterTitle={chapter?.title}
                    lectureTitle={lesson?.title}
                    segmentTitle={segment?.title}
                  />

                  <SelectQuestionsModal
                    isOpen={selectQuestionsModal.open}
                    filters={{
                      courseId: Number(courseId),
                      chapterId: Number(chapterId),
                      lectureId: Number(lessonId),
                      segmentId: Number(segmentId),
                    }}
                    initial={selectQuestionsModal.itemIndex != null ? (contentItems[selectQuestionsModal.itemIndex]?.questionIds || []) : []}
                    onClose={() => setSelectQuestionsModal({ open: false, itemIndex: null })}
                    onConfirm={(data) => {
                      const idx = selectQuestionsModal.itemIndex;
                      if (idx == null) return;
                      
                      // Update all quiz fields in a single state update
                      setContentItems((prev) =>
                        prev.map((item, i) => {
                          if (i !== idx) return item;
                          
                          if (data.randomize) {
                            return {
                              ...item,
                              questionIds: [],
                              questionTitles: [],
                              randomize: true,
                              randomCount: Number(data.randomCount || 1),
                            };
                          } else {
                            return {
                              ...item,
                              questionIds: Array.isArray(data.questionIds) ? data.questionIds : [],
                              questionTitles: Array.isArray(data.questionTitles) ? data.questionTitles : [],
                              randomize: false,
                              randomCount: 0,
                            };
                          }
                        })
                      );
                      setSelectQuestionsModal({ open: false, itemIndex: null });
                    }}
                  />

                  {/* Navigation giữa items */}
                  <div className="editor-navigation">
                    <button
                      className="btn-prev-item"
                      onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                      disabled={currentItemIndex === 0}
                    >
                      ← Trước
                    </button>
                    <div className="item-counter">
                      {currentItemIndex + 1} / {contentItems.length}
                    </div>
                    <button
                      className="btn-next-item"
                      onClick={() => setCurrentItemIndex(Math.min(contentItems.length - 1, currentItemIndex + 1))}
                      disabled={currentItemIndex === contentItems.length - 1}
                    >
                      Tiếp →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-content">Chưa có nội dung</div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="segment-detail-footer">
          <div className="segment-save-status">
            {saveStatus || 'Mọi thay đổi sẽ được đồng bộ xuống backend để học sinh xem.'}
          </div>
          <button
            className="btn-cancel"
            onClick={handleGoBack}
            disabled={isSaving}
          >
            Hủy
          </button>
          <button
            className="btn-save-all"
            onClick={handleSaveChanges}
            disabled={isSaving || loading}
          >
            {isSaving ? '⏳ Đang lưu...' : '💾 Lưu Tất Cả'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SegmentDetailView;
