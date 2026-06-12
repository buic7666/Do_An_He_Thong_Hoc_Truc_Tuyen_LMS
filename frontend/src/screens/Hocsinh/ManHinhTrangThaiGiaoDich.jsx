import './ManHinhTrangThaiGiaoDich.css';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ManHinhTrangThaiGiaoDich() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transactionInfo = useMemo(() => {
    const amount = Number(searchParams.get('amount') || 0);
    const rawMethod = searchParams.get('method') || 'Thanh toán trực tuyến';
    const transactionId = searchParams.get('transactionId') || 'TRX-DEMO';
    const courseId = searchParams.get('courseId') || '1';
    const paidAt = new Date().toLocaleString('vi-VN');

    return {
      transactionId,
      amount,
      method: rawMethod,
      courseId,
      paidAt,
    };
  }, [searchParams]);

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const handleStartLearning = () => {
    navigate(`/learn?courseId=${transactionInfo.courseId}`);
  };

  return (
    <div className='transaction-success-page'>
      <div className='transaction-success-card'>
        <div className='transaction-success-icon-wrapper'>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='3'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <polyline points='20 6 9 17 4 12' />
          </svg>
        </div>

        <h1 className='transaction-success-title'>Thanh toán thành công!</h1>
        <p className='transaction-success-desc'>
          Cảm ơn bạn. Hóa đơn điện tử và xác nhận ghi danh đã được gửi tới email của bạn.
        </p>

        <div className='transaction-info-box'>
          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Mã giao dịch:</span>
            <span className='transaction-info-value'>#{transactionInfo.transactionId}</span>
          </div>

          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Ngày thanh toán:</span>
            <span className='transaction-info-value'>{transactionInfo.paidAt}</span>
          </div>

          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Phương thức:</span>
            <span className='transaction-info-value'>{transactionInfo.method}</span>
          </div>

          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Tổng tiền:</span>
            <span className='transaction-info-value is-amount'>{formatCurrency(transactionInfo.amount)}</span>
          </div>
        </div>

        <button type='button' className='transaction-btn-primary' onClick={handleStartLearning}>
          Bắt đầu học ngay
        </button>
      </div>
    </div>
  );
}

export default ManHinhTrangThaiGiaoDich;
