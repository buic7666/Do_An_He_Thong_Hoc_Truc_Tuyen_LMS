import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import QuestionFormModal from '../../components/QuestionFormModal';
import ClozeQuestionForm from '../../components/ClozeQuestionForm';
import SelectQuestionsModal from '../../components/SelectQuestionsModal';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText, richContentTextOnlyToPlainText } from '../../components/RichContentEditor';
import RichContentRenderer from '../../components/RichContentRenderer';
import QuestionTypeFields from '../../components/QuestionTypeFields';
import CommentThread from '../../components/CommentThread';
import {
  fetchQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  fetchLessonSegmentsApi,
  createLessonSegmentApi,
  updateLessonSegmentApi,
  deleteLessonSegmentApi,
  reorderLessonSegmentsApi,
} from '../../api/teacherManagementApi';
import { fetchLessonDetailApi } from '../../api/lessonApi';
import { uploadTeacherFileApi } from '../../api/teacherApi';
import './LessonDetail.css';
import '../../components/QuizTaker.css';

const SEGMENT_CONTENT_META = {
  text: { icon: '📝', title: 'Text', color: '#3498db' },
  document: { icon: '📎', title: 'Tài liệu', color: '#e74c3c' },
  question: { icon: '❓', title: 'Câu hỏi', color: '#f39c12' },
  quiz: { icon: '🧪', title: 'Bài tập', color: '#9b59b6' },
  videoClip: { icon: '🎬', title: 'Video Clip', color: '#1abc9c' },
};

function LessonDetail() {
  const { courseId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null);
  const resourceUploadInputRefs = useRef([]);

  const [lesson, setLesson] = useState(null);
  const [segments, setSegments] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState({
    type: 'MULTIPLE_CHOICE',
    metadata: { text_template: '', inner_questions: {} },
    content: '',
    isPublished: false,
    options: ['', '', '', ''],
    optionsRich: [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()],
    correctIndices: [0],
    allowMultipleCorrect: false,
    explanation: '',
    correctAnswer: true,
    acceptedAnswersRich: [createEmptyRichBlocks()],
    caseSensitive: false,
    fuzzyMatch: true,
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

  const [editingSegment, setEditingSegment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', orderIndex: 1, contentItems: [] });
  const [uploadingContentIndex, setUploadingContentIndex] = useState(null);
  const [dragOverContentIndex, setDragOverContentIndex] = useState(null);
  const [uploadMessageByIndex, setUploadMessageByIndex] = useState({});
  const [error, setError] = useState(null);
  const [selectQuestionsModal, setSelectQuestionsModal] = useState({ open: false, itemIndex: null });

  const loading = segmentsLoading || !lesson;

  const createEmptyContentItem = (type = 'text', orderIndex = 1) => ({
    type,
    title: '',
    content: '',
    resourceUrl: '',
    questionIds: [],
    questionTitles: [],
    randomize: false,
    randomCount: 1,
    startTime: '',
    endTime: '',
    orderIndex,
  });

  const getUploadAcceptByItemType = (type) => {
    if (type === 'document') return '.pdf,image/*';
    if (type === 'videoClip') return 'video/*';
    return 'image/*,.pdf,video/*';
  };

  const handleContentItemChange = (index, field, value) => {
    setFormData((prev) => {
      const nextItems = [...prev.contentItems];
      const current = nextItems[index] || createEmptyContentItem('text', index + 1);
      nextItems[index] = { ...current, [field]: value };
      return { ...prev, contentItems: nextItems };
    });
  };

  const handleMoveContentItem = (index, direction) => {
    setFormData((prev) => {
      const nextItems = [...prev.contentItems];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= nextItems.length) return prev;
      const [moved] = nextItems.splice(index, 1);
      nextItems.splice(targetIndex, 0, moved);
      return { ...prev, contentItems: nextItems.map((item, itemIndex) => ({ ...item, orderIndex: itemIndex + 1 })) };
    });
  };

  const handleDeleteContentItem = (index) => {
    setFormData((prev) => {
      const nextItems = prev.contentItems.filter((_item, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        contentItems: nextItems.length ? nextItems.map((item, itemIndex) => ({ ...item, orderIndex: itemIndex + 1 })) : [createEmptyContentItem('text', 1)],
      };
    });
  };

  const handleAddContentItem = (type = 'text') => {
    setFormData((prev) => ({
      ...prev,
      contentItems: [...prev.contentItems, createEmptyContentItem(type, prev.contentItems.length + 1)],
    }));
  };

  const handleTriggerResourceUpload = (index) => {
    resourceUploadInputRefs.current[index]?.click();
  };

  const handleOpenAddModal = () => {
    setEditingSegment(null);
    setFormData({ title: '', orderIndex: 1, contentItems: [createEmptyContentItem('text', 1)] });
    setShowModal(true);
  };

  const handleOpenEditModal = (segment) => {
    setEditingSegment(segment);
    setFormData({
      title: segment?.title || '',
      orderIndex: segment?.orderIndex || 1,
      contentItems: Array.isArray(segment?.contentItems) && segment.contentItems.length
        ? segment.contentItems.map((item, index) => ({
          type: item.type || 'text',
          title: item.title || '',
          content: item.content || '',
          resourceUrl: item.resourceUrl || '',
          questionIds: Array.isArray(item.questionIds) ? item.questionIds : [],
          questionTitles: Array.isArray(item.questionTitles) ? item.questionTitles : [],
          randomize: Boolean(item.randomize),
          randomCount: Number(item.randomCount || 0),
          startTime: item.startTime ?? '',
          endTime: item.endTime ?? '',
          orderIndex: index + 1,
        }))
        : [createEmptyContentItem('text', 1)],
    });
    setShowModal(true);
  };

  const handleAddQuestionInLesson = () => {
    if (!editingSegment?.id) return;
    navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/segments/${editingSegment.id}`);
  };

  const handleSelectQuestionsForItem = (questionIds = [], questionTitles = []) => {
    if (selectQuestionsModal.itemIndex == null) return;
    handleContentItemChange(selectQuestionsModal.itemIndex, 'questionIds', questionIds);
    handleContentItemChange(selectQuestionsModal.itemIndex, 'questionTitles', questionTitles);
    setSelectQuestionsModal({ open: false, itemIndex: null });
  };

  const handleFinishModal = () => setQuestionModalOpen(false);

  const getYouTubeVideoId = (url) => {
    try {
      const u = new URL(String(url || '').trim());
      const host = u.hostname.replace('www.', '').toLowerCase();

      if (host === 'youtu.be') {
        return u.pathname.slice(1).split(/[?&#]/)[0] || '';
      }
      if (u.pathname === '/watch') {
        return u.searchParams.get('v') || '';
      }
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/embed/')[1]?.split(/[?&#]/)[0] || '';
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/shorts/')[1]?.split(/[?&#]/)[0] || '';
      }
      return '';
    } catch (_e) {
      return '';
    }
  };

  const renderQuestionTypeSpecificForm = () => {

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

  // Minimal handler to satisfy QuestionFormModal usage in LessonDetail.
  // This is a safe stub: it closes the modal and resets the draft.
  const handleSaveQuestionFromLesson = async () => {
    try {
      setQuestionModalOpen(false);
      setQuestionDraft({
        type: 'MULTIPLE_CHOICE',
        metadata: { text_template: '', inner_questions: {} },
        content: '',
        isPublished: false,
        options: ['', '', '', ''],
        optionsRich: [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()],
        correctIndices: [0],
        allowMultipleCorrect: false,
        explanation: '',
        correctAnswer: true,
        acceptedAnswersRich: [createEmptyRichBlocks()],
        caseSensitive: false,
        fuzzyMatch: true,
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
    } catch (err) {
      // swallow errors from reset to avoid breaking UI
      console.error('handleSaveQuestionFromLesson error', err);
    }
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

  const loadSegments = async () => {
    setSegmentsLoading(true);
    try {
      const items = await fetchLessonSegmentsApi(lessonId);
      setSegments(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('loadSegments error', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải các phần');
    } finally {
      setSegmentsLoading(false);
    }
  };

  const loadLesson = async () => {
    try {
      const data = await fetchLessonDetailApi(lessonId);
      setLesson(data || null);
    } catch (err) {
      console.error('loadLesson error', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải bài học');
    }
  };

  useEffect(() => {
    if (!lessonId) return;
    loadLesson();
    loadSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

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
