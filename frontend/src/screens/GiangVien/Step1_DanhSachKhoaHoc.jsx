import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import { createCourseApi, deleteCourseApi } from '../../api/teacherManagementApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import './Step1_DanhSachKhoaHoc.css';

function Step1_DanhSachKhoaHoc() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserSafely());
  
  // State cho modal thêm/sửa khóa học
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  });

  const isOwnedByCurrentTeacher = (course) => {
    if (!course || !currentUser) {
      return false;
    }

    const courseOwnerId = course.instructor?.id ?? course.instructorId ?? course.teacherId ?? course.createdBy;
    return Number(courseOwnerId) === Number(currentUser.id);
  };

  // Lấy danh sách khóa học
  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await httpClient.get('/courses');
      const allCourses = Array.isArray(response?.data?.data) ? response.data.data : [];

      // Chỉ hiển thị khóa học thuộc giáo viên đang đăng nhập
      setCourses(allCourses.filter((course) => isOwnedByCurrentTeacher(course)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách khóa học');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [currentUser?.id]);

  // Mở modal thêm khóa học
  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormData({ title: '', description: '', price: '' });
    setShowModal(true);
  };

  // Mở modal sửa khóa học
  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      price: course.price || ''
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

  // Lưu khóa học (thêm mới hoặc sửa)
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên khóa học');
      return;
    }

    try {
      if (editingCourse) {
        // Sửa khóa học
        await httpClient.put(`/courses/${editingCourse.id}`, formData);
        alert('Cập nhật khóa học thành công');
      } else {
        // Thêm khóa học mới
        await createCourseApi(formData);
        alert('Tạo khóa học thành công');
      }
      setShowModal(false);
      setFormData({ title: '', description: '', price: '' });
      await loadCourses();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu khóa học');
    }
  };

  // Xóa khóa học
  const handleDeleteCourse = async (courseId, courseName) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa khóa học "${courseName}"?`)) {
      try {
        await deleteCourseApi(courseId);
        alert('Xóa khóa học thành công');
        await loadCourses();
      } catch (err) {
        alert(err?.response?.data?.message || 'Lỗi khi xóa khóa học');
      }
    }
  };

  // Vào chi tiết khóa học (step 2)
  const handleEnterCourse = (courseId) => {
    navigate(`/teacher/courses/${courseId}/chapters`);
  };

  return (
    <div className="container-step1">
      <TeacherSidebar />
      <div className="content-step1">
        <div className="header-step1">
          <h1>Quản Lý Khóa Học</h1>
          <button className="btn-add-course" onClick={handleOpenAddModal}>
            ➕ Thêm Khóa Học Mới
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : courses.length === 0 ? (
          <div className="no-data">
            <p>Bạn chưa có khóa học nào. Hãy tạo khóa học mới!</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className="course-price">
                    {course.price ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                  </span>
                </div>
                
                <p className="course-description">
                  {course.description || 'Không có mô tả'}
                </p>

                <div className="course-actions">
                  <button
                    className="btn-enter"
                    onClick={() => handleEnterCourse(course.id)}
                  >
                    📚 Vào Khóa Học
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenEditModal(course)}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal thêm/sửa khóa học */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCourse ? 'Sửa Khóa Học' : 'Thêm Khóa Học Mới'}</h2>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveCourse}>
                <div className="form-group">
                  <label>Tên Khóa Học *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Nhập tên khóa học"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Nhập mô tả khóa học"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Giá (VNĐ)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="Nhập giá hoặc để trống nếu miễn phí"
                    min="0"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingCourse ? 'Cập Nhật' : 'Tạo Khóa Học'}
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

export default Step1_DanhSachKhoaHoc;
