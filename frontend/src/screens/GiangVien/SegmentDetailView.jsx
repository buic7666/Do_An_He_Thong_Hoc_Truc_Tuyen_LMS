import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import {
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

const createEmptyContentItem = (type = 'text', orderIndex = 1) => ({
  type,
  title: '',
  content: '',
  resourceUrl: '',
  startTime: '',
  endTime: '',
  orderIndex,
});

const normalizeContentItemForForm = (item, index) => ({
  type: item?.type || 'text',
  title: item?.title ?? '',
  content: item?.content ?? '',
  resourceUrl: item?.resourceUrl ?? '',
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

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!segment) return;

    try {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setIsSaving(true);

      const saveData = {
        title: segment.title,
        orderIndex: segment.orderIndex,
        contentItems: contentItems.map((item, idx) => normalizeContentItemForPayload(item, idx)),
      };

      await updateLessonSegmentApi(segmentId, saveData);
      alert('✅ Lưu thành công!');
      navigate(
        `/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`
      );
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Back button
  const handleGoBack = () => {
    navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  };

  // Navigation giữa các items
  const currentItem = contentItems[currentItemIndex];
  const meta = SEGMENT_CONTENT_META[currentItem?.type] || SEGMENT_CONTENT_META.text;

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

                    {(currentItem.type === 'document' || currentItem.type === 'quiz' || currentItem.type === 'videoClip') && (
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
                  </div>

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
