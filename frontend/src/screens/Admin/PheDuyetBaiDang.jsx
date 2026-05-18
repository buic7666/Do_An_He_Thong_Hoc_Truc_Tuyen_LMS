import { useMemo, useState } from 'react';

import './PheDuyetBaiDang.css';
import AdminSidebar from '../../components/AdminSidebar';

const pendingCourses = [
  {
    id: 1,
    title: 'Xây dựng ứng dụng HousePal với Flutter từ A-Z',
    instructor: 'Bui Van Dong',
    submittedDate: '22/03/2026',
    proposedPrice: '599.000đ',
    description:
      'Khóa học hướng dẫn học viên xây dựng hoàn chỉnh ứng dụng quản lý phòng trọ HousePal, sử dụng Flutter cho mobile và Node.js cho backend.',
    syllabus: [
      { title: 'Chương 1: Khởi động và thiết lập môi trường', lessons: '4 Bài giảng' },
      { title: 'Chương 2: Xây dựng UI Đăng nhập và Firebase Auth', lessons: '6 Bài giảng' },
      { title: 'Chương 3: Quản lý State với Provider/Bloc', lessons: '8 Bài giảng' },
      { title: 'Chương 4: Kết nối Real-time Database', lessons: '5 Bài giảng' },
    ],
  },
  {
    id: 2,
    title: 'Trí tuệ nhân tạo: Reinforcement Learning thực chiến',
    instructor: 'Tran Quang Huy',
    submittedDate: '21/03/2026',
    proposedPrice: '749.000đ',
    description:
      'Nội dung tập trung vào xây dựng agent học tăng cường, tối ưu policy và triển khai bài toán thực tế trong game và robot simulation.',
    syllabus: [
      { title: 'Chương 1: Tổng quan RL', lessons: '5 Bài giảng' },
      { title: 'Chương 2: Value-based methods', lessons: '7 Bài giảng' },
      { title: 'Chương 3: Policy Gradient và Actor-Critic', lessons: '6 Bài giảng' },
      { title: 'Chương 4: Project thực chiến', lessons: '4 Bài giảng' },
    ],
  },
  {
    id: 3,
    title: 'Cấu hình hệ thống mạng doanh nghiệp CCNA',
    instructor: 'Nguyen Minh Anh',
    submittedDate: '20/03/2026',
    proposedPrice: '499.000đ',
    description:
      'Khóa học cung cấp lộ trình CCNA từ cơ bản đến nâng cao với lab routing, switching, security và troubleshooting trong doanh nghiệp.',
    syllabus: [
      { title: 'Chương 1: Nền tảng mạng và subnetting', lessons: '6 Bài giảng' },
      { title: 'Chương 2: Routing protocol', lessons: '7 Bài giảng' },
      { title: 'Chương 3: VLAN, STP và EtherChannel', lessons: '5 Bài giảng' },
      { title: 'Chương 4: Security và monitoring', lessons: '4 Bài giảng' },
    ],
  },
];

function PheDuyetBaiDang() {
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [rejectReason, setRejectReason] = useState('');

  const selectedCourse = useMemo(
    () => pendingCourses.find((course) => course.id === selectedCourseId) ?? pendingCourses[0],
    [selectedCourseId],
  );

  const handleApprove = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Đã phê duyệt khóa học: ${selectedCourse.title}`);
  };

  const handleReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập lý do từ chối trước khi gửi.');
      return;
    }

    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Đã từ chối khóa học: ${selectedCourse.title}\nLý do: ${reason}`);
  };

  return (
    <div className="admin-approval-page">
      <AdminSidebar />

      <main className="admin-approval-main-content">
        <section className="admin-approval-list">
          <header className="admin-approval-list-header">
            <h2>Danh sách chờ duyệt ({pendingCourses.length})</h2>
          </header>

          <div className="admin-approval-scrollable-area">
            {pendingCourses.map((course) => (
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
            ))}
          </div>
        </section>

        <section className="admin-approval-preview-panel">
          <div className="admin-approval-preview-content">
            <div className="admin-approval-video-preview">Xem thử video giới thiệu khóa học</div>

            <div className="admin-approval-preview-heading-row">
              <h1>Chi tiết nội dung</h1>
              <div className="admin-approval-price-badge">Giá đề xuất: {selectedCourse.proposedPrice}</div>
            </div>

            <p className="admin-approval-description">Mô tả: {selectedCourse.description}</p>

            <h2 className="admin-approval-section-title">Đề cương chương trình</h2>
            <div className="admin-approval-curriculum-preview">
              {selectedCourse.syllabus.map((item, index) => (
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
        </section>
      </main>
    </div>
  );
}

export default PheDuyetBaiDang;
