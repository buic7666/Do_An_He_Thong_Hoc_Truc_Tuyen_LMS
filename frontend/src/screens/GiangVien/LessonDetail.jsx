import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import { uploadTeacherFileApi } from '../../api/teacherApi';
import {
  fetchLessonSegmentsApi,
  createLessonSegmentApi,
  updateLessonSegmentApi,
  deleteLessonSegmentApi,
  reorderLessonSegmentsApi,
} from '../../api/teacherManagementApi';
import CommentThread from '../../components/CommentThread';
import QuestionFormModal from '../../components/QuestionFormModal';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText, richContentTextOnlyToPlainText } from '../../components/RichContentEditor';
import SelectQuestionsModal from '../../components/SelectQuestionsModal';
import { createQuestionApi, updateQuestionApi } from '../../api/teacherManagementApi';
import './LessonDetail.css';
import ClozeQuestionForm from '../../components/ClozeQuestionForm';

// Hàm lấy video ID từ URL YouTube
const getYouTubeVideoId = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return url.pathname.slice(1).split(/[?&#]/)[0];
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/embed/')[1];
      }
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/shorts/')[1];
      }
    }
  } catch (_error) {
    return null;
  }
  return null;
};

// Hàm format thời gian
const formatTime = (seconds) => {
  const total = Math.max(0, Number(seconds || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Hàm parse thời gian từ input
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

const SEGMENT_CONTENT_META = {
  text: { icon: '📝', title: 'Text' },
  document: { icon: '📎', title: 'Tài liệu' },
  question: { icon: '❓', title: 'Câu hỏi' },
  quiz: { icon: '🧪', title: 'Bài kiểm tra' },
  videoClip: { icon: '🎬', title: 'Đoạn video' },
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

const getUploadAcceptByItemType = (type) => {
  if (type === 'document') {
    return '.pdf,application/pdf';
  }

  if (type === 'quiz' || type === 'question') {
    return '.pdf,application/pdf,image/*';
  }

  return '*/*';
};

const resolveUploadTypeByMime = (mimeType = '') => {
  if (mimeType === 'application/pdf') {
    return 'document';
  }
  if (mimeType === 'video/mp4') {
    return 'video';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return null;
};

const isUploadTypeAllowedForContentType = (contentType, uploadType) => {
  if (contentType === 'document') {
    return uploadType === 'document';
  }

  if (contentType === 'quiz' || contentType === 'question') {
    return uploadType === 'document' || uploadType === 'image';
  }

  return true;
};

const normalizeContentItemsForForm = (items = []) => {
  if (!Array.isArray(items) || !items.length) {
    return [createEmptyContentItem('text', 1)];
  }

  return items.map((item, index) => ({
    ...createEmptyContentItem(item.type || 'text', index + 1),
    ...item,
    startTime: item?.startTime == null ? '' : String(item.startTime),
    endTime: item?.endTime == null ? '' : String(item.endTime),
    orderIndex: index + 1,
  }));
};

function LessonDetail() {
  const { lessonId, courseId, chapterId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerRef = useRef(null);

  // State cho modal thêm/sửa phần
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    orderIndex: '',
    contentItems: [createEmptyContentItem('text', 1)],
  });

  const [playingSegmentId, setPlayingSegmentId] = useState(null);
  const [uploadingContentIndex, setUploadingContentIndex] = useState(null);
  const [uploadMessageByIndex, setUploadMessageByIndex] = useState({});
  const [dragOverContentIndex, setDragOverContentIndex] = useState(null);
  const resourceUploadInputRefs = useRef({});

  // Log params để debug
  useEffect(() => {
    console.log('LessonDetail params:', { lessonId, courseId, chapterId });
  }, [lessonId, courseId, chapterId]);

  // Lấy thông tin bài học
  const loadLessonDetail = async () => {
    try {
      if (!lessonId) {
        throw new Error('Lesson ID not found');
      }
      const response = await httpClient.get(`/lessons/${lessonId}`);
      const lessonData = response?.data?.data || response?.data;
      if (!lessonData) {
        throw new Error('No lesson data returned');
      }
      setLesson(lessonData);
    } catch (err) {
      console.error('Load lesson detail error:', err);
      setError('Không thể tải thông tin bài học. ' + (err?.message || ''));
    }
  };

  // Lấy danh sách phần
  const loadSegments = async () => {
    try {
      if (!lessonId) {
        throw new Error('Lesson ID not found');
      }
      const items = await fetchLessonSegmentsApi(lessonId);
      const sortedItems = Array.isArray(items)
        ? [...items].sort((left, right) => {
            const leftOrder = Number(left.orderIndex || 0);
            const rightOrder = Number(right.orderIndex || 0);
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            return Number(left.startTime || 0) - Number(right.startTime || 0);
          })
        : [];
      setSegments(sortedItems);
    } catch (err) {
      console.error('Load segments error:', err);
      setError(prev => prev || err?.response?.data?.message || 'Không thể tải danh sách phần');
      setSegments([]);
    }
  };

  useEffect(() => {
    if (lessonId && courseId && chapterId) {
      setLoading(true);
      setError('');
      Promise.all([loadLessonDetail(), loadSegments()])
        .finally(() => setLoading(false));
    } else {
      setError('Thông tin bài học không hợp lệ. Vui lòng quay lại và thử lại.');
      setLoading(false);
    }
  }, [lessonId, courseId, chapterId]);

  // Mở modal thêm phần
  const handleOpenAddModal = () => {
    setEditingSegment(null);
    setFormData({
      title: '',
      orderIndex: String((segments?.length || 0) + 1),
      contentItems: [createEmptyContentItem('text', 1)],
    });
    setShowModal(true);
  };

  // Mở modal sửa phần
  const handleOpenEditModal = (segment) => {
    setEditingSegment(segment);
    setFormData({
      title: segment.title || '',
      orderIndex: String(segment.orderIndex || ''),
      contentItems: normalizeContentItemsForForm(segment.contentItems || []),
    });
    setShowModal(true);
  };

  // Xử lý thay đổi form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContentItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contentItems: prev.contentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === 'type') {
          const nextItem = {
            ...createEmptyContentItem(value, index + 1),
            type: value,
          };
          if (value === 'quiz') {
            setTimeout(() => setSelectQuestionsModal({ open: true, itemIndex: index }), 0);
          }
          return nextItem;
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };

  const handleAddContentItem = () => {
    setFormData((prev) => ({
      ...prev,
      contentItems: [
        ...prev.contentItems,
        createEmptyContentItem('text', prev.contentItems.length + 1),
      ],
    }));
  };

  const handleMoveContentItem = (index, direction) => {
    setFormData((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.contentItems.length) {
        return prev;
      }

      const items = [...prev.contentItems];
      const [moved] = items.splice(index, 1);
      items.splice(nextIndex, 0, moved);

      return {
        ...prev,
        contentItems: items.map((item, itemIndex) => ({
          ...item,
          orderIndex: itemIndex + 1,
        })),
      };
    });
  };

  const handleDeleteContentItem = (index) => {
    setFormData((prev) => {
      if (prev.contentItems.length <= 1) {
        return {
          ...prev,
          contentItems: [createEmptyContentItem('text', 1)],
        };
      }

      const items = prev.contentItems.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        contentItems: items.map((item, itemIndex) => ({
          ...item,
          orderIndex: itemIndex + 1,
        })),
      };
    });
  };

  const handleTriggerResourceUpload = (index) => {
    const input = resourceUploadInputRefs.current[index];
    if (input) {
      input.click();
    }
  };

  const handleOpenQuestionManager = () => {
    // replaced by modal flow below — keep for backward compat but noop here
    return;
  };

  // Question modal state (used when adding from Lesson modal)
  const createEmptyQuestionDraft = () => ({
    type: 'MULTIPLE_CHOICE',
    metadata: { text_template: '', inner_questions: {} },
    content: '',
    contentBlocks: createEmptyRichBlocks(),
    isPublished: false,
    options: ['', '', '', ''],
    optionsRich: [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()],
    correctIndices: [0],
    allowMultipleCorrect: false,
    explanation: '',
    correctAnswer: true,
    acceptedAnswersText: '',
    acceptedAnswersRich: [createEmptyRichBlocks()],
    caseSensitive: false,
    fuzzyMatch: true,
    instructions: '',
    instructionsRich: createEmptyRichBlocks(),
    rubric: [
      { name: 'Nội dung', weight: 40, description: '' },
      { name: 'Lập luận', weight: 30, description: '' },
      { name: 'Ngôn ngữ', weight: 30, description: '' },
    ],
    wordLimitMin: 100,
    wordLimitMax: 400,
    aiModel: 'gpt-3.5-turbo',
  });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState(createEmptyQuestionDraft());
  const [questionEditingId, setQuestionEditingId] = useState(null);
  const [selectQuestionsModal, setSelectQuestionsModal] = useState({ open: false, itemIndex: null });

  const handleAddQuestionInLesson = () => {
    if (!editingSegment?.id) return alert('Vui lòng lưu phần trước khi thêm câu hỏi.');
    setQuestionEditingId(null);
    setQuestionDraft(createEmptyQuestionDraft());
    setQuestionModalOpen(true);
  };

  const buildQuestionPayload = () => {
    const content = richContentTextOnlyToPlainText(questionDraft.contentBlocks) || questionDraft.content.trim();
    if (!content) throw new Error('Vui lòng nhập nội dung câu hỏi.');

    const base = {
      type: questionDraft.type,
      content,
      contentBlocks: questionDraft.contentBlocks,
      courseId: Number(courseId),
      chapterId: Number(chapterId),
      lectureId: Number(lessonId),
      segmentId: Number(editingSegment?.id),
      isPublished: questionDraft.isPublished,
    };

    if (questionDraft.type === 'MULTIPLE_CHOICE') {
      const pairs = questionDraft.options
        .map((item, index) => ({ rawIndex: index, value: item.trim() }))
        .filter((item) => item.value);

      const options = pairs.map((item) => item.value);
      let correctIndices = [];
      if (questionDraft.allowMultipleCorrect) {
        correctIndices = pairs
          .map((item, index) => ({ index, isCorrect: (questionDraft.correctIndices || []).includes(item.rawIndex) }))
          .filter((item) => item.isCorrect)
          .map((item) => item.index);
      } else {
        const selectedCorrectIndex = questionDraft.correctIndices[0];
        correctIndices = pairs
          .map((item, index) => ({ index, isCorrect: item.rawIndex === selectedCorrectIndex }))
          .filter((item) => item.isCorrect)
          .map((item) => item.index);
      }

      if (options.length < 2) {
        throw new Error('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án.');
      }
      if (!correctIndices.length) {
        throw new Error('Hãy chọn ít nhất 1 đáp án đúng.');
      }

      return {
        ...base,
        options,
        optionsRich: questionDraft.optionsRich,
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
      const acceptedAnswers = Array.isArray(questionDraft.acceptedAnswersRich)
        ? questionDraft.acceptedAnswersRich
            .map((blocks) => richContentToPlainText(blocks))
            .filter(Boolean)
        : questionDraft.acceptedAnswersText
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

    if (questionDraft.type === 'CLOZE') {
      return (
        <div style={{ marginBottom: 20 }}>
          <ClozeQuestionForm
            compact
            initialValue={{ text_template: questionDraft.content, inner_questions: questionDraft.metadata?.inner_questions || {} }}
            templateText={questionDraft.content}
            onChange={(nextMeta) => setQuestionDraft((prev) => ({ ...prev, metadata: nextMeta }))}
          />
        </div>
      );
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
      instructions: Array.isArray(questionDraft.instructionsRich)
        ? richContentToPlainText(questionDraft.instructionsRich)
        : questionDraft.instructions.trim(),
      rubric,
      wordLimit: {
        min: Number(questionDraft.wordLimitMin),
        max: Number(questionDraft.wordLimitMax),
      },
      aiModel: questionDraft.aiModel,
    };
  };

  const handleSaveQuestionFromLesson = async () => {
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
      // Optionally refresh segments/questions in parent
      await loadSegments();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Không thể lưu câu hỏi.');
    }
  };

  const addOption = () => {
    setQuestionDraft((prev) => ({
      ...prev,
      options: [...(prev.options || []), ''],
      optionsRich: [...(prev.optionsRich || []), createEmptyRichBlocks()],
    }));
  };

  const removeOption = (index) => {
    setQuestionDraft((prev) => {
      const nextOptions = [...(prev.options || [])];
      const nextRich = [...(prev.optionsRich || [])];
      if (nextOptions.length <= 2) return prev;
      nextOptions.splice(index, 1);
      nextRich.splice(index, 1);

      const nextCorrect = (prev.correctIndices || []).map((i) => (i > index ? i - 1 : i)).filter((i) => i >= 0 && i < nextOptions.length);
      if (!nextCorrect.length && nextOptions.length) nextCorrect.push(0);

      return { ...prev, options: nextOptions, optionsRich: nextRich, correctIndices: nextCorrect };
    });
  };

  const toggleCorrectIndex = (index) => {
    setQuestionDraft((prev) => {
      if (prev.allowMultipleCorrect) {
        const next = new Set(prev.correctIndices || []);
        if (next.has(index)) next.delete(index); else next.add(index);
        const arr = Array.from(next).sort((a, b) => a - b);
        return { ...prev, correctIndices: arr.length ? arr : [0] };
      }
      return { ...prev, correctIndices: [index] };
    });
  };

  const renderQuestionTypeSpecificForm = () => {
    if (questionDraft.type === 'MULTIPLE_CHOICE') {
      return (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 15, color: '#111' }}>
              ✓ Các lựa chọn đáp án *
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={questionDraft.allowMultipleCorrect} onChange={(e) => setQuestionDraft((prev) => ({ ...prev, allowMultipleCorrect: e.target.checked, correctIndices: e.target.checked ? prev.correctIndices : [prev.correctIndices?.[0] ?? 0] }))} />
              <span style={{ fontSize: 13 }}>Cho phép nhiều đáp án đúng</span>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questionDraft.optionsRich.map((optionBlocks, index) => (
              <div 
                key={`question-option-${index}`} 
                style={{ 
                  position: 'relative',
                  border: questionDraft.correctIndices.includes(index) ? '2px solid #10b981' : '1px solid #e5e7eb',
                  borderRadius: 10, 
                  padding: 14,
                  background: questionDraft.correctIndices.includes(index) ? '#ecfdf5' : '#fafafa',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type={questionDraft.allowMultipleCorrect ? 'checkbox' : 'radio'}
                      name="question-correct-answer"
                      checked={questionDraft.correctIndices.includes(index)}
                      onChange={() => toggleCorrectIndex(index)}
                      style={{ width: 18, height: 18, cursor: 'pointer', marginRight: 4 }}
                    />
                    <span style={{ minWidth: 28, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, borderRadius: 6, background: '#e5e7eb', color: '#1f2937' }}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>
                      {questionDraft.correctIndices.includes(index) ? '✓ Đáp án đúng' : 'Đáp án'}
                    </span>
                  </div>
                  {questionDraft.optionsRich.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #f3c663', background: '#fff7ed', color: '#92400e', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Xóa
                    </button>
                  )}
                {/* floating delete for better visibility */}
                {questionDraft.optionsRich.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    title="Xóa lựa chọn"
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 40, padding: '6px 8px', borderRadius: 6, border: '1px solid #f3c663', background: '#fff7ed', color: '#92400e', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Xóa
                  </button>
                )}
                </div>
                <div style={{ marginLeft: 46 }}>
                  <RichContentEditor
                    title=""
                    helperText=""
                    value={optionBlocks}
                    onChange={(nextBlocks) => {
                      const next = [...questionDraft.optionsRich];
                      next[index] = nextBlocks;
                      const nextPlainOptions = [...questionDraft.options];
                      nextPlainOptions[index] = richContentToPlainText(nextBlocks);
                      setQuestionDraft((prev) => ({ ...prev, optionsRich: next, options: nextPlainOptions }));
                    }}
                  />
                </div>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addOption}
                disabled={(questionDraft.options || []).length >= 10}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 700 }}
              >
                + Thêm lựa chọn
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (questionDraft.type === 'TRUE_FALSE') {
      return (
        <div style={{ marginBottom: 20, background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 16 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 15, color: '#111' }}>
            ✓ Đáp án đúng *
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: questionDraft.correctAnswer === true ? '#dbeafe' : 'white', borderRadius: 8, border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: questionDraft.correctAnswer === true ? 600 : 500 }}>
              <input
                type="radio"
                name="true-false-answer"
                checked={questionDraft.correctAnswer === true}
                onChange={() => setQuestionDraft((prev) => ({ ...prev, correctAnswer: true }))}
              />
              <span>Đúng (True)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: questionDraft.correctAnswer === false ? '#fee2e2' : 'white', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer', fontWeight: questionDraft.correctAnswer === false ? 600 : 500 }}>
              <input
                type="radio"
                name="true-false-answer"
                checked={questionDraft.correctAnswer === false}
                onChange={() => setQuestionDraft((prev) => ({ ...prev, correctAnswer: false }))}
              />
              <span>Sai (False)</span>
            </label>
          </div>
        </div>
      );
    }

    if (questionDraft.type === 'SHORT_ANSWER') {
      return (
        <div style={{ marginBottom: 20, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: 16 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 15, color: '#111' }}>
            ✓ Danh sách đáp án chấp nhận *
          </label>
          <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.isArray(questionDraft.acceptedAnswersRich) ? questionDraft.acceptedAnswersRich.map((answerBlocks, answerIndex) => (
              <div key={`short-answer-${answerIndex}`} style={{ border: '1px solid #fbbf24', borderRadius: 8, padding: 12, background: 'white' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#92400e' }}>Đáp án #{answerIndex + 1}</span>
                  {questionDraft.acceptedAnswersRich.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...questionDraft.acceptedAnswersRich];
                        next.splice(answerIndex, 1);
                        setQuestionDraft((prev) => ({ ...prev, acceptedAnswersRich: next }));
                      }}
                      style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #f59e0b', background: '#fef3c7', color: '#92400e', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <RichContentEditor
                  title=""
                  helperText="Soạn nội dung đáp án với định dạng, ảnh, video..."
                  value={answerBlocks}
                  onChange={(nextBlocks) => {
                    const next = [...questionDraft.acceptedAnswersRich];
                    next[answerIndex] = nextBlocks;
                    setQuestionDraft((prev) => ({ ...prev, acceptedAnswersRich: next }));
                  }}
                />
              </div>
            )) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setQuestionDraft((prev) => ({
                ...prev,
                acceptedAnswersRich: [...(prev.acceptedAnswersRich || []), createEmptyRichBlocks()],
              }));
            }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #fbbf24', background: '#fffbeb', color: '#92400e', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
          >
            + Thêm đáp án
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={questionDraft.caseSensitive}
                onChange={(event) => setQuestionDraft((prev) => ({ ...prev, caseSensitive: event.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14 }}>🔒 Phân biệt chữ hoa/thường (case-sensitive)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={questionDraft.fuzzyMatch}
                onChange={(event) => setQuestionDraft((prev) => ({ ...prev, fuzzyMatch: event.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14 }}>🔄 Khớp mềm - fuzzy match (dung thứ lỗi chính tả nhỏ)</span>
            </label>
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: 20, background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 16 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 15, color: '#111' }}>
          ✓ Hướng dẫn bài tự luận *
        </label>
        <div style={{ marginBottom: 16 }}>
          <RichContentEditor
            title=""
            helperText="Soạn hướng dẫn chi tiết với định dạng, ảnh, video, links..."
            value={Array.isArray(questionDraft.instructionsRich) ? questionDraft.instructionsRich : createEmptyRichBlocks()}
            onChange={(nextBlocks) => {
              setQuestionDraft((prev) => ({ ...prev, instructionsRich: nextBlocks }));
            }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Số từ tối thiểu</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={questionDraft.wordLimitMin}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, wordLimitMin: event.target.value }))}
              style={{ background: '#f5e6ff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Số từ tối đa</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={questionDraft.wordLimitMax}
              onChange={(event) => setQuestionDraft((prev) => ({ ...prev, wordLimitMax: event.target.value }))}
              style={{ background: '#f5e6ff' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Mô hình AI để chấm</label>
          <select
            className="form-input"
            value={questionDraft.aiModel}
            onChange={(event) => setQuestionDraft((prev) => ({ ...prev, aiModel: event.target.value }))}
            style={{ background: '#f5e6ff' }}
          >
            <option value="gpt-3.5-turbo">gpt-3.5-turbo (nhanh, tiết kiệm)</option>
            <option value="gpt-4">gpt-4 (chính xác hơn)</option>
            <option value="gpt-4o">gpt-4o (toàn năng nhất)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>Rubric chấm điểm</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questionDraft.rubric.map((item, index) => (
              <div key={`rubric-${index}`} style={{ background: 'white', border: '1px solid #e9d5ff', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10, marginBottom: 10 }}>
                  <input
                    className="form-input"
                    placeholder="Tên tiêu chí (ví dụ: Nội dung, Lập luận, Ngôn ngữ)"
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
                    placeholder="Trọng số (%)"
                    min="0"
                    max="100"
                    value={item.weight}
                    onChange={(event) => {
                      const next = [...questionDraft.rubric];
                      next[index] = { ...next[index], weight: event.target.value };
                      setQuestionDraft((prev) => ({ ...prev, rubric: next }));
                    }}
                  />
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Mô tả tiêu chí này (ví dụ: Câu trả lời cần liên hệ với kiến thức đã học)"
                  value={item.description}
                  onChange={(event) => {
                    const next = [...questionDraft.rubric];
                    next[index] = { ...next[index], description: event.target.value };
                    setQuestionDraft((prev) => ({ ...prev, rubric: next }));
                  }}
                  style={{ minHeight: 60 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const uploadFileForContentItem = async (index, file) => {
    if (!file) {
      return;
    }

    const currentItem = formData.contentItems[index];
    if (!currentItem) {
      return;
    }

    const uploadType = resolveUploadTypeByMime(file.type || '');

    if (!uploadType) {
      setUploadMessageByIndex((prev) => ({
        ...prev,
        [index]: 'Định dạng file chưa hỗ trợ. Hỗ trợ: PDF, ảnh, MP4.',
      }));
      return;
    }

    if (!isUploadTypeAllowedForContentType(currentItem.type, uploadType)) {
      setUploadMessageByIndex((prev) => ({
        ...prev,
        [index]: currentItem.type === 'document'
          ? 'Loại "File tài liệu" chỉ cho phép upload PDF.'
          : 'Loại này chỉ hỗ trợ PDF hoặc ảnh.',
      }));
      return;
    }

    setUploadingContentIndex(index);
    setUploadMessageByIndex((prev) => ({
      ...prev,
      [index]: 'Đang upload file...',
    }));

    try {
      const uploaded = await uploadTeacherFileApi(file, uploadType);
      const uploadedUrl = uploaded?.url || '';

      if (!uploadedUrl) {
        throw new Error('Upload thành công nhưng không lấy được URL file.');
      }

      handleContentItemChange(index, 'resourceUrl', uploadedUrl);
      setUploadMessageByIndex((prev) => ({
        ...prev,
        [index]: `Upload thành công: ${uploaded?.originalName || file.name}`,
      }));
    } catch (err) {
      setUploadMessageByIndex((prev) => ({
        ...prev,
        [index]: err?.response?.data?.message || err?.message || 'Upload file thất bại.',
      }));
    } finally {
      setUploadingContentIndex(null);
    }
  };

  const handleUploadResourceFile = async (index, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    await uploadFileForContentItem(index, file);
  };

  const handleDragOverResourceUpload = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    if (uploadingContentIndex === index) {
      return;
    }
    setDragOverContentIndex(index);
  };

  const handleDragLeaveResourceUpload = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    if (dragOverContentIndex === index) {
      setDragOverContentIndex(null);
    }
  };

  const handleDropResourceUpload = async (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverContentIndex(null);

    if (uploadingContentIndex === index) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    await uploadFileForContentItem(index, file);
  };

  const normalizeContentItemsForPayload = (items = []) => {
    return items.map((item, index) => ({
      type: item.type,
      title: item.title?.trim() || '',
      content: item.content?.trim() || '',
      resourceUrl: item.resourceUrl?.trim() || '',
      questionIds: Array.isArray(item.questionIds) ? item.questionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [],
      questionTitles: Array.isArray(item.questionTitles) ? item.questionTitles.map((title) => String(title || '').trim()).filter(Boolean) : [],
      randomize: Boolean(item.randomize),
      randomCount: Number(item.randomCount || 0),
      startTime:
        item.startTime === '' || item.startTime == null
          ? undefined
          : Number(item.startTime),
      endTime:
        item.endTime === '' || item.endTime == null
          ? undefined
          : Number(item.endTime),
      orderIndex: index + 1,
    }));
  };

  const handleReorderSegment = async (segmentId, direction) => {
    const currentIndex = segments.findIndex((item) => Number(item.id) === Number(segmentId));
    if (currentIndex < 0) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= segments.length) return;

    const reordered = [...segments];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderLessonSegmentsApi(lessonId, {
        segmentIds: reordered.map((item) => Number(item.id)),
      });
      await loadSegments();
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể sắp xếp lại phần');
    }
  };

  // Lưu phần
  const handleSaveSegment = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên phần');
      return;
    }

    const orderIndex = Number(formData.orderIndex || 0);

    if (!Number.isInteger(orderIndex) || orderIndex <= 0) {
      alert('Thứ tự phần phải là số nguyên dương');
      return;
    }

    // Validate video clip times only if both startTime and endTime are provided
    const hasInvalidClip = formData.contentItems.some((item) => {
      if (item.type !== 'videoClip') {
        return false;
      }

      const clipStart = item.startTime === '' || item.startTime == null ? null : Number(item.startTime);
      const clipEnd = item.endTime === '' || item.endTime == null ? null : Number(item.endTime);
      
      // If both are provided, validate they're valid and endTime > startTime
      if (clipStart != null && clipEnd != null) {
        return !Number.isInteger(clipStart) || !Number.isInteger(clipEnd) || clipEnd <= clipStart;
      }
      
      // Allow partial or empty time ranges (not required)
      return false;
    });

    if (hasInvalidClip) {
      alert('Nếu nhập thời gian video clip, thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        orderIndex,
        contentItems: normalizeContentItemsForPayload(formData.contentItems),
      };

      if (editingSegment) {
        await updateLessonSegmentApi(editingSegment.id, payload);
        alert('Cập nhật phần thành công');
      } else {
        await createLessonSegmentApi(lessonId, payload);
        alert('Tạo phần thành công');
      }
      setShowModal(false);
      setFormData({
        title: '',
        orderIndex: '',
        contentItems: [createEmptyContentItem('text', 1)],
      });
      await loadSegments();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu phần');
    }
  };

  // Xóa phần
  const handleDeleteSegment = async (segmentId, segmentTitle) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa phần "${segmentTitle}"?`)) {
      try {
        await deleteLessonSegmentApi(segmentId);
        alert('Xóa phần thành công');
        await loadSegments();
      } catch (err) {
        alert(err?.response?.data?.message || 'Lỗi khi xóa phần');
      }
    }
  };

  // Phát video từ một phần
  const playSegment = (segment) => {
    setPlayingSegmentId(segment.id);
    // Scroll đến player
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const videoId = lesson?.videoUrl ? getYouTubeVideoId(lesson.videoUrl) : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  return (
    <div className="container-lesson-detail">
      <TeacherSidebar />
      <div className="content-lesson-detail">
        {/* Breadcrumb */}
        <div className="breadcrumb-lesson">
          <button
            onClick={() => navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons`)}
            className="btn-back"
          >
            <span className="back-icon">←</span>
            <span className="back-text">Quay lại danh sách bài</span>
          </button>
        </div>

        {error && <div className="alert-error-lesson">{error}</div>}

        {lesson ? (
          <div className="lesson-container">
            {/* Thông tin bài học */}
            <div className="lesson-header-info">
              <div>
                <h1>{lesson.title}</h1>
                {lesson.content && (
                  <div className="lesson-content-preview">
                    <h3>Nội dung:</h3>
                    <p>{lesson.content}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Player */}
            <div className="video-section" ref={playerRef}>
              {embedUrl ? (
                <div className="video-player-wrapper">
                  <iframe
                    className="video-player"
                    src={`${embedUrl}${playingSegmentId ? `?start=${segments.find(s => s.id === playingSegmentId)?.startTime || 0}` : ''}`}
                    title="Video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="no-video">
                  <p>Bài học này không có video. Vui lòng thêm URL YouTube.</p>
                </div>
              )}
            </div>

            {/* Phần Bài Học */}
            <div className="segments-section">
              <div className="segments-header">
                <h2>⏱️ Phần Bài Học ({segments.length})</h2>
                {embedUrl && (
                  <button className="btn-add-segment" onClick={handleOpenAddModal}>
                    ➕ Thêm Phần
                  </button>
                )}
              </div>

              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : segments.length === 0 ? (
                <div className="no-segments">
                  <p>Bài học này chưa có phần. Hãy tạo phần đầu tiên!</p>
                </div>
              ) : (
                <div className="segments-list">
                  {segments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className={`segment-item ${playingSegmentId === segment.id ? 'active' : ''}`}
                    >
                      <div className="segment-number">{segment.orderIndex || index + 1}</div>
                      <div className="segment-info">
                        <h3>{segment.title}</h3>
                        <div className="segment-content-summary">
                          {(segment.contentItems || []).length > 0 ? (
                            (segment.contentItems || []).map((item, itemIndex) => {
                              const meta = SEGMENT_CONTENT_META[item.type] || SEGMENT_CONTENT_META.text;
                              return (
                                <span key={`${segment.id}-${itemIndex}`} className="segment-content-chip">
                                  {meta.icon} {meta.title}
                                </span>
                              );
                            })
                          ) : (
                            <span className="segment-content-empty">Chưa có phần nội dung chi tiết</span>
                          )}
                        </div>
                      </div>
                      <div className="segment-actions">
                        <button
                          className="btn-order"
                          onClick={() => handleReorderSegment(segment.id, -1)}
                          title="Đưa lên"
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="btn-order"
                          onClick={() => handleReorderSegment(segment.id, 1)}
                          title="Đưa xuống"
                          disabled={index === segments.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          className="btn-play"
                          onClick={() => playSegment(segment)}
                          title="Phát phần này"
                        >
                          ▶️ Phát
                        </button>
                        <button
                          className="btn-detail-view"
                          onClick={() => {
                            // If this segment contains question items, pass the first question id
                            let url = `/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/segments/${segment.id}`;
                            try {
                              if (Array.isArray(segment.contentItems)) {
                                for (const it of segment.contentItems) {
                                  if (it && it.type === 'question') {
                                    const qids = Array.isArray(it.questionIds) ? it.questionIds : (Array.isArray(it.questionTitles) ? [] : []);
                                    const firstId = (qids && qids.length) ? qids[0] : null;
                                    if (firstId) {
                                      url += `?openQuestionId=${Number(firstId)}`;
                                    }
                                    break;
                                  }
                                }
                              }
                            } catch (e) {
                              // ignore
                            }
                            navigate(url);
                          }}
                          title="Xem chi tiết nội dung"
                        >
                          👁️ Chi Tiết
                        </button>
                        <button
                          className="btn-edit-segment"
                          onClick={() => handleOpenEditModal(segment)}
                          title="Sửa phần"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-segment"
                          onClick={() => handleDeleteSegment(segment.id, segment.title)}
                          title="Xóa phần"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lesson-comments-section">
              <CommentThread
                courseId={Number(courseId)}
                lessonId={Number(lessonId)}
                chapterId={Number(chapterId)}
                type="lesson"
              />
            </div>
          </div>
        ) : (
          <div className="loading">Đang tải bài học...</div>
        )}

        {/* Question modal used when adding from Lesson editor */}
        <QuestionFormModal
          isOpen={questionModalOpen}
          draft={questionDraft}
          onDraftChange={setQuestionDraft}
          renderTypeSpecificForm={renderQuestionTypeSpecificForm}
          onCancel={() => setQuestionModalOpen(false)}
          onConfirm={handleSaveQuestionFromLesson}
          chapterId={chapterId}
          lectureId={lessonId}
          segmentId={editingSegment?.id}
          chapterTitle={chapterId}
          lectureTitle={lesson?.title}
          segmentTitle={editingSegment?.title}
        />

        {/* Modal thêm/sửa phần */}
        {showModal && (
          <div className="modal-overlay-segment" onClick={() => setShowModal(false)}>
            <div className="modal-content-segment" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-segment">
                <h2>{editingSegment ? 'Sửa Phần' : 'Thêm Phần Mới'}</h2>
                <button className="btn-close-segment" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveSegment}>
                <div className="form-group-segment">
                  <label>Tên Phần *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Nhập tên phần"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group-segment">
                    <label>Thứ Tự Phần *</label>
                    <input
                      type="number"
                      name="orderIndex"
                      value={formData.orderIndex}
                      onChange={handleFormChange}
                      placeholder="1"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="segment-content-editor">
                  <div className="segment-content-editor-header">
                    <h3>Các nội dung trong phần này</h3>
                    <button type="button" className="btn-add-segment" onClick={handleAddContentItem}>
                      ➕ Thêm mục
                    </button>
                  </div>

                  {formData.contentItems.map((item, index) => (
                    <div key={`content-item-${index}`} className="segment-content-item-form">
                      <div className="segment-content-item-toolbar">
                        <strong>Mục #{index + 1}</strong>
                        <div className="segment-content-item-toolbar-actions">
                          <button
                            type="button"
                            className="btn-order"
                            onClick={() => handleMoveContentItem(index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn-order"
                            onClick={() => handleMoveContentItem(index, 1)}
                            disabled={index === formData.contentItems.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn-delete-segment"
                            onClick={() => handleDeleteContentItem(index)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="form-group-segment">
                        <label>Loại nội dung</label>
                        <select
                          value={item.type}
                          onChange={(event) => handleContentItemChange(index, 'type', event.target.value)}
                        >
                          <option value="text">📝 Text</option>
                          <option value="document">📎 File tài liệu</option>
                          <option value="question">❓ Câu hỏi</option>
                          <option value="quiz">🧪 Bài kiểm tra</option>
                          <option value="videoClip">🎬 Đoạn cắt video</option>
                        </select>
                      </div>

                      {item.type === 'question' ? (
                        <div className="form-group-segment" style={{ padding: '16px 18px', background: '#f8fafc', border: '1px dashed #d1d5db', borderRadius: 12 }}>
                          <label>Quản lý câu hỏi của phần này</label>
                          <p style={{ margin: '8px 0 14px', color: '#6b7280', lineHeight: 1.5 }}>
                            Phần này không cần tiêu đề hay nội dung riêng. Bấm nút bên dưới để mở màn hình thêm và quản lý câu hỏi của đúng phần đang chọn.
                          </p>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={handleAddQuestionInLesson}
                            disabled={!editingSegment?.id}
                          >
                            + Thêm câu hỏi / Quản lý câu hỏi
                          </button>
                        </div>
                      ) : item.type === 'quiz' ? (
                        <>
                          <div className="form-group-segment" style={{ padding: 16, border: '1px solid #ddd6fe', borderRadius: 12, background: '#faf5ff' }}>
                            <label style={{ display: 'block', marginBottom: 8 }}>Thiết lập bài tập từ ngân hàng câu hỏi</label>
                            <p style={{ margin: '0 0 12px 0', color: '#6b7280', lineHeight: 1.5 }}>
                              Bài tập này sẽ lấy câu hỏi từ đúng phần học này. Bạn có thể chọn từng câu hoặc bật random số câu cần lấy.
                            </p>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontWeight: 700, color: '#4c1d95' }}>Ngân hàng câu hỏi</div>
                                <div style={{ marginTop: 4, color: '#5b21b6' }}>
                                  {item.randomize ? (
                                    <strong>Random {Number(item.randomCount || 0)} câu</strong>
                                  ) : (Array.isArray(item.questionTitles) && item.questionTitles.length ? (
                                    <strong>{item.questionTitles.length} câu đã chọn</strong>
                                  ) : (Array.isArray(item.questionIds) && item.questionIds.length ? (
                                    <strong>{item.questionIds.length} câu đã chọn</strong>
                                  ) : (
                                    <span>Chưa chọn câu nào</span>
                                  )))
                                  }
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn-upload-resource"
                                onClick={() => setSelectQuestionsModal({ open: true, itemIndex: index })}
                                style={{ backgroundColor: '#7c3aed', color: 'white', padding: '10px 14px', borderRadius: 10, border: 'none', fontWeight: 700, boxShadow: '0 6px 14px rgba(124,58,237,0.18)' }}
                              >
                                📚 Chọn từ Ngân hàng Câu hỏi
                              </button>
                            </div>

                            <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#374151' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.randomize)}
                                  onChange={(event) => {
                                    handleContentItemChange(index, 'randomize', event.target.checked);
                                    if (!event.target.checked) {
                                      handleContentItemChange(index, 'randomCount', 0);
                                    } else {
                                      handleContentItemChange(index, 'questionIds', []);
                                      handleContentItemChange(index, 'questionTitles', []);
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
                                  disabled={!item.randomize}
                                  value={item.randomCount || ''}
                                  onChange={(event) => handleContentItemChange(index, 'randomCount', event.target.value)}
                                  style={{ width: 120, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8 }}
                                />
                              </div>
                              <div style={{ marginTop: 10, color: '#6b7280', fontSize: 13 }}>
                                Khi bật random, hệ thống sẽ khóa lựa chọn từng câu để tránh nhầm lẫn.
                              </div>
                            </div>

                            {((Array.isArray(item.questionTitles) && item.questionTitles.length) || (Array.isArray(item.questionIds) && item.questionIds.length)) ? (
                              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontWeight: 700, marginBottom: 8, color: '#111827' }}>Câu hỏi đã chọn</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {(Array.isArray(item.questionTitles) && item.questionTitles.length ? item.questionTitles : item.questionIds).map((questionValue, questionIndex) => (
                                    <span
                                      key={`${questionValue}-${questionIndex}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        background: '#ede9fe',
                                        color: '#5b21b6',
                                        fontWeight: 700,
                                        fontSize: 13,
                                      }}
                                    >
                                      {Array.isArray(item.questionTitles) && item.questionTitles.length ? questionValue : `Câu #${questionValue}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="form-group-segment">
                            <label>Tiêu đề nội dung</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(event) => handleContentItemChange(index, 'title', event.target.value)}
                              placeholder="Nhập tiêu đề nội dung"
                            />
                          </div>

                          <div className="form-group-segment">
                            <label>Nội dung</label>
                            <textarea
                              value={item.content}
                              onChange={(event) => handleContentItemChange(index, 'content', event.target.value)}
                              placeholder="Mô tả text hoặc nội dung chính"
                            />
                          </div>
                        </>
                      )}

                      {(item.type === 'document') && (
                        <div className="form-group-segment">
                          <label>Đường dẫn tài nguyên</label>
                          <input
                            type="url"
                            value={item.resourceUrl}
                            onChange={(event) => handleContentItemChange(index, 'resourceUrl', event.target.value)}
                            placeholder="https://..."
                          />
                          <div className="resource-upload-row">
                            <input
                              ref={(element) => {
                                resourceUploadInputRefs.current[index] = element;
                              }}
                              type="file"
                              accept={getUploadAcceptByItemType(item.type)}
                              className="resource-upload-input-hidden"
                              onChange={(event) => handleUploadResourceFile(index, event)}
                            />
                            <button
                              type="button"
                              className="btn-upload-resource"
                              onClick={() => handleTriggerResourceUpload(index)}
                              disabled={uploadingContentIndex === index}
                            >
                              {uploadingContentIndex === index ? 'Đang upload...' : '📤 Upload file'}
                            </button>
                            {item.resourceUrl ? (
                              <a
                                href={item.resourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="resource-upload-preview-link"
                              >
                                Mở file
                              </a>
                            ) : null}
                          </div>
                          <div
                            className={`resource-upload-dropzone ${dragOverContentIndex === index ? 'is-drag-over' : ''}`}
                            onDragEnter={(event) => handleDragOverResourceUpload(event, index)}
                            onDragOver={(event) => handleDragOverResourceUpload(event, index)}
                            onDragLeave={(event) => handleDragLeaveResourceUpload(event, index)}
                            onDrop={(event) => handleDropResourceUpload(event, index)}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleTriggerResourceUpload(index)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleTriggerResourceUpload(index);
                              }
                            }}
                          >
                            {uploadingContentIndex === index
                              ? 'Đang upload file...'
                              : 'Kéo & thả file vào đây hoặc bấm để chọn file'}
                          </div>
                          {uploadMessageByIndex[index] ? (
                            <p className="resource-upload-message">{uploadMessageByIndex[index]}</p>
                          ) : null}
                        </div>
                      )}

                      {item.type === 'videoClip' && (
                        <div className="form-row">
                          <div className="form-group-segment">
                            <label>Clip bắt đầu (giây) - Tùy chọn</label>
                            <input
                              type="number"
                              min="0"
                              value={item.startTime}
                              onChange={(event) => handleContentItemChange(index, 'startTime', event.target.value)}
                              placeholder="0 (để trống nếu không dùng)"
                            />
                          </div>
                          <div className="form-group-segment">
                            <label>Clip kết thúc (giây) - Tùy chọn</label>
                            <input
                              type="number"
                              min="1"
                              value={item.endTime}
                              onChange={(event) => handleContentItemChange(index, 'endTime', event.target.value)}
                              placeholder="30 (để trống nếu không dùng)"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="modal-actions-segment">
                  <button type="button" className="btn-cancel-segment" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit-segment">
                    {editingSegment ? 'Cập Nhật' : 'Tạo Phần'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    );
}

export default LessonDetail;
