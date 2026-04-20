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
          <p className="instructor-revenue-detail-kicker">Bao cao doanh thu</p>
          <h1>Chi tiet doanh thu giang vien</h1>
          <p className="instructor-revenue-detail-subtitle">Tong hop doanh thu, phi nen tang va lich su giao dich theo tung khoa hoc.</p>
        </div>

        <button className="instructor-revenue-detail-btn primary" onClick={handleExport} type="button">
          Xuat bao cao
        </button>
      </header>

      <section className="instructor-revenue-detail-filter-bar">
        <label>
          Khoang thoi gian
          <select onChange={(event) => setDateRange(event.target.value)} value={dateRange}>
            <option value="7days">7 ngay</option>
            <option value="30days">30 ngay</option>
            <option value="90days">90 ngay</option>
            <option value="year">Nam hien tai</option>
          </select>
        </label>

        <label>
          Trang thai giao dich
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="all">Tat ca</option>
            <option value="success">Thanh cong</option>
            <option value="pending">Dang doi soat</option>
          </select>
        </label>

        <div className="instructor-revenue-detail-range-chip">{currentRangeLabel}</div>
      </section>

      <section className="instructor-revenue-detail-summary-grid">
        <article className="instructor-revenue-detail-card">
          <p>Tong doanh thu</p>
          <h3>{formatCurrency(summarySeed.totalRevenue)}</h3>
        </article>
        <article className="instructor-revenue-detail-card">
          <p>Phi nen tang</p>
          <h3>{formatCurrency(summarySeed.platformFee)}</h3>
        </article>
        <article className="instructor-revenue-detail-card highlight">
          <p>Thu nhap thuc nhan</p>
          <h3>{formatCurrency(summarySeed.netPayout)}</h3>
        </article>
        <article className="instructor-revenue-detail-card">
          <p>Tong don hang</p>
          <h3>{summarySeed.totalOrders.toLocaleString('vi-VN')}</h3>
        </article>
      </section>

      <section className="instructor-revenue-detail-layout-grid">
        <article className="instructor-revenue-detail-panel">
          <div className="instructor-revenue-detail-panel-head">
            <h2>Doanh thu theo khoa hoc</h2>
            <span>Top 3 khoa hoc</span>
          </div>

          <div className="instructor-revenue-detail-course-list">
            {byCourseSeed.map((course) => (
              <div className="instructor-revenue-detail-course-item" key={course.id}>
                <div>
                  <h4>{course.courseName}</h4>
                  <p>{course.enrollments.toLocaleString('vi-VN')} hoc vien</p>
                </div>

                <div className="instructor-revenue-detail-course-values">
                  <span className="gross">{formatCurrency(course.grossRevenue)}</span>
                  <span className="net">Thuc nhan: {formatCurrency(course.netRevenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="instructor-revenue-detail-panel">
          <div className="instructor-revenue-detail-panel-head">
            <h2>Ti le doanh thu</h2>
            <span>Minh hoa</span>
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
          <h2>Lich su giao dich</h2>
          <span>{filteredTransactions.length} giao dich</span>
        </div>

        <div className="instructor-revenue-detail-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ma GD</th>
                <th>Ngay</th>
                <th>Hoc vien</th>
                <th>Khoa hoc</th>
                <th>So tien</th>
                <th>Trang thai</th>
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
