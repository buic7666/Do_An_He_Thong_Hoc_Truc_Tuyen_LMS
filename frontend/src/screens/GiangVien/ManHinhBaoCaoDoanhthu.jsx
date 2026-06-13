import './ManHinhBaoCaoDoanhthu.css';
import { useEffect, useMemo, useState } from 'react';
import { fetchTeacherDashboardApi } from '../../api/teacherApi';
import TeacherSidebar from '../../components/TeacherSidebar';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
};

const withdrawHistory = [
  {
    id: 'WD-0921A',
    requestDate: '20/03/2026',
    bankTarget: 'Vietcombank (***4567)',
    amount: '5.000.000d',
    status: 'Dang xu ly',
    statusType: 'pending',
  },
  {
    id: 'WD-0815B',
    requestDate: '01/03/2026',
    bankTarget: 'Vietcombank (***4567)',
    amount: '15.500.000d',
    status: 'Thanh cong',
    statusType: 'success',
  },
  {
    id: 'WD-0702C',
    requestDate: '15/02/2026',
    bankTarget: 'Vietcombank (***4567)',
    amount: '8.200.000d',
    status: 'Thanh cong',
    statusType: 'success',
  },
];

function ManHinhBaoCaoDoanhthu() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTeacherDashboardApi();
        setDashboardData(data || null);
      } catch (_error) {
        setDashboardData(null);
      }
    };

    loadData();
  }, []);

  const courseSales = useMemo(
    () =>
      (dashboardData?.enrollments || []).map((item) => {
        const salePrice = Number(item.price || 0);
        const fee = salePrice * 0.2;
        const net = salePrice - fee;

        return {
          id: item.id,
          soldDate: formatDate(item.createdAt),
          courseName: item.courseName,
          student: item.studentName,
          sellPrice: formatCurrency(salePrice),
          platformFee: `- ${formatCurrency(fee)}`,
          netIncome: `+ ${formatCurrency(net)}`,
        };
      }),
    [dashboardData],
  );
  const handleWithdrawRequest = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert('Da gui yeu cau rut tien (demo).');
  };

  return (
    <div className="instructor-finance-page">
      <TeacherSidebar />

      <main className="instructor-finance-main-content">
        <h1 className="instructor-finance-page-title">Quản lý tài chính</h1>

        <section className="instructor-finance-card instructor-finance-balance-card">
          <div className="instructor-finance-balance-info">
            <span className="instructor-finance-balance-label">Số dư khả dụng (VND)</span>
            <span className="instructor-finance-balance-amount">{formatCurrency(dashboardData?.stats?.totalRevenueCurrentMonth || 0)}</span>
          </div>

          <button className="instructor-finance-btn instructor-finance-btn-primary" onClick={handleWithdrawRequest} type="button">
            Yêu cầu rút tiền
          </button>
        </section>

        <section className="instructor-finance-split-layout">
          <article className="instructor-finance-card">
            <h2 className="instructor-finance-card-title">Lịch sử bán khóa học</h2>

            <div className="instructor-finance-table-responsive">
              <table className="instructor-finance-data-table">
                <thead>
                  <tr>
                    <th>Ngày bán</th>
                    <th>Khóa học</th>
                    <th>Học viên</th>
                    <th className="col-money">Giá bán</th>
                    <th className="col-money">Phí nền tảng (20%)</th>
                    <th className="col-money">Thực nhận</th>
                  </tr>
                </thead>

                <tbody>
                  {courseSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.soldDate}</td>
                      <td className="course-name">{sale.courseName}</td>
                      <td>{sale.student}</td>
                      <td className="col-money bold">{sale.sellPrice}</td>
                      <td className="col-money text-deduct">{sale.platformFee}</td>
                      <td className="col-money text-net">{sale.netIncome}</td>
                    </tr>
                  ))}
                  {!courseSales.length ? (
                    <tr>
                      <td colSpan={6}>Chưa có giao dịch bán khóa học nào.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>

          <article className="instructor-finance-card">
            <h2 className="instructor-finance-card-title">Lịch sử rút tiền</h2>

            <div className="instructor-finance-table-responsive">
              <table className="instructor-finance-data-table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Ngày yêu cầu</th>
                    <th>Ngân hàng nhận</th>
                    <th className="col-money">Số tiền rút</th>
                    <th className="align-right">Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {withdrawHistory.map((withdraw) => (
                    <tr key={withdraw.id}>
                      <td className="muted-id">#{withdraw.id}</td>
                      <td>{withdraw.requestDate}</td>
                      <td>{withdraw.bankTarget}</td>
                      <td className="col-money bold">{withdraw.amount}</td>
                      <td className="align-right">
                        <span className={`instructor-finance-badge instructor-finance-badge-${withdraw.statusType}`}>{withdraw.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ManHinhBaoCaoDoanhthu;
