import './ManHinhChinhAdmin.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminDashboardApi } from '../../api/adminApi';
import AdminSidebar from '../../components/AdminSidebar';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatShortCurrency = (value) => {
  const numberValue = Number(value || 0);

  if (numberValue >= 1000000000) {
    return `${(numberValue / 1000000000).toFixed(1)} tỷ`;
  }

  if (numberValue >= 1000000) {
    return `${(numberValue / 1000000).toFixed(1)} triệu`;
  }

  if (numberValue >= 1000) {
    return `${(numberValue / 1000).toFixed(0)} nghìn`;
  }

  return `${numberValue.toLocaleString('vi-VN')}đ`;
};

const getErrorMessage = (error) => (
  error?.response?.data?.message
  || error?.response?.data?.error
  || error?.message
  || 'Không thể tải dashboard admin.'
);

const normalizeMonthlyRevenue = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map((item, index) => ({
    id: `${item.label || 'month'}-${index}`,
    label: item.label || `Tháng ${index + 1}`,
    amount: Number(item.amount || item.revenue || item.total || 0),
  }));
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
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const goTo = (path) => () => navigate(path);

  const stats = dashboardData?.stats || {};
  const monthlyRevenue = normalizeMonthlyRevenue(dashboardData?.monthlyRevenue);
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
        detailPath: '/admin/users?role=teacher',
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
        detailPath: '/admin/courses',
      },
    ],
    [stats.totalPendingCourses, stats.totalRevenueCurrentMonth, stats.totalStudents, stats.totalTeachers],
  );

  const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.amount), 1);
  const hasRevenueData = monthlyRevenue.some((item) => item.amount > 0);

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
            <h2 className="admin-dashboard-card-title">Biểu đồ doanh thu 6 tháng gần nhất</h2>

            <div className="admin-dashboard-revenue-chart">
              {monthlyRevenue.length === 0 ? (
                <div className="admin-dashboard-revenue-empty">
                  Chưa có dữ liệu doanh thu.
                </div>
              ) : (
                <>
                  <div className="admin-dashboard-revenue-bars">
                    {monthlyRevenue.map((item) => {
                      const percent = item.amount > 0 ? Math.max((item.amount / maxRevenue) * 100, 8) : 0;

                      return (
                        <div className="admin-dashboard-revenue-column" key={item.id}>
                          <div className="admin-dashboard-revenue-value">
                            {formatShortCurrency(item.amount)}
                          </div>

                          <div className="admin-dashboard-revenue-bar-track">
                            <div
                              className="admin-dashboard-revenue-bar"
                              style={{ height: `${percent}%` }}
                              title={`${item.label}: ${formatCurrency(item.amount)}`}
                            />
                          </div>

                          <div className="admin-dashboard-revenue-label">
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!hasRevenueData && (
                    <div className="admin-dashboard-revenue-note">
                      Chưa có giao dịch/khoá học phát sinh doanh thu trong 6 tháng gần nhất.
                    </div>
                  )}
                </>
              )}
            </div>
          </article>

          <article className="admin-dashboard-card">
            <h2 className="admin-dashboard-card-title">Tỷ lệ người dùng</h2>

            <div className="admin-dashboard-pie-wrap">
              <div className="admin-dashboard-pie-ring" style={pieStyle}>
                <div className="admin-dashboard-pie-inner">{teacherCount + studentCount}</div>
              </div>

              <div className="admin-dashboard-pie-legend">
                <p>
                  <span className="admin-dashboard-dot teacher" />
                  Giảng viên: {teacherCount}
                </p>
                <p>
                  <span className="admin-dashboard-dot student" />
                  Học viên: {studentCount}
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ManHinhChinhAdmin;