import './ManHinhTrangThaiGiaoDich.css';

function ManHinhTrangThaiGiaoDich() {
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
            <span className='transaction-info-value'>#TRX-889241A</span>
          </div>

          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Ngày thanh toán:</span>
            <span className='transaction-info-value'>22/03/2026 12:15</span>
          </div>

          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Phương thức:</span>
            <span className='transaction-info-value'>Ví MoMo</span>
          </div>

          <div className='transaction-info-row'>
            <span className='transaction-info-label'>Tổng tiền:</span>
            <span className='transaction-info-value is-amount'>479.200đ</span>
          </div>
        </div>

        <button type='button' className='transaction-btn-primary'>
          Bắt đầu học ngay
        </button>
      </div>
    </div>
  );
}

export default ManHinhTrangThaiGiaoDich;
