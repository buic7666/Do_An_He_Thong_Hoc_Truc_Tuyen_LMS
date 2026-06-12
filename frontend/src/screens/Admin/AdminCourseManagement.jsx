import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import httpClient from '../../api/httpClient';
import './AdminCourseManagement.css';

function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State cho modal sửa khóa học
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  });

  // State cho modal xét duyệt
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingCourse, setReviewingCourse] = useState(null);
  const [courseChapters, setCourseChapters] = useState([]);
  const [courseLessons, setCourseLessons] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // State phục vụ việc xem chi tiết bài học trong modal xét duyệt
  const [selectedReviewItem, setSelectedReviewItem] = useState({ type: 'course' });
  const [lessonSegments, setLessonSegments] = useState({});
  const [loadingSegments, setLoadingSegments] = useState({});

  // Hàm tải danh sách khóa học từ API Admin
  const loadCourses = async () => {
    setLoading(true);
    try {
      // Đảm bảo endpoint này khớp với route backend của Admin
      const response = await httpClient.get('/admin/courses');
      const allCourses = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCourses(allCourses);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Xử lý Phê duyệt / Từ chối
 const handleApproveStatus = async (courseId, newStatus) => {
    try {
      // SỬA ĐƯỜNG DẪN API: Bỏ chữ "/status" ở cuối đi để khớp với params /:type/:id của Backend
      await httpClient.put(`/admin/approvals/course/${courseId}`, { status: newStatus.toUpperCase() });
      alert(`Đã ${newStatus === 'APPROVED' ? 'phê duyệt' : 'từ chối'} khóa học thành công!`);
      
      // Cập nhật trạng thái trên UI ngay lập tức để admin nhìn thấy
      setReviewingCourse(prev => ({ 
        ...prev, 
        approvalStatus: newStatus.toUpperCase(), 
        status: newStatus.toLowerCase(), 
        isPublished: newStatus === 'APPROVED' 
      }));
      
      // === ĐỒNG BỘ THÊM ĐOẠN NÀY ĐỂ BÀI HỌC ĐỔI TRẠNG THÁI LUÔN TRÊN GIAO DIỆN ===
      if (newStatus.toUpperCase() === 'APPROVED') {
        setCourseLessons(prev => prev.map(l => ({
          ...l,
          approvalStatus: 'APPROVED',
          status: 'approved',
          isPublished: true
        })));
      } else if (newStatus.toUpperCase() === 'REJECTED') {
        setCourseLessons(prev => prev.map(l => ({
          ...l,
          approvalStatus: 'REJECTED',
          status: 'rejected',
          isPublished: false
        })));
      }

      loadCourses(); // Tải lại danh sách bảng ngoài admin
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // 2. XỬ LÝ PHÊ DUYỆT / TỪ CHỐI BÀI HỌC CỤ THỂ
  const handleApproveLesson = async (lessonId, newStatus) => {
    try {
      // 1. Bắn request lên Backend Router đã bỏ đuôi /status
      await httpClient.put(`/admin/approvals/lesson/${lessonId}`, { status: newStatus.toUpperCase() });
      alert(`Đã ${newStatus === 'APPROVED' ? 'phê duyệt' : 'từ chối'} bài học thành công!`);
      
      // Ép kiểu ID về dạng Number để đồng bộ tuyệt đối với Database
      const targetLessonId = Number(lessonId);

      // 2. Cập nhật state danh sách cây bài học bên trái để chuyển màu Badge thành APPROVED/REJECTED
      setCourseLessons(prev => prev.map(l => 
        Number(l.id) === targetLessonId ? { 
          ...l, 
          approvalStatus: newStatus.toUpperCase(), 
          status: newStatus.toLowerCase(), 
          isPublished: newStatus === 'APPROVED' 
        } : l
      ));

      // 3. Ép cập nhật object chi tiết bên phải (Thêm mốc thời gian timestamp để ép React re-render trực tiếp)
      setSelectedReviewItem(prev => {
        if (Number(prev.id) === targetLessonId) {
          return { 
            ...prev, 
            _updatedAt: new Date().getTime() 
          };
        }
        return prev;
      });

    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái bài học');
    }
  };

  // Xóa khóa học
  const handleDelete = async (courseId, courseTitle) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn khóa học "${courseTitle}" không?`)) {
      try {
        await httpClient.delete(`/admin/courses/${courseId}`);
        alert('Đã xóa khóa học thành công!');
        loadCourses();
      } catch (err) {
        alert(err?.response?.data?.message || 'Lỗi khi xóa khóa học');
      }
    }
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

  // Mở modal xét duyệt
  const handleOpenReviewModal = async (course) => {
    setReviewingCourse(course);
    setShowReviewModal(true);
    setSelectedReviewItem({ type: 'course' });
    setCourseChapters([]);
    setCourseLessons([]);
    setLoadingDetails(true);
    
    try {
      // Tải danh sách bài học đầy đủ
      const lessonsRes = await httpClient.get(`/admin/teacher/full-lessons/${course.id}?t=${new Date().getTime()}`);
      const lessonsData = Array.isArray(lessonsRes?.data?.data) ? lessonsRes.data.data : [];
      setCourseLessons(lessonsData);

      // Cố gắng tải danh sách chương học
      let chaptersData = [];
      try {
        const courseRes = await httpClient.get(`/courses/${course.id}`);
        const courseDetail = courseRes?.data?.data || courseRes?.data || {};
        if (Array.isArray(courseDetail.chapters)) chaptersData = courseDetail.chapters;
        else if (Array.isArray(courseDetail.Chapters)) chaptersData = courseDetail.Chapters;
      } catch (e) {
        console.error(e);
      }

      // Dự phòng nếu chưa có chapters
      if (chaptersData.length === 0) {
        try {
          const chapRes = await httpClient.get(`/courses/${course.id}/chapters`);
          if (Array.isArray(chapRes?.data?.data)) chaptersData = chapRes.data.data;
        } catch (err) {}
      }
      setCourseChapters(chaptersData);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết khóa học:", err);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Hàm xử lý chọn bài học để xem chi tiết
  const handleSelectLesson = async (lessonId) => {
    setSelectedReviewItem({ type: 'lesson', id: lessonId });
    if (!lessonSegments[lessonId]) {
      setLoadingSegments(prev => ({ ...prev, [lessonId]: true }));
      try {
        const res = await httpClient.get(`/lessons/${lessonId}/segments`);
        setLessonSegments(prev => ({ ...prev, [lessonId]: res?.data?.data || [] }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSegments(prev => ({ ...prev, [lessonId]: false }));
      }
    }
  };

  // Hàm render giao diện chi tiết của bài học (cột bên phải)
  const renderLessonDetails = () => {
    const lessonId = selectedReviewItem.id;
    // Ép kiểu cả 2 vế về Number khi .find() để tránh bug ngầm của React
    const lesson = courseLessons.find(l => Number(l.id) === Number(lessonId));
    
    if (!lesson) return <div>Không tìm thấy bài học</div>;
    const segments = lessonSegments[lessonId] || [];
    const isSegmentsLoading = loadingSegments[lessonId]; // Đổi tên để không bị trùng với bảng ngoài

    return (
      <div>
        <h3 style={{ marginBottom: '15px', color: '#0050b3' }}>Bài học: {lesson.title}</h3>
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px 15px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
          <span className={`status-badge ${(lesson.approvalStatus || lesson.status || (lesson.isPublished ? 'APPROVED' : 'PENDING')).toLowerCase()}`}>
            Trạng thái: {(lesson.approvalStatus || lesson.status || (lesson.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase()}
          </span>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {((lesson.approvalStatus || lesson.status || '').toUpperCase() !== 'APPROVED' || !lesson.isPublished) && (
              <button 
                type="button"
                onClick={() => handleApproveLesson(lesson.id, 'APPROVED')}
                style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Duyệt Bài Học
              </button>
            )}
            {((lesson.approvalStatus || lesson.status || '').toUpperCase() !== 'REJECTED') && (
              <button 
                type="button"
                onClick={() => handleApproveLesson(lesson.id, 'REJECTED')}
                style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Từ Chối
              </button>
            )}
          </div>
        </div>
        
        {lesson.videoUrl && (
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <h4 style={{ marginBottom: '8px', color: '#495057' }}>Video bài học:</h4>
            <a href={lesson.videoUrl} target="_blank" rel="noreferrer" style={{ color: '#1890ff', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '18px' }}>▶</span> Xem Video Gốc
            </a>
        </div>
        )}
        
        {lesson.content && (
          <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <h4 style={{ marginBottom: '8px', color: '#495057' }}>Nội dung / Mô tả bài học:</h4>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>{lesson.content}</div>
          </div>
        )}

        <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '8px', marginBottom: '15px', color: '#333' }}>
          Các phần học (Segments) chi tiết
        </h4>
        
        {isSegmentsLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Đang tải nội dung phần học...</div>
        ) : segments.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px', color: '#888', fontStyle: 'italic' }}>
            Chưa có phần học (segment) nào trong bài này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {segments.map((seg, idx) => (
              <div key={seg.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ backgroundColor: '#f1f3f5', padding: '12px 15px', fontWeight: 'bold', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phần {seg.orderIndex || idx + 1}: {seg.title}</span>
                </div>
                <div style={{ padding: '15px' }}>
                  {(seg.contentItems || []).length === 0 ? (
                    <div style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>Không có nội dung chi tiết</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {seg.contentItems.map((item, iIdx) => (
                        <div key={iIdx} style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '6px', fontSize: '14px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '16px' }}>
                              {item.type === 'videoClip' ? '🎬' : item.type === 'document' ? '📎' : item.type === 'quiz' ? '🧪' : item.type === 'question' ? '❓' : '📝'}
                            </span>
                            {item.type === 'videoClip' ? 'Video' : item.type === 'document' ? 'Tài liệu' : item.type === 'quiz' ? 'Bài tập' : item.type === 'question' ? 'Câu hỏi' : 'Text'}
                            {item.title ? ` - ${item.title}` : ''}
                          </div>
                          
                          {item.type === 'videoClip' && item.resourceUrl && (
                            <div style={{ fontSize: '13px', color: '#666', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                              <a href={item.resourceUrl} target="_blank" rel="noreferrer" style={{ color: '#1890ff', textDecoration: 'none', fontWeight: 'bold' }}>▶ Xem Video</a>
                              {(item.startTime != null || item.endTime != null) && (
                                <span style={{ marginLeft: '10px' }}>(Đoạn từ {item.startTime || 0}s đến {item.endTime || 'Hết'})</span>
                              )}
                            </div>
                          )}
                          
                          {item.type === 'document' && item.resourceUrl && (
                            <div style={{ fontSize: '13px', color: '#666', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                              <a href={item.resourceUrl} target="_blank" rel="noreferrer" style={{ color: '#1890ff', textDecoration: 'none', fontWeight: 'bold' }}>📎 Tải xuống / Xem tài liệu</a>
                            </div>
                          )}
                          
                          {item.type === 'text' && item.content && (
                            <div style={{ fontSize: '14px', color: '#444', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                              {item.content}
                            </div>
                          )}
                          
                          {(item.type === 'quiz' || item.type === 'question') && (
                            <div style={{ fontSize: '13px', color: '#0050b3', backgroundColor: '#e6f7ff', padding: '10px', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                              {item.randomize ? `Random ${item.randomCount} câu từ ngân hàng` : `${(item.questionIds || item.questionTitles || []).length} câu hỏi đã chọn cố định`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Lưu thay đổi
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      await httpClient.put(`/admin/courses/${editingCourse.id}`, formData);
      alert('Cập nhật thông tin khóa học thành công!');
      setShowModal(false);
      loadCourses();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi cập nhật khóa học');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Quản Lý Khóa Học</h1>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Đang tải danh sách...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Khóa Học</th>
                <th>Giảng Viên</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.id}</td>
                  <td>{course.title}</td>
                  <td>{course.User?.name || course.instructor?.name || 'Không rõ'}</td>
                  <td>
                    {/* Hỗ trợ lấy field status (của API cũ) hoặc approvalStatus để hiển thị */}
                    <span className={`status-badge ${(course.approvalStatus || course.status || (course.isPublished ? 'APPROVED' : 'PENDING')).toLowerCase()}`}>
                      {(course.approvalStatus || course.status || (course.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {/* Nút Xét duyệt gộp chung */}
                    <button 
                      className="btn-approve" 
                      style={{ backgroundColor: '#17a2b8', marginRight: '8px' }} 
                      onClick={() => handleOpenReviewModal(course)}
                    >
                      Xét duyệt
                    </button>
                    <button className="btn-edit" onClick={() => handleOpenEditModal(course)}>Sửa</button>
                    <button className="btn-delete" onClick={() => handleDelete(course.id, course.title)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal Sửa */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Sửa Thông Tin Khóa Học</h2>
              <form onSubmit={handleSaveCourse}>
                <div className="form-group">
                  <label>Tên Khóa Học:</label>
                  <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Mô Tả:</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange} rows="4" />
                </div>
                <div className="form-group">
                  <label>Giá (VNĐ):</label>
                  <input type="number" name="price" value={formData.price} onChange={handleFormChange} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn-submit">Lưu Thay Đổi</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xét duyệt (Xem chi tiết trước khi ra quyết định) */}
        {showReviewModal && reviewingCourse && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '1000px', maxWidth: '95%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h2>Xét Duyệt Khóa Học</h2>
                <button type="button" onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                {/* CỘT TRÁI: CẤU TRÚC KHÓA HỌC */}
                <div>
                  <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                    <button 
                      onClick={() => setSelectedReviewItem({ type: 'course' })}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: selectedReviewItem.type === 'course' ? '#0050b3' : '#333',
                        textDecoration: selectedReviewItem.type === 'course' ? 'underline' : 'none',
                        padding: 0
                      }}
                    >
                      Chương Trình Giảng Dạy
                    </button>
                  </h3>
                  
                  {loadingDetails ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Đang tải cấu trúc khóa học...</div>
                  ) : (
                    <div className="curriculum-preview">
                      {courseChapters.length === 0 && courseLessons.length === 0 ? (
                        <p style={{ color: '#dc3545', fontStyle: 'italic', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                          ⚠️ Khóa học này chưa có nội dung (chưa có chương và bài học). Bạn nên nhắc giảng viên thêm nội dung trước khi duyệt.
                        </p>
                      ) : (
                        <>
                          {courseChapters.sort((a, b) => a.orderIndex - b.orderIndex).map((chap, idx) => {
                            const chapLessons = courseLessons.filter(l => String(l.chapterId) === String(chap.id)).sort((a, b) => a.orderIndex - b.orderIndex);
                            return (
                              <div key={chap.id} style={{ marginBottom: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', padding: '12px 15px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Chương {chap.orderIndex || idx + 1}: {chap.title}</span>
                                  <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#666' }}>{chapLessons.length} bài học</span>
                                </div>
                                <div style={{ padding: '0 15px' }}>
                                  {chapLessons.length === 0 && <div style={{ padding: '10px 0', fontSize: '14px', color: '#999', fontStyle: 'italic' }}>Chưa có bài học trong chương này</div>}
                                  {chapLessons.map((lesson, lIdx) => (
                                    <div 
                                      key={lesson.id} 
                                      onClick={() => handleSelectLesson(lesson.id)}
                                      style={{ 
                                        padding: '12px 10px', 
                                        borderBottom: lIdx < chapLessons.length - 1 ? '1px dashed #eee' : 'none', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: selectedReviewItem.id === lesson.id ? '#e6f7ff' : 'transparent',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.2s'
                                      }}
                                      onMouseEnter={(e) => { if (selectedReviewItem.id !== lesson.id) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                                      onMouseLeave={(e) => { if (selectedReviewItem.id !== lesson.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: selectedReviewItem.id === lesson.id ? '#1890ff' : 'inherit' }}>
                                        <span style={{ color: '#888' }}>Bài {lesson.orderIndex || lIdx + 1}:</span>
                                        <strong style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</strong>
                                      </div>
                                      <span className={`status-badge ${(lesson.approvalStatus || lesson.status || (lesson.isPublished ? 'APPROVED' : 'PENDING')).toLowerCase()}`} style={{ fontSize: '11px', padding: '3px 6px' }}>
                                        {(lesson.approvalStatus || lesson.status || (lesson.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                          {courseLessons.filter(l => !l.chapterId).length > 0 && (
                            <div style={{ marginBottom: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ fontWeight: 'bold', backgroundColor: '#fff3cd', padding: '12px 15px', borderBottom: '1px solid #e0e0e0' }}>
                                Các bài học chưa phân chương
                              </div>
                              <div style={{ padding: '0 15px' }}>
                                {courseLessons.filter(l => !l.chapterId).sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, lIdx, arr) => (
                                  <div 
                                    key={lesson.id} 
                                    onClick={() => handleSelectLesson(lesson.id)}
                                    style={{ 
                                      padding: '12px 10px', 
                                      borderBottom: lIdx < arr.length - 1 ? '1px dashed #eee' : 'none', 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      backgroundColor: selectedReviewItem.id === lesson.id ? '#e6f7ff' : 'transparent',
                                      borderRadius: '4px',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => { if (selectedReviewItem.id !== lesson.id) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                                    onMouseLeave={(e) => { if (selectedReviewItem.id !== lesson.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: selectedReviewItem.id === lesson.id ? '#1890ff' : 'inherit' }}>
                                      <span style={{ color: '#888' }}>Bài {lesson.orderIndex || lIdx + 1}:</span>
                                      <strong style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</strong>
                                    </div>
                                    <span className={`status-badge ${(lesson.approvalStatus || lesson.status || (lesson.isPublished ? 'APPROVED' : 'PENDING')).toLowerCase()}`} style={{ fontSize: '11px', padding: '3px 6px' }}>
                                      {(lesson.approvalStatus || lesson.status || (lesson.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* CỘT PHẢI: CHI TIẾT (KHÓA HỌC HOẶC BÀI HỌC) */}
                <div style={{ borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                  {selectedReviewItem.type === 'course' ? (
                    <div>
                      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: '#0050b3' }}>Thông Tin Chung Khóa Học</h3>
                      <p style={{ marginBottom: '12px' }}><strong>Tên khóa học:</strong> {reviewingCourse.title}</p>
                      <p style={{ marginBottom: '12px' }}><strong>Giảng viên:</strong> {reviewingCourse.User?.name || reviewingCourse.instructor?.name || 'Không rõ'}</p>
                      <p style={{ marginBottom: '12px' }}><strong>Giá:</strong> {reviewingCourse.price ? `${Number(reviewingCourse.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}</p>
                      <p style={{ marginBottom: '12px' }}><strong>Trạng thái hiện tại:</strong> <span className={`status-badge ${(reviewingCourse.approvalStatus || reviewingCourse.status || (reviewingCourse.isPublished ? 'APPROVED' : 'PENDING')).toLowerCase()}`}>{(reviewingCourse.approvalStatus || reviewingCourse.status || (reviewingCourse.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase()}</span></p>
                      
                      <div style={{ marginTop: '20px' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Mô tả khóa học:</strong></p>
                        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {reviewingCourse.description || 'Không có mô tả'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    renderLessonDetails()
                  )}
                </div>
              </div>
              
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>Đóng</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {((reviewingCourse.approvalStatus || reviewingCourse.status || '').toUpperCase() !== 'REJECTED') && (
                    <button 
                      type="button" 
                      className="btn-reject" 
                      onClick={() => handleApproveStatus(reviewingCourse.id, 'REJECTED')}
                    >
                      Từ chối Khóa học
                    </button>
                  )}
                  {((reviewingCourse.approvalStatus || reviewingCourse.status || '').toUpperCase() !== 'APPROVED' || !reviewingCourse.isPublished) && (
                    <button 
                      type="button" 
                      className="btn-approve" 
                      onClick={() => handleApproveStatus(reviewingCourse.id, 'APPROVED')}
                    >
                      Phê duyệt Xuất bản Khóa học
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCourseManagement;