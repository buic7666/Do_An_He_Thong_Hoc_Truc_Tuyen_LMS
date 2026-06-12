import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import {
  fetchTeacherCourseLessonsApi,
  createLessonApi,
  updateLessonApi,
  deleteLessonApi
} from '../../api/teacherManagementApi';
import './Step3_ChiTietChapter.css';

function Step3_ChiTietChapter() {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State cho modal thêm/sửa bài học
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    orderIndex: ''
  });

  // Lấy thông tin khóa học
  const loadCourseDetail = async () => {
    try {
      const response = await httpClient.get(`/courses/${courseId}`);
      setCourse(response?.data?.data || response?.data);
    } catch (err) {
      console.error('Error loading course:', err);
    }
  };

  // Lấy thông tin chương
  const loadChapterDetail = async () => {
    try {
      const response = await httpClient.get(`/chapters/${chapterId}`);
      setChapter(response?.data?.data || response?.data);
    } catch (err) {
      console.error('Error loading chapter:', err);
    }
  };

  // Lấy danh sách bài học của chương
  const loadLessons = async () => {
    setLoading(true);
    setError('');

    try {
      const items = await fetchTeacherCourseLessonsApi(courseId);

      const filteredLessons = Array.isArray(items)
        ? items.filter((lesson) => Number(lesson.chapterId) === Number(chapterId))
        : [];

      setLessons(filteredLessons);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách bài học');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && chapterId) {
      loadCourseDetail();
      loadChapterDetail();
      loadLessons();
    }
  }, [courseId, chapterId]);

  // Mở modal thêm bài học
  const handleOpenAddModal = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      content: '',
      orderIndex: ''
    });
    setShowModal(true);
  };

  // Mở modal sửa bài học
  const handleOpenEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      content: lesson.content || '',
      orderIndex: lesson.orderIndex || ''
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

  // Lưu bài học (thêm mới hoặc sửa)
  const handleSaveLesson = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên bài học');
      return;
    }

    try {
      const payload = {
        ...formData,
        chapterId: Number(chapterId)
      };

      if (editingLesson) {
        // Sửa bài học
        await updateLessonApi(editingLesson.id, payload);
        alert('Cập nhật bài học thành công');
      } else {
        // Thêm bài học mới
        await createLessonApi(courseId, payload);
        alert('Tạo bài học thành công');
      }
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        orderIndex: ''
      });
      await loadLessons();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu bài học');
    }
  };

  // Xóa bài học
  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa bài học "${lessonTitle}"?`)) {
      try {
        await deleteLessonApi(lessonId);
        alert('Xóa bài học thành công');
        await loadLessons();
      } catch (err) {
        alert(err?.response?.data?.message || 'Lỗi khi xóa bài học');
      }
    }
  };

  // Vào chi tiết bài học
  const handleViewLessonDetail = (lessonId) => {
    navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  };

  return (
    <div className="container-step3">
      <TeacherSidebar />
      <div className="content-step3">
        {/* Breadcrumb */}
        <div className="breadcrumb-lesson">
          <button onClick={() => navigate(`/teacher/courses/${courseId}/chapters`)} className="btn-back">
            <span className="back-icon">←</span>
            <span className="back-text">Quay lại danh sách chương</span>
          </button>
        </div>

        {/* Thông tin chương */}
        {course && chapter && (
          <div className="chapter-info-step3">
            <div className="breadcrumb-info">
              <span className="breadcrumb-text">
                {course.title} / {chapter.title}
              </span>
            </div>
            <div className="chapter-header-info">
              <div>
                <h1>{chapter.title}</h1>
                {chapter.description && (
                  <p className="chapter-description-text">{chapter.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header bài học */}
        <div className="header-step3">
          <h2>📖 Danh Sách Bài Học ({lessons.length})</h2>
          <button className="btn-add-lesson" onClick={handleOpenAddModal}>
            ➕ Thêm Bài Học Mới
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : lessons.length === 0 ? (
          <div className="no-data">
            <p>Chương này chưa có bài học nào. Hãy tạo bài học đầu tiên!</p>
          </div>
        ) : (
          <div className="lessons-list">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="lesson-item">
                <div className="lesson-number">
                  {lesson.orderIndex || index + 1}
                </div>
                <div className="lesson-details">
                  <h3>{lesson.title}</h3>

                  {/* Thẻ hiển thị trạng thái phê duyệt của bài học */}
                  <div style={{ marginTop: '5px', marginBottom: '8px' }}>
                    {/* Kiểm tra đầy đủ isPublished và status để đảm bảo trạng thái luôn chính xác */}
                    {(lesson.isPublished || (lesson.approvalStatus || lesson.status || '').toUpperCase() === 'APPROVED') ? (
                      <span style={{ padding: '3px 6px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>✅ Đã xuất bản</span>
                    ) : (lesson.approvalStatus || lesson.status || '').toUpperCase() === 'REJECTED' ? (
                      <span style={{ padding: '3px 6px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>❌ Bị từ chối</span>
                    ) : (
                      <span style={{ padding: '3px 6px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>⏳ Chờ phê duyệt</span>
                    )}
                  </div>

                  {lesson.content && (
                    <p className="lesson-content">
                      {lesson.content.substring(0, 100)}
                      {lesson.content.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="lesson-actions">
                  <button
                    className="btn-view-detail"
                    onClick={() => handleViewLessonDetail(lesson.id)}
                    title="Xem chi tiết bài học"
                  >
                    👁️ Xem Chi Tiết
                  </button>
                  <button
                    className="btn-edit-lesson"
                    onClick={() => handleOpenEditModal(lesson)}
                    title="Sửa bài học"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete-lesson"
                    onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                    title="Xóa bài học"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal thêm/sửa bài học */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingLesson ? 'Sửa Bài Học' : 'Thêm Bài Học Mới'}</h2>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveLesson}>
                <div className="form-group">
                  <label>Tên Bài Học *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Nhập tên bài học"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nội Dung Bài Học</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleFormChange}
                    placeholder="Nhập nội dung bài học (tùy chọn)"
                    rows="5"
                  />
                </div>

                <div className="form-group">
                  <label>Thứ Tự Bài Học</label>
                  <input
                    type="number"
                    name="orderIndex"
                    value={formData.orderIndex}
                    onChange={handleFormChange}
                    placeholder="Nhập thứ tự (1, 2, 3...)"
                    min="1"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingLesson ? 'Cập Nhật' : 'Tạo Bài Học'}
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

export default Step3_ChiTietChapter;
