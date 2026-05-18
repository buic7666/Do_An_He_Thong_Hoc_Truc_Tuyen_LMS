import { useState } from 'react';
import './ManHinhLichSuGiaoDich.css';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';

const transactions = [
  {
    id: '#TRX-889241A',
    courseName: 'Xây dựng ứng dụng quản lý nhà trọ HousePal với Flutter',
    purchaseDate: '22/03/2026',
    amount: '479.200đ',
    status: 'Thành công',
    statusClass: 'is-success',
  },
  {
    id: '#TRX-889102B',
    courseName: 'Trí tuệ nhân tạo: Nhập môn Reinforcement Learning',
    purchaseDate: '15/01/2026',
    amount: '750.000đ',
    status: 'Thành công',
    statusClass: 'is-success',
  },
  {
    id: '#TRX-889005C',
    courseName: 'JavaScript chuyên sâu cho hệ thống Backend',
    purchaseDate: '10/01/2026',
    amount: '450.000đ',
    status: 'Đang xử lý',
    statusClass: 'is-pending',
  },
];

const certificates = [
  {
    id: 1,
    title: 'Hoàn thành: Xây dựng ứng dụng quản lý nhà trọ HousePal',
    issuedDate: '05/04/2026',
  },
  {
    id: 2,
    title: 'Hoàn thành: Nhập môn Reinforcement Learning',
    issuedDate: '20/02/2026',
  },
];

function ManHinhLichSuGiaoDich() {
  const [activeTab, setActiveTab] = useState('history');
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');

  const downloadCertificate = (certificate) => {
    const content = [
      'LMS Platform - Certificate',
      `Title: ${certificate.title}`,
      `Issued Date: ${certificate.issuedDate}`,
      'Status: Completed',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `certificate-${certificate.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    setNotice('Đã tải chứng chỉ mẫu về máy.');
  };

  return (
    <div className='history-page'>
      <StudentSidebar />

      <main className='history-main-content'>
        <h1 className='history-page-title'>Quản lý giao dịch & Chứng chỉ</h1>
        <button type='button' className='history-btn-buy' onClick={() => navigate('/courses')}>
          + Mua thêm khóa học
        </button>
        {notice ? <p className='history-notice'>{notice}</p> : null}

        <div className='history-tabs-container'>
          <div className='history-tab-labels'>
            <button
              type='button'
              className={`history-tab-label ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Lịch sử mua hàng
            </button>

            <button
              type='button'
              className={`history-tab-label ${activeTab === 'certificate' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('certificate')}
            >
              Chứng chỉ của tôi
            </button>
          </div>

          <div className='history-tab-content'>
            {activeTab === 'history' && (
              <section className='history-tab-panel'>
                <div className='history-table-responsive'>
                  <table className='history-transaction-table'>
                    <thead>
                      <tr>
                        <th>Mã Hóa Đơn</th>
                        <th>Tên Khóa Học</th>
                        <th>Ngày Mua</th>
                        <th>Số Tiền</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{transaction.id}</td>
                          <td className='history-course-name-cell'>{transaction.courseName}</td>
                          <td>{transaction.purchaseDate}</td>
                          <td>{transaction.amount}</td>
                          <td>
                            <span className={`history-badge ${transaction.statusClass}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'certificate' && (
              <section className='history-tab-panel'>
                <div className='history-cert-grid'>
                  {certificates.map((certificate) => (
                    <article key={certificate.id} className='history-cert-card'>
                      <div className='history-cert-icon'>🏆</div>
                      <h3 className='history-cert-title'>{certificate.title}</h3>
                      <p className='history-cert-date'>Cấp ngày: {certificate.issuedDate}</p>
                      <button
                        type='button'
                        className='history-btn-download'
                        onClick={() => downloadCertificate(certificate)}
                      >
                        📄 Tải xuống PDF
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ManHinhLichSuGiaoDich;
