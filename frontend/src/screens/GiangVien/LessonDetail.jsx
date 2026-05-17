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
import './LessonDetail.css';

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
          return {
            ...createEmptyContentItem(value, index + 1),
            type: value,
          };
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
                          onClick={() => navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/segments/${segment.id}`)}
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

                      {(item.type === 'document' || item.type === 'quiz' || item.type === 'question') && (
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
