import { useMemo, useState } from 'react';

import './ManHinhBaoCaoDoanhThu_chitiet.css';

const summarySeed = {
  totalRevenue: 845250000,
  platformFee: 169050000,
  netPayout: 676200000,
  totalOrders: 1924,
};

const byCourseSeed = [
  { id: 1, courseName: 'Flutter HousePal Mobile App', enrollments: 842, grossRevenue: 421000000, netRevenue: 336800000 },
  { id: 2, courseName: 'JavaScript Pro Backend', enrollments: 615, grossRevenue: 252000000, netRevenue: 201600000 },
  { id: 3, courseName: 'AI Reinforcement Learning', enrollments: 467, grossRevenue: 172250000, netRevenue: 137800000 },
];

const transactionsSeed = [
  { id: 'TRX-220301', date: '22/03/2026', student: 'Le Minh Ngoc', course: 'Flutter HousePal Mobile App', amount: 599000, status: 'Thanh cong' },
  { id: 'TRX-220287', date: '21/03/2026', student: 'Nguyen Trong An', course: 'JavaScript Pro Backend', amount: 499000, status: 'Thanh cong' },
  { id: 'TRX-220255', date: '20/03/2026', student: 'Pham Duc Huy', course: 'AI Reinforcement Learning', amount: 799000, status: 'Dang doi soat' },
  { id: 'TRX-220241', date: '20/03/2026', student: 'Tran Hai Yen', course: 'Flutter HousePal Mobile App', amount: 599000, status: 'Thanh cong' },
  { id: 'TRX-220233', date: '19/03/2026', student: 'Vo Quang Linh', course: 'JavaScript Pro Backend', amount: 499000, status: 'Thanh cong' },
];

const formatCurrency = (value) => `${value.toLocaleString('vi-VN')}d`;

function ManHinhBaoCaoDoanhThuChiTiet() {
  const [dateRange, setDateRange] = useState('30days');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') {
      return transactionsSeed;
    }

    return transactionsSeed.filter((item) => {
      const normalized = item.status.toLowerCase();
      return statusFilter === 'success' ? normalized === 'thanh cong' : normalized === 'dang doi soat';
    });
  }, [statusFilter]);

  const currentRangeLabel = useMemo(() => {
    if (dateRange === '7days') return '7 ngay gan nhat';
    if (dateRange === '90days') return '90 ngay gan nhat';
    if (dateRange === 'year') return 'Nam hien tai';
    return '30 ngay gan nhat';
  }, [dateRange]);

  const handleExport = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Da tao file bao cao cho ${currentRangeLabel} (demo).`);
  };

  return (
    <div className="instructor-revenue-detail-page">
      <header className="instructor-revenue-detail-header">
        <div>
          <p className="instructor-revenue-detail-kicker">Báo cáo doanh thu chi tiết</p>
          <h1>Chi tiết doanh thu</h1>
          <p className="instructor-revenue-detail-subtitle">Tổng hợp doanh thu, phí nền tảng và lịch sử giao dịch theo từng khóa học.</p>
        </div>

        <button className="instructor-revenue-detail-btn primary" onClick={handleExport} type="button">
          Xuất báo cáo
        </button>
      </header>

      <section className="instructor-revenue-detail-filter-bar">
        <label>
          Khoảng thời gian
          <select onChange={(event) => setDateRange(event.target.value)} value={dateRange}>
            <option value="7days">7 ngày</option>
            <option value="30days">30 ngày</option>
            <option value="90days">90 ngày</option>
            <option value="year">năm hiện tại</option>
          </select>
        </label>

        <label>
          Trạng thái giao dịch
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="all">Tất cả</option>
            <option value="success">Thành công</option>
            <option value="pending">Đang đợi soát</option>
          </select>
        </label>

        <div className="instructor-revenue-detail-range-chip">{currentRangeLabel}</div>
      </section>

      <section className="instructor-revenue-detail-summary-grid">
        <article className="instructor-revenue-detail-card">
          <p>Tổng doanh thu</p>
          <h3>{formatCurrency(summarySeed.totalRevenue)}</h3>
        </article>
        <article className="instructor-revenue-detail-card">
          <p>Phí nền tảng</p>
          <h3>{formatCurrency(summarySeed.platformFee)}</h3>
        </article>
        <article className="instructor-revenue-detail-card highlight">
          <p>Thu nhập thực nhận</p>
          <h3>{formatCurrency(summarySeed.netPayout)}</h3>
        </article>
        <article className="instructor-revenue-detail-card">
          <p>Tổng đơn hàng</p>
          <h3>{summarySeed.totalOrders.toLocaleString('vi-VN')}</h3>
        </article>
      </section>

      <section className="instructor-revenue-detail-layout-grid">
        <article className="instructor-revenue-detail-panel">
          <div className="instructor-revenue-detail-panel-head">
            <h2>Doanh thu theo khóa học</h2>
            <span>Top 3 khóa học</span>
          </div>

          <div className="instructor-revenue-detail-course-list">
            {byCourseSeed.map((course) => (
              <div className="instructor-revenue-detail-course-item" key={course.id}>
                <div>
                  <h4>{course.courseName}</h4>
                  <p>{course.enrollments.toLocaleString('vi-VN')} học viên</p>
                </div>

                <div className="instructor-revenue-detail-course-values">
                  <span className="gross">{formatCurrency(course.grossRevenue)}</span>
                  <span className="net">Thực nhận: {formatCurrency(course.netRevenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="instructor-revenue-detail-panel">
          <div className="instructor-revenue-detail-panel-head">
            <h2>Tỷ lệ doanh thu</h2>
            <span>Minh họa</span>
          </div>

          <div className="instructor-revenue-detail-donut-wrap">
            <div className="instructor-revenue-detail-donut" />
            <ul>
              <li>
                <span className="dot dot-a" /> Flutter HousePal - 50%
              </li>
              <li>
                <span className="dot dot-b" /> JavaScript Pro Backend - 30%
              </li>
              <li>
                <span className="dot dot-c" /> AI RL - 20%
              </li>
            </ul>
          </div>
        </article>
      </section>

      <section className="instructor-revenue-detail-panel full">
        <div className="instructor-revenue-detail-panel-head">
          <h2>ịch sử giao dịch</h2>
          <span>{filteredTransactions.length} giao dịch</span>
        </div>

        <div className="instructor-revenue-detail-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Ngày</th>
                <th>học viên</th>
                <th>Khóa học</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.date}</td>
                  <td>{item.student}</td>
                  <td>{item.course}</td>
                  <td className="amount">{formatCurrency(item.amount)}</td>
                  <td>
                    <span className={`status ${item.status === 'Thanh cong' ? 'success' : 'pending'}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ManHinhBaoCaoDoanhThuChiTiet;
