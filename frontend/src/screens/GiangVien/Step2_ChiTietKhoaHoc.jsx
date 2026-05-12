import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import {
  getCourseChaptersApi,
  createCourseChapterApi,
  updateCourseChapterApi,
  deleteChapterApi
} from '../../api/teacherManagementApi';
import './Step2_ChiTietKhoaHoc.css';

function Step2_ChiTietKhoaHoc() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State cho modal thêm/sửa chương
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderIndex: ''
  });

  // Lấy chi tiết khóa học
  const loadCourseDetail = async () => {
    try {
      const response = await httpClient.get(`/courses/${courseId}`);
      setCourse(response?.data?.data || response?.data);
    } catch (err) {
      setError('Không thể tải chi tiết khóa học');
      console.error(err);
    }
  };

  // Lấy danh sách chương
  const loadChapters = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await getCourseChaptersApi(courseId);
      setChapters(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách chương');
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourseDetail();
      loadChapters();
    }
  }, [courseId]);

  // Mở modal thêm chương
  const handleOpenAddModal = () => {
    setEditingChapter(null);
    setFormData({ title: '', description: '', orderIndex: '' });
    setShowModal(true);
  };

  // Mở modal sửa chương
  const handleOpenEditModal = (chapter) => {
    setEditingChapter(chapter);
    setFormData({
      title: chapter.title || '',
      description: chapter.description || '',
      orderIndex: chapter.orderIndex || ''
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

  // Lưu chương (thêm mới hoặc sửa)
  const handleSaveChapter = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên chương');
      return;
    }

    try {
      if (editingChapter) {
        // Sửa chương
        await updateCourseChapterApi(editingChapter.id, formData);
        alert('Cập nhật chương thành công');
      } else {
        // Thêm chương mới
        await createCourseChapterApi(courseId, formData);
        alert('Tạo chương thành công');
      }
      setShowModal(false);
      setFormData({ title: '', description: '', orderIndex: '' });
      await loadChapters();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu chương');
    }
  };

  // Xóa chương
  const handleDeleteChapter = async (chapterId, chapterTitle) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa chương "${chapterTitle}"?`)) {
      try {
        await deleteChapterApi(chapterId);
        alert('Xóa chương thành công');
        await loadChapters();
      } catch (err) {
        alert(err?.response?.data?.message || 'Lỗi khi xóa chương');
      }
    }
  };

  // Vào chi tiết chương (step 3)
  const handleEnterChapter = (chapterId) => {
    navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons`);
  };

  return (
    <div className="container-step2">
      <TeacherSidebar />
      <div className="content-step2">
        {/* Breadcrumb */}
        <div className="breadcrumb-step2">
          <button onClick={() => navigate('/teacher/courses')} className="btn-back">
            <span className="back-icon">←</span>
            <span className="back-text">Quay lại danh sách khóa học</span>
          </button>
        </div>

        {/* Thông tin khóa học */}
        {course && (
          <div className="course-info-step2">
            <div className="course-header-info">
              <div>
                <h1>{course.title}</h1>
                <p className="course-instructor">
                  Giảng viên: {course.instructor?.name || 'N/A'}
                </p>
              </div>
              <span className="course-price-step2">
                {course.price ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
              </span>
            </div>
            {course.description && (
              <p className="course-description-step2">{course.description}</p>
            )}
          </div>
        )}

        {/* Header chương học */}
        <div className="header-step2">
          <h2>📚 Danh Sách Chương Học ({chapters.length})</h2>
          <button className="btn-add-chapter" onClick={handleOpenAddModal}>
            ➕ Thêm Chương Mới
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : chapters.length === 0 ? (
          <div className="no-data">
            <p>Khóa học này chưa có chương nào. Hãy tạo chương đầu tiên!</p>
          </div>
        ) : (
          <div className="chapters-list">
            {chapters.map((chapter, index) => (
              <div key={chapter.id} className="chapter-item">
                <div className="chapter-number">
                  {chapter.orderIndex || index + 1}
                </div>
                <div className="chapter-details">
                  <h3>{chapter.title}</h3>
                  {chapter.description && (
                    <p className="chapter-description">{chapter.description}</p>
                  )}
                </div>
                <div className="chapter-actions">
                  <button
                    className="btn-view"
                    onClick={() => handleEnterChapter(chapter.id)}
                    title="Xem bài học trong chương này"
                  >
                    📖 Xem Bài
                  </button>
                  <button
                    className="btn-edit-chapter"
                    onClick={() => handleOpenEditModal(chapter)}
                    title="Sửa chương"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete-chapter"
                    onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                    title="Xóa chương"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal thêm/sửa chương */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingChapter ? 'Sửa Chương' : 'Thêm Chương Mới'}</h2>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveChapter}>
                <div className="form-group">
                  <label>Tên Chương *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Nhập tên chương"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Nhập mô tả chương (tùy chọn)"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Thứ Tự Chương</label>
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
                    {editingChapter ? 'Cập Nhật' : 'Tạo Chương'}
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

export default Step2_ChiTietKhoaHoc;
