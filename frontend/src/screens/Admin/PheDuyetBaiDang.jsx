import { useMemo, useState, useEffect } from 'react';
import { fetchPendingCoursesApi, updateCourseStatusApi } from '../../api/adminApi';

import './PheDuyetBaiDang.css';
import AdminSidebar from '../../components/AdminSidebar';

function PheDuyetBaiDang() {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courses = await fetchPendingCoursesApi();
        setPendingCourses(courses);
        if (courses.length > 0) {
          setSelectedCourseId(courses[0].id);
        }
      } catch (error) {
        console.error('Failed to load pending courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, []);

  const selectedCourse = useMemo(
    () => pendingCourses.find((course) => course.id === selectedCourseId) || null,
    [pendingCourses, selectedCourseId],
  );

  const handleApprove = async () => {
    if (!selectedCourse) return;
    try {
      await updateCourseStatusApi(selectedCourse.id, 'approved', '');
      alert(`Đã phê duyệt khóa học: ${selectedCourse.title}`);
      
      const newCourses = pendingCourses.filter(c => c.id !== selectedCourse.id);
      setPendingCourses(newCourses);
      if (newCourses.length > 0) {
        setSelectedCourseId(newCourses[0].id);
      } else {
        setSelectedCourseId(null);
      }
    } catch (error) {
      console.error('Failed to approve course:', error);
      alert('Có lỗi xảy ra khi phê duyệt.');
    }
  };

  const handleReject = async () => {
    if (!selectedCourse) return;
    const reason = rejectReason.trim();
    if (!reason) {
      alert('Vui lòng nhập lý do từ chối trước khi gửi.');
      return;
    }

    try {
      await updateCourseStatusApi(selectedCourse.id, 'rejected', reason);
      alert(`Đã từ chối khóa học: ${selectedCourse.title}\nLý do: ${reason}`);
      setRejectReason('');
      
      const newCourses = pendingCourses.filter(c => c.id !== selectedCourse.id);
      setPendingCourses(newCourses);
      if (newCourses.length > 0) {
        setSelectedCourseId(newCourses[0].id);
      } else {
        setSelectedCourseId(null);
      }
    } catch (error) {
      console.error('Failed to reject course:', error);
      alert('Có lỗi xảy ra khi từ chối.');
    }
  };

  if (isLoading) {
    return <div className="admin-approval-page"><AdminSidebar /><main className="admin-approval-main-content">Đang tải...</main></div>;
  }

  return (
    <div className="admin-approval-page">
      <AdminSidebar />

      <main className="admin-approval-main-content">
        <section className="admin-approval-list">
          <header className="admin-approval-list-header">
            <h2>Danh sách chờ duyệt ({pendingCourses.length})</h2>
          </header>

          <div className="admin-approval-scrollable-area">
            {pendingCourses.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Không có khóa học nào đang chờ duyệt.</div>
            ) : (
              pendingCourses.map((course) => (
                <article
                  className={`admin-approval-course-item ${course.id === selectedCourseId ? 'active' : ''}`}
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCourseId(course.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="admin-approval-item-title">{course.title}</h3>
                  <div className="admin-approval-item-meta">
                    <span>Giảng viên: {course.instructor}</span>
                    <span>Gửi ngày: {course.submittedDate}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="admin-approval-preview-panel">
          {selectedCourse ? (
            <>
              <div className="admin-approval-preview-content">
                <div className="admin-approval-video-preview">Xem thử video giới thiệu khóa học</div>

                <div className="admin-approval-preview-heading-row">
                  <h1>Chi tiết nội dung</h1>
                  <div className="admin-approval-price-badge">Giá đề xuất: {selectedCourse.proposedPrice}</div>
                </div>

                <p className="admin-approval-description">Mô tả: {selectedCourse.description}</p>

                <h2 className="admin-approval-section-title">Đề cương chương trình</h2>
                <div className="admin-approval-curriculum-preview">
                  {selectedCourse.syllabus && selectedCourse.syllabus.map((item, index) => (
                    <div className="admin-approval-syllabus-item" key={`${selectedCourse.id}-${index + 1}`}>
                      <span>{item.title}</span>
                      <span className="admin-approval-lessons">{item.lessons}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-approval-action-bar">
                <textarea
                  className="admin-approval-reason-textarea"
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Nhập lý do nếu từ chối (gửi tới giảng viên)..."
                  value={rejectReason}
                />
                <div className="admin-approval-btn-group">
                  <button className="admin-approval-btn admin-approval-btn-reject" onClick={handleReject} type="button">
                    Từ chối
                  </button>
                  <button className="admin-approval-btn admin-approval-btn-approve" onClick={handleApprove} type="button">
                    Phê duyệt xuất bản
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-approval-preview-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>Vui lòng chọn một khóa học để xem chi tiết</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PheDuyetBaiDang;
