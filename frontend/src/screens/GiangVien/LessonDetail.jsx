import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import {
  fetchLessonSegmentsApi,
  createLessonSegmentApi,
  updateLessonSegmentApi,
  deleteLessonSegmentApi
} from '../../api/teacherManagementApi';
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

function LessonDetail() {
  const { lessonId, courseId, chapterId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerRef = useRef(null);

  // State cho modal thêm/sửa phân đoạn
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: ''
  });

  const [playingSegmentId, setPlayingSegmentId] = useState(null);

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

  // Lấy danh sách phân đoạn
  const loadSegments = async () => {
    try {
      if (!lessonId) {
        throw new Error('Lesson ID not found');
      }
      const items = await fetchLessonSegmentsApi(lessonId);
      setSegments(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Load segments error:', err);
      setError(prev => prev || err?.response?.data?.message || 'Không thể tải danh sách phân đoạn');
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

  // Mở modal thêm phân đoạn
  const handleOpenAddModal = () => {
    setEditingSegment(null);
    setFormData({ title: '', startTime: '', endTime: '' });
    setShowModal(true);
  };

  // Mở modal sửa phân đoạn
  const handleOpenEditModal = (segment) => {
    setEditingSegment(segment);
    setFormData({
      title: segment.title || '',
      startTime: formatTime(segment.startTime),
      endTime: formatTime(segment.endTime)
    });
    setShowModal(true);
  };

  // Xử lý thay đổi form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Lưu phân đoạn
  const handleSaveSegment = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên phân đoạn');
      return;
    }

    const startTime = parseTime(formData.startTime);
    const endTime = parseTime(formData.endTime);

    if (endTime <= startTime) {
      alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        startTime,
        endTime
      };

      if (editingSegment) {
        await updateLessonSegmentApi(editingSegment.id, payload);
        alert('Cập nhật phân đoạn thành công');
      } else {
        await createLessonSegmentApi(lessonId, payload);
        alert('Tạo phân đoạn thành công');
      }
      setShowModal(false);
      setFormData({ title: '', startTime: '', endTime: '' });
      await loadSegments();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu phân đoạn');
    }
  };

  // Xóa phân đoạn
  const handleDeleteSegment = async (segmentId, segmentTitle) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa phân đoạn "${segmentTitle}"?`)) {
      try {
        await deleteLessonSegmentApi(segmentId);
        alert('Xóa phân đoạn thành công');
        await loadSegments();
      } catch (err) {
        alert(err?.response?.data?.message || 'Lỗi khi xóa phân đoạn');
      }
    }
  };

  // Phát video từ một phân đoạn
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

            {/* Phân đoạn Video */}
            <div className="segments-section">
              <div className="segments-header">
                <h2>⏱️ Phân Đoạn Video ({segments.length})</h2>
                {embedUrl && (
                  <button className="btn-add-segment" onClick={handleOpenAddModal}>
                    ➕ Thêm Phân Đoạn
                  </button>
                )}
              </div>

              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : segments.length === 0 ? (
                <div className="no-segments">
                  <p>Bài học này chưa có phân đoạn. Hãy tạo phân đoạn đầu tiên!</p>
                </div>
              ) : (
                <div className="segments-list">
                  {segments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className={`segment-item ${playingSegmentId === segment.id ? 'active' : ''}`}
                    >
                      <div className="segment-number">{index + 1}</div>
                      <div className="segment-info">
                        <h3>{segment.title}</h3>
                        <p className="segment-time">
                          🕐 {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                        </p>
                      </div>
                      <div className="segment-actions">
                        <button
                          className="btn-play"
                          onClick={() => playSegment(segment)}
                          title="Phát phân đoạn này"
                        >
                          ▶️ Phát
                        </button>
                        <button
                          className="btn-edit-segment"
                          onClick={() => handleOpenEditModal(segment)}
                          title="Sửa phân đoạn"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-segment"
                          onClick={() => handleDeleteSegment(segment.id, segment.title)}
                          title="Xóa phân đoạn"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="loading">Đang tải bài học...</div>
        )}

        {/* Modal thêm/sửa phân đoạn */}
        {showModal && (
          <div className="modal-overlay-segment" onClick={() => setShowModal(false)}>
            <div className="modal-content-segment" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-segment">
                <h2>{editingSegment ? 'Sửa Phân Đoạn' : 'Thêm Phân Đoạn Mới'}</h2>
                <button className="btn-close-segment" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveSegment}>
                <div className="form-group-segment">
                  <label>Tên Phân Đoạn *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Nhập tên phân đoạn"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group-segment">
                    <label>Thời Gian Bắt Đầu (mm:ss hoặc hh:mm:ss) *</label>
                    <input
                      type="text"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleFormChange}
                      placeholder="00:30 hoặc 01:23:45"
                      required
                    />
                  </div>
                  <div className="form-group-segment">
                    <label>Thời Gian Kết Thúc (mm:ss hoặc hh:mm:ss) *</label>
                    <input
                      type="text"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleFormChange}
                      placeholder="02:30 hoặc 01:25:45"
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions-segment">
                  <button type="button" className="btn-cancel-segment" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit-segment">
                    {editingSegment ? 'Cập Nhật' : 'Tạo Phân Đoạn'}
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
