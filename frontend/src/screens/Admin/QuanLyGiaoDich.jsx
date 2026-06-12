import { useMemo, useState } from 'react';

import './QuanLyGiaoDich.css';
import AdminSidebar from '../../components/AdminSidebar';

const invoices = [
  {
    id: '#TRX-8892A',
    student: 'Bui Van Dong',
    course: 'Flutter HousePal Mobile App',
    amount: '479.200đ',
    gateway: 'MOMO',
    gatewayType: 'momo',
    status: 'Thành công',
    statusType: 'success',
  },
  {
    id: '#TRX-8891B',
    student: 'Le Minh Ngoc',
    course: 'JavaScript Pro Backend',
    amount: '360.000đ',
    gateway: 'VNPAY',
    gatewayType: 'vnpay',
    status: 'Thành công',
    statusType: 'success',
  },
  {
    id: '#TRX-8890C',
    student: 'Tran Quang Huy',
    course: 'AI: Reinforcement Learning',
    amount: '600.000đ',
    gateway: 'MOMO',
    gatewayType: 'momo',
    status: 'Đang chờ',
    statusType: 'pending',
  },
];

const initialPayouts = [
  {
    id: 'PO-2203-A',
    instructor: 'Nguyen Van A',
    bank: 'Vietcombank',
    accountNumber: '1023456789',
    accountName: 'NGUYEN VAN A',
    submittedDate: '22/03/2026',
    amount: '5.500.000đ',
  },
  {
    id: 'PO-2203-B',
    instructor: 'Tran Thi B',
    bank: 'Techcombank',
    accountNumber: '1903456789',
    accountName: 'TRAN THI B',
    submittedDate: '21/03/2026',
    amount: '8.200.000đ',
  },
];

function QuanLyGiaoDich() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [payouts] = useState(initialPayouts);
  const [rejectReasons, setRejectReasons] = useState({});

  const pendingCount = useMemo(() => payouts.length, [payouts]);

  const handleReasonChange = (payoutId, value) => {
    setRejectReasons((previous) => ({
      ...previous,
      [payoutId]: value,
    }));
  };

  const handleApprovePayout = (payout) => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Đã phê duyệt chuyển khoản cho ${payout.instructor} - ${payout.amount}`);
  };

  const handleRejectPayout = (payout) => {
    const reason = (rejectReasons[payout.id] ?? '').trim();
    if (!reason) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }

    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Đã từ chối yêu cầu rút tiền của ${payout.instructor}.\nLý do: ${reason}`);
  };

  return (
    <div className="admin-transaction-page">
      <AdminSidebar />

      <main className="admin-transaction-main-content">
        <h1 className="admin-transaction-page-title">Đối soát & Quản lý tài chính</h1>

        <section className="admin-transaction-card">
          <div className="admin-transaction-tab-labels">
            <button
              className={`admin-transaction-tab-label ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
              type="button"
            >
              Hóa đơn học viên
            </button>
            <button
              className={`admin-transaction-tab-label ${activeTab === 'payouts' ? 'active' : ''}`}
              onClick={() => setActiveTab('payouts')}
              type="button"
            >
              Yêu cầu rút tiền (Payouts)
            </button>
          </div>

          {activeTab === 'invoices' ? (
            <div className="admin-transaction-tab-panel">
              <div className="admin-transaction-table-container">
                <table className="admin-transaction-data-table">
                  <thead>
                    <tr>
                      <th>Mã GD</th>
                      <th>Học viên</th>
                      <th>Khóa học</th>
                      <th>Số tiền</th>
                      <th>Cổng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td className="admin-transaction-cell-strong">{invoice.student}</td>
                        <td>{invoice.course}</td>
                        <td className="admin-transaction-cell-strong">{invoice.amount}</td>
                        <td>
                          <span className={`admin-transaction-gateway admin-transaction-gateway-${invoice.gatewayType}`}>
                            {invoice.gateway}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-transaction-badge admin-transaction-badge-${invoice.statusType}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="admin-transaction-tab-panel">
              <p className="admin-transaction-payout-note">
                Có {pendingCount} yêu cầu rút tiền mới đang chờ phê duyệt từ giảng viên.
              </p>

              {payouts.map((payout) => (
                <article className="admin-transaction-payout-item" key={payout.id}>
                  <div className="admin-transaction-payout-header">
                    <div className="admin-transaction-payout-info">
                      <h4>Giảng viên: {payout.instructor}</h4>
                      <p>
                        Ngân hàng: {payout.bank} | STK: {payout.accountNumber} | Tên: {payout.accountName}
                      </p>
                      <p className="admin-transaction-submitted-date">Gửi ngày: {payout.submittedDate}</p>
                    </div>
                    <div className="admin-transaction-payout-amount">{payout.amount}</div>
                  </div>

                  <div className="admin-transaction-approval-actions">
                    <input
                      className="admin-transaction-reason-input"
                      onChange={(event) => handleReasonChange(payout.id, event.target.value)}
                      placeholder="Lý do từ chối (không bắt buộc nếu phê duyệt)..."
                      type="text"
                      value={rejectReasons[payout.id] ?? ''}
                    />
                    <button
                      className="admin-transaction-btn admin-transaction-btn-outline-danger"
                      onClick={() => handleRejectPayout(payout)}
                      type="button"
                    >
                      Từ chối
                    </button>
                    <button
                      className="admin-transaction-btn admin-transaction-btn-success"
                      onClick={() => handleApprovePayout(payout)}
                      type="button"
                    >
                      Phê duyệt chuyển khoản
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default QuanLyGiaoDich;
