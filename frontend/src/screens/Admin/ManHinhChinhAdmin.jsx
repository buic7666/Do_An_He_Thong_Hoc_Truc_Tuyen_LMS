import './ManHinhChinhAdmin.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminDashboardApi } from '../../api/adminApi';
import AdminSidebar from '../../components/AdminSidebar';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const getLinePoints = (series = []) => {
  if (!Array.isArray(series) || series.length === 0) return '';

  const width = 620;
  const height = 220;
  const maxValue = Math.max(...series.map((item) => Number(item.amount || 0)), 1);

  return series
    .map((item, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width;
      const y = height - (Number(item.amount || 0) / maxValue) * height;
      return `${x},${y}`;
    })
    .join(' ');
};

function ManHinhChinhAdmin() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchAdminDashboardApi();
        setDashboardData(data || null);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không thể tải dashboard admin.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const goTo = (path) => () => navigate(path);

  const stats = dashboardData?.stats || {};
  const monthlyRevenue = dashboardData?.monthlyRevenue || [];
  const userDistribution = dashboardData?.userDistribution || {};

  const dashboardStats = useMemo(
    () => [
      {
        id: 'revenue',
        label: 'Tổng doanh thu tháng này',
        value: formatCurrency(stats.totalRevenueCurrentMonth),
        variant: 'revenue',
        detailPath: '/admin/transactions',
      },
      {
        id: 'instructors',
        label: 'Tổng giảng viên',
        value: Number(stats.totalTeachers || 0).toLocaleString('vi-VN'),
        variant: 'instructors',
        detailPath: '/admin/users?role=instructor',
      },
      {
        id: 'students',
        label: 'Tổng học viên',
        value: Number(stats.totalStudents || 0).toLocaleString('vi-VN'),
        variant: 'students',
        detailPath: '/admin/users?role=student',
      },
      {
        id: 'pending',
        label: 'Khóa học chờ duyệt',
        value: Number(stats.totalPendingCourses || 0).toLocaleString('vi-VN'),
        variant: 'warning',
        detailPath: '/admin/course-approval',
      },
    ],
    [stats.totalPendingCourses, stats.totalRevenueCurrentMonth, stats.totalStudents, stats.totalTeachers],
  );

  const teacherCount = Number(userDistribution.teachers || 0);
  const studentCount = Number(userDistribution.students || 0);
  const totalUsers = Math.max(teacherCount + studentCount, 1);
  const teacherPercent = (teacherCount / totalUsers) * 100;
  const pieStyle = {
    background: `conic-gradient(#1a73e8 0% ${teacherPercent}%, #34a853 ${teacherPercent}% 100%)`,
  };

  if (isLoading) {
    return <div className="admin-dashboard-loading">Đang tải dữ liệu dashboard admin...</div>;
  }

  if (errorMessage) {
    return <div className="admin-dashboard-loading">{errorMessage}</div>;
  }

  return (
    <div className="admin-dashboard-page">
      <AdminSidebar />

      <main className="admin-dashboard-main-content">
        <header className="admin-dashboard-top-header">
          <h1 className="admin-dashboard-page-title">Tổng quan hệ thống</h1>

          <div className="admin-dashboard-header-actions">
            <label className="admin-dashboard-global-search">
              <span className="admin-dashboard-search-icon" aria-hidden="true">
                S
              </span>
              <input placeholder="Tìm kiếm tài khoản, khóa học, giao dịch..." type="text" />
            </label>

            <button className="admin-dashboard-notification-bell" type="button" onClick={goTo('/admin/support')}>
              B
              <span className="admin-dashboard-notification-badge">3</span>
            </button>
          </div>
        </header>

        <section className="admin-dashboard-stats-grid">
          {dashboardStats.map((stat) => (
            <button
              className={`admin-dashboard-card admin-dashboard-stat-card ${stat.variant}`}
              key={stat.id}
              type="button"
              onClick={goTo(stat.detailPath)}
              title="Bấm để xem chi tiết"
            >
              <span className="admin-dashboard-stat-label">{stat.label}</span>
              <span className="admin-dashboard-stat-value">{stat.value}</span>
              <span className="admin-dashboard-stat-link">Xem chi tiết</span>
            </button>
          ))}
        </section>

        <section className="admin-dashboard-charts-grid">
          <article className="admin-dashboard-card">
            <h2 className="admin-dashboard-card-title">Biểu đồ doanh thu (6 tháng gần nhất)</h2>
            <div className="admin-dashboard-line-chart-wrap">
              <svg className="admin-dashboard-line-chart" viewBox="0 0 620 220" preserveAspectRatio="none" role="img" aria-label="Doanh thu 6 tháng">
                <polyline className="admin-dashboard-line-grid" points="0,220 620,220" />
                <polyline className="admin-dashboard-line-path" points={getLinePoints(monthlyRevenue)} />
              </svg>
              <div className="admin-dashboard-line-labels">
                {monthlyRevenue.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="admin-dashboard-card">
            <h2 className="admin-dashboard-card-title">Tỷ lệ người dùng</h2>
            <div className="admin-dashboard-pie-wrap">
              <div className="admin-dashboard-pie-ring" style={pieStyle}>
                <div className="admin-dashboard-pie-inner">{teacherCount + studentCount}</div>
              </div>
              <div className="admin-dashboard-pie-legend">
                <p><span className="admin-dashboard-dot teacher" />Giảng viên: {teacherCount}</p>
                <p><span className="admin-dashboard-dot student" />Học viên: {studentCount}</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ManHinhChinhAdmin;
