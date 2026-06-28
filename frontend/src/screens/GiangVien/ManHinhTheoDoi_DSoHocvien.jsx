import { useMemo, useState } from 'react';
import { useEffect } from 'react';

import './ManHinhTheoDoi_DSoHocvien.css';
import TeacherSidebar from '../../components/TeacherSidebar';
import { fetchTeacherDashboardApi, sendTeacherStudentMessageApi } from '../../api/teacherApi';

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
};

const getInitial = (name) => (name || 'H').trim().charAt(0).toUpperCase();

function ManHinhTheoDoiDSoHocvien() {
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTeacherDashboardApi();
        setEnrollments(Array.isArray(data?.enrollments) ? data.enrollments : []);
      } catch (_error) {
        setEnrollments([]);
      }
    };

    loadData();
  }, []);

  const courses = useMemo(() => {
    const names = [...new Set(enrollments.map((item) => item.courseName).filter(Boolean))];
    return names;
  }, [enrollments]);

  const filteredStudents = useMemo(() => {
    const normalized = searchKeyword.trim().toLowerCase();

    return enrollments.filter((student) => {
      const matchCourse = selectedCourse === 'all' ? true : student.courseName === selectedCourse;
      const matchKeyword = normalized ? (student.studentName || '').toLowerCase().includes(normalized) : true;
      return matchCourse && matchKeyword;
    });
  }, [enrollments, searchKeyword, selectedCourse]);

  const getProgressValue = (student) => {
    const value = Number(student?.progressPercent || 0);
    if (!Number.isFinite(value) || value < 0) return 0;
    if (value > 100) return 100;
    return value;
  };

  const getProgressLabel = (student) => {
    const progressValue = getProgressValue(student);
    const completedLessons = Number(student?.completedLessons || 0);
    const totalLessons = Number(student?.totalLessons || 0);
    return totalLessons > 0 ? `${completedLessons}/${totalLessons} bài học` : 'Chưa có bài học';
  };

  const getStatusLabel = (student) => {
    return getProgressValue(student) >= 100 ? 'Hoàn thành' : 'Đang học';
  };

  const openMessageModal = (student) => {
    setSelectedStudent(student);
    setMessageContent('');
    setMessageStatus('');
  };

  const closeMessageModal = () => {
    if (isSendingMessage) return;
    setSelectedStudent(null);
    setMessageContent('');
    setMessageStatus('');
  };

  const sendMessage = async () => {
    const trimmedMessage = messageContent.trim();
    if (!selectedStudent || !trimmedMessage) {
      setMessageStatus('Vui lòng nhập nội dung tin nhắn.');
      return;
    }

    setIsSendingMessage(true);
    setMessageStatus('');

    try {
      await sendTeacherStudentMessageApi({
        userId: selectedStudent.userId,
        courseId: selectedStudent.courseId,
        message: trimmedMessage,
      });
      setMessageStatus('Đã gửi tin nhắn. Nội dung đã được lưu vào lịch sử tương tác học viên.');
      setMessageContent('');
    } catch (error) {
      setMessageStatus(error?.response?.data?.message || 'Không thể gửi tin nhắn cho học viên.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="instructor-progress-page">
      <TeacherSidebar />

      <main className="instructor-progress-main-content">
        <div className="instructor-progress-page-header">
          <h1 className="instructor-progress-page-title">Tien do Hoc vien</h1>

          <div className="instructor-progress-toolbar">
            <div className="instructor-progress-filter-group">
              <label className="instructor-progress-filter-label" htmlFor="course-filter">
                Chon khoa hoc:
              </label>
              <select
                className="instructor-progress-form-select"
                id="course-filter"
                onChange={(event) => setSelectedCourse(event.target.value)}
                value={selectedCourse}
              >
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
                <option value="all">Tat ca khoa hoc</option>
              </select>
            </div>

            <div>
              <input
                className="instructor-progress-form-input"
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tim kiem ten hoc vien..."
                type="text"
                value={searchKeyword}
              />
            </div>
          </div>
        </div>

        <div className="instructor-progress-table-card">
          <table className="instructor-progress-data-table">
            <thead>
              <tr>
                <th>Hoc vien</th>
                <th>Ngay dang ky</th>
                <th>Tien do hoc tap</th>
                <th>Diem bai thi</th>
                <th>Trang thai</th>
                <th className="center">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="instructor-progress-student-cell">
                      <div className="instructor-progress-student-avatar">{getInitial(student.studentName)}</div>
                      <div>
                        <div className="instructor-progress-student-name">{student.studentName}</div>
                        <div className="instructor-progress-student-email">{student.studentEmail || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(student.createdAt)}</td>
                  <td>
                    <div className="instructor-progress-progress-wrapper">
                      <div className="instructor-progress-progress-text">{`${getProgressValue(student)}%`}</div>
                      <div className="instructor-progress-progress-track">
                        <div
                          className="instructor-progress-progress-fill"
                          style={{ width: `${getProgressValue(student)}%` }}
                        />
                      </div>
                      <div className="instructor-progress-progress-detail">{getProgressLabel(student)}</div>
                    </div>
                  </td>
                  <td className="instructor-progress-score-text muted">Chua cap nhat</td>
                  <td>
                    <span
                      className={`instructor-progress-status-badge ${
                        getProgressValue(student) >= 100
                          ? 'instructor-progress-status-complete'
                          : 'instructor-progress-status-learning'
                      }`}
                    >
                      {getStatusLabel(student)}
                    </span>
                  </td>
                  <td className="center">
                    <button className="instructor-progress-btn-action" onClick={() => openMessageModal(student)} title="Gui tin nhan" type="button">
                      M
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredStudents.length ? (
                <tr>
                  <td colSpan={6}>Chua co hoc vien phu hop bo loc.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {selectedStudent ? (
          <div className="instructor-progress-modal-backdrop" role="presentation" onMouseDown={closeMessageModal}>
            <section
              aria-labelledby="student-message-title"
              className="instructor-progress-message-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
            >
              <header className="instructor-progress-message-header">
                <div>
                  <h2 id="student-message-title">Gửi tin nhắn học viên</h2>
                  <p>{selectedStudent.studentName} • {selectedStudent.courseName}</p>
                </div>
                <button
                  aria-label="Đóng"
                  className="instructor-progress-modal-close"
                  disabled={isSendingMessage}
                  onClick={closeMessageModal}
                  type="button"
                >
                  ×
                </button>
              </header>

              <div className="instructor-progress-message-recipient">
                <div className="instructor-progress-student-avatar">{getInitial(selectedStudent.studentName)}</div>
                <div>
                  <strong>{selectedStudent.studentName}</strong>
                  <span>{selectedStudent.studentEmail || 'Không có email'}</span>
                </div>
              </div>

              <textarea
                className="instructor-progress-message-textarea"
                disabled={isSendingMessage}
                onChange={(event) => setMessageContent(event.target.value)}
                placeholder="Nhập nội dung cần nhắn cho học viên..."
                value={messageContent}
              />

              {messageStatus ? <p className="instructor-progress-message-status">{messageStatus}</p> : null}

              <footer className="instructor-progress-message-actions">
                <button className="instructor-progress-btn-secondary" disabled={isSendingMessage} onClick={closeMessageModal} type="button">
                  Đóng
                </button>
                <button className="instructor-progress-btn-primary" disabled={isSendingMessage || !messageContent.trim()} onClick={sendMessage} type="button">
                  {isSendingMessage ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default ManHinhTheoDoiDSoHocvien;
