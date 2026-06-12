import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import httpClient from '../../api/httpClient'; // Giả sử dùng httpClient như bạn đang dùng
import './quanlyPheDuyet.css'; // Bạn có thể tạo file CSS cho đẹp

function QuanLyPheDuyet() {
  const [activeTab, setActiveTab] = useState('courses');
  const [pendingCourses, setPendingCourses] = useState([]);
  const [pendingLessons, setPendingLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy dữ liệu cả Khóa học và Bài học chờ duyệt
  const loadPendingData = async () => {
    setLoading(true);
    try {
      // Đảm bảo endpoint API này đúng với route bạn khai báo ở Backend (Ví dụ: /admin/approvals/pending)
      const res = await httpClient.get('/admin/approvals/pending');
      const data = res.data?.data || {};
      setPendingCourses(data.courses || []);
      setPendingLessons(data.lessons || []);
    } catch (err) {
      console.error(err);
      alert('Không thể tải dữ liệu chờ phê duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingData();
  }, []);

  const handleUpdateStatus = async (type, id, status, title) => {
    const actionText = status === 'APPROVED' ? 'phê duyệt' : 'từ chối';
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} "${title}"?`)) {
      try {
        await httpClient.put(`/admin/approvals/${type}/${id}/status`, { status });
        alert(`Đã ${actionText} thành công.`);
        
        // Xóa item khỏi danh sách chờ duyệt trên state
        if (type === 'course') {
          setPendingCourses(prev => prev.filter(item => item.id !== id));
        } else {
          setPendingLessons(prev => prev.filter(item => item.id !== id));
        }
      } catch (err) {
        console.error(err);
        alert(`Lỗi khi ${actionText}`);
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div style={{ padding: '20px', flex: 1 }}>
        <h1>Phê Duyệt Nội Dung</h1>

        {/* Tabs Điều Hướng */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveTab('courses')} 
            style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'courses' ? '#007bff' : '#e0e0e0', color: activeTab === 'courses' ? '#fff' : '#333', fontWeight: 'bold' }}
          >
            Khóa Học ({pendingCourses.length})
          </button>
          <button 
            onClick={() => setActiveTab('lessons')} 
            style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'lessons' ? '#007bff' : '#e0e0e0', color: activeTab === 'lessons' ? '#fff' : '#333', fontWeight: 'bold' }}
          >
            Bài Học ({pendingLessons.length})
          </button>
        </div>

        {loading ? (
          <p>Đang tải danh sách...</p>
        ) : (
          activeTab === 'courses' ? (
            pendingCourses.length === 0 ? <p>Không có khóa học nào đang chờ phê duyệt.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tên khóa học</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingCourses.map(course => (
                <tr key={course.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{course.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{course.title}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <button onClick={() => handleUpdateStatus('course', course.id, 'APPROVED', course.title)} style={{ marginRight: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>Duyệt</button>
                        <button onClick={() => handleUpdateStatus('course', course.id, 'REJECTED', course.title)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>Từ chối</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            )
          ) : (
            pendingLessons.length === 0 ? <p>Không có bài học nào đang chờ phê duyệt.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tên bài học</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{lesson.id}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{lesson.title}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <button onClick={() => handleUpdateStatus('lesson', lesson.id, 'APPROVED', lesson.title)} style={{ marginRight: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>Duyệt</button>
                        <button onClick={() => handleUpdateStatus('lesson', lesson.id, 'REJECTED', lesson.title)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>Từ chối</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )
        )}
      </div>
    </div>
  );
}

export default QuanLyPheDuyet;