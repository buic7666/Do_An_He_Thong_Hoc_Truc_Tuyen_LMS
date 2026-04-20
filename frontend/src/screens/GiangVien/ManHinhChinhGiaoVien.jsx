import './ManHinhChinhGiaoVien.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeacherDashboardApi } from '../../api/teacherApi';
import { logout } from '../../utils/authSession';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const getInitial = (name) => (name || 'H').trim().charAt(0).toUpperCase();

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
};

function ManHinhChinhGiaoVien() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchTeacherDashboardApi();
        setDashboardData(data || null);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không thể tải dữ liệu dashboard giảng viên.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const maxMonthlyRevenue = useMemo(() => {
    const values = (dashboardData?.monthlyRevenue || []).map((item) => Number(item.amount || 0));
    return Math.max(...values, 1);
  }, [dashboardData]);

  const handleLogout = () => {
    logout({ navigate });
  };

  const goTo = (path) => () => navigate(path);

  const stats = dashboardData?.stats || {};
  const recentEnrollments = dashboardData?.recentEnrollments || [];
  const monthlyRevenue = dashboardData?.monthlyRevenue || [];

  return (
    <div className="instructor-dashboard-page">
      <aside className="instructor-dashboard-sidebar">
        <div className="instructor-dashboard-brand">
          <div className="instructor-dashboard-brand-icon">L</div>
          <span>LMS Admin</span>
        </div>

        <ul className="instructor-dashboard-nav-menu">
          <li>
            <button className="instructor-dashboard-nav-link active" onClick={goTo('/teacher/dashboard')} type="button">
              Tổng quan
            </button>
          </li>
          <li>
            <button className="instructor-dashboard-nav-link" onClick={goTo('/teacher/courses')} type="button">
              Quản lý khóa học
            </button>
          </li>
          <li>
            <button className="instructor-dashboard-nav-link" onClick={goTo('/teacher/questions')} type="button">
              Ngân hàng câu hỏi
            </button>
          </li>
          <li>
            <button className="instructor-dashboard-nav-link" onClick={goTo('/teacher/students')} type="button">
              Quản lý học viên
            </button>
          </li>
          <li>
            <button className="instructor-dashboard-nav-link" onClick={goTo('/teacher/interaction')} type="button">
              Tương tác học viên
            </button>
          </li>
          <li>
            <button className="instructor-dashboard-nav-link" onClick={goTo('/teacher/profile')} type="button">
              Hồ sơ giảng viên
            </button>
          </li>
          <li>
            <button className="instructor-dashboard-nav-link" onClick={goTo('/teacher/revenue')} type="button">
              Doanh thu
            </button>
          </li>
        </ul>

        <button className="instructor-dashboard-logout-btn" type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="instructor-dashboard-main-content">
        <header className="instructor-dashboard-top-header">
          <h1 className="instructor-dashboard-page-title">Tổng quan giảng dạy</h1>

          <div className="instructor-dashboard-header-actions">
            <label className="instructor-dashboard-search-bar">
              <input placeholder="Tìm kiếm học viên, khóa học..." type="text" />
            </label>
            <div className="instructor-dashboard-avatar">GV</div>
          </div>
        </header>

        <section className="instructor-dashboard-stats-grid">
          <article className="instructor-dashboard-card instructor-dashboard-stat-item">
            <span className="instructor-dashboard-stat-label">Tổng doanh thu tháng này</span>
            <span className="instructor-dashboard-stat-value instructor-dashboard-stat-revenue">{formatCurrency(stats.totalRevenueCurrentMonth)}</span>
          </article>

          <article className="instructor-dashboard-card instructor-dashboard-stat-item">
            <span className="instructor-dashboard-stat-label">Tổng số học viên</span>
            <span className="instructor-dashboard-stat-value">{Number(stats.totalStudents || 0).toLocaleString('vi-VN')}</span>
          </article>

          <article className="instructor-dashboard-card instructor-dashboard-stat-item">
            <span className="instructor-dashboard-stat-label">Khóa học đang hoạt động</span>
            <span className="instructor-dashboard-stat-value">{Number(stats.activeCourses || 0).toLocaleString('vi-VN')}</span>
          </article>

          <article className="instructor-dashboard-card instructor-dashboard-stat-item">
            <span className="instructor-dashboard-stat-label">Đánh giá trung bình</span>
            <span className="instructor-dashboard-stat-value">
              {(Number(stats.averageRating || 0)).toFixed(1)} <span className="instructor-dashboard-star">★</span>
            </span>
          </article>
        </section>

        <section className="instructor-dashboard-bottom">
          <article className="instructor-dashboard-card">
            <h2 className="instructor-dashboard-card-title">Biểu đồ doanh thu 6 tháng gần nhất</h2>
            {isLoading ? <div className="instructor-dashboard-chart-placeholder">Đang tải dữ liệu...</div> : null}
            {!isLoading && errorMessage ? <div className="instructor-dashboard-chart-placeholder">{errorMessage}</div> : null}
            {!isLoading && !errorMessage ? (
              <div className="instructor-dashboard-chart-wrap">
                {monthlyRevenue.map((item) => {
                  const amount = Number(item.amount || 0);
                  const ratio = Math.max((amount / maxMonthlyRevenue) * 100, 4);

                  return (
                    <div className="instructor-dashboard-chart-col" key={item.label}>
                      <div className="instructor-dashboard-chart-value">{formatCurrency(amount)}</div>
                      <div className="instructor-dashboard-chart-track">
                        <div className="instructor-dashboard-chart-bar" style={{ height: `${ratio}%` }} />
                      </div>
                      <div className="instructor-dashboard-chart-label">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </article>

          <article className="instructor-dashboard-card">
            <h2 className="instructor-dashboard-card-title">Đăng ký mới gần đây</h2>

            <table className="instructor-dashboard-recent-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Khóa học</th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="instructor-dashboard-student-info">
                        <div className="instructor-dashboard-student-avatar">{getInitial(item.studentName)}</div>
                        <span>{item.studentName}</span>
                      </div>
                    </td>
                    <td className="instructor-dashboard-course-cell">
                      <div>{item.courseName}</div>
                      <small>{formatDate(item.createdAt)}</small>
                    </td>
                  </tr>
                ))}
                {!recentEnrollments.length ? (
                  <tr>
                    <td colSpan={2}>Chưa có học viên đăng ký mới.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ManHinhChinhGiaoVien;
