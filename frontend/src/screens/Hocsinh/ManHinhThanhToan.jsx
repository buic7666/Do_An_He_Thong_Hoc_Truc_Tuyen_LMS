import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManHinhThanhToan.css';

const paymentOptions = [
  {
    id: 'card',
    label: 'Thẻ Tín dụng / Ghi nợ (Visa, MasterCard)',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
    iconAlt: 'Visa',
    iconClass: 'checkout-payment-icon is-visa',
  },
  {
    id: 'momo',
    label: 'Ví điện tử MoMo',
    icon: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
    iconAlt: 'MoMo',
    iconClass: 'checkout-payment-icon',
  },
  {
    id: 'vnpay',
    label: 'Thanh toán qua VNPAY',
    icon: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418189687.png',
    iconAlt: 'VNPay',
    iconClass: 'checkout-payment-icon',
  },
];

const course = {
  title: 'Xây dựng ứng dụng quản lý nhà trọ HousePal với Flutter từ A-Z',
  instructor: 'Giảng viên: Trần Văn B',
  thumbnail: 'https://via.placeholder.com/90x64/1A73E8/ffffff?text=Flutter',
  originalPrice: 599000,
};

const DISCOUNT_CODE = 'HOUSEPAL20';
const DISCOUNT_RATE = 0.2;

function formatCurrency(value) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function ManHinhThanhToan() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(DISCOUNT_CODE);
  const [notice, setNotice] = useState('');

  const discountAmount = useMemo(() => {
    if (appliedCoupon !== DISCOUNT_CODE) {
      return 0;
    }
    return Math.round(course.originalPrice * DISCOUNT_RATE);
  }, [appliedCoupon]);

  const totalPrice = course.originalPrice - discountAmount;

  const handleApplyCoupon = () => {
    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) {
      setAppliedCoupon('');
      return;
    }
    setAppliedCoupon(normalized);
    setNotice(normalized === DISCOUNT_CODE ? 'Áp dụng mã giảm giá thành công.' : 'Mã đã được cập nhật.');
  };

  const handleCheckout = () => {
    const methodLabel = paymentOptions.find((item) => item.id === selectedMethod)?.label || selectedMethod;
    navigate(
      `/payment-status?transactionId=TRX-${Date.now()}&amount=${totalPrice}&method=${encodeURIComponent(methodLabel)}&courseId=1`,
    );
  };

  return (
    <div className='checkout-page'>
      <div className='checkout-container'>
        <section className='checkout-left'>
          <h2 className='checkout-section-title'>Phương thức thanh toán</h2>

          <div className='checkout-payment-methods'>
            {paymentOptions.map((option) => (
              <label key={option.id} className='checkout-payment-option'>
                <input
                  type='radio'
                  name='payment_method'
                  className='checkout-payment-radio'
                  checked={selectedMethod === option.id}
                  onChange={() => setSelectedMethod(option.id)}
                />
                <div className='checkout-payment-label'>
                  {option.label}
                  <img src={option.icon} alt={option.iconAlt} className={option.iconClass} />
                </div>
              </label>
            ))}
          </div>

          <h2 className='checkout-section-title checkout-coupon-title'>Mã giảm giá</h2>
          <div className='checkout-coupon-form'>
            <input
              type='text'
              className='checkout-input-field'
              placeholder='Nhập mã giảm giá (nếu có)'
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
            />
            <button type='button' className='checkout-btn-apply' onClick={handleApplyCoupon}>
              Áp dụng
            </button>
          </div>
          {notice ? <p className='checkout-notice'>{notice}</p> : null}
        </section>

        <aside className='checkout-right'>
          <h2 className='checkout-section-title'>Tóm tắt đơn hàng</h2>

          <div className='checkout-course-summary'>
            <img src={course.thumbnail} alt='Khóa học Flutter' className='checkout-course-thumb' />
            <div className='checkout-course-info'>
              <p className='checkout-course-title'>{course.title}</p>
              <p className='checkout-course-instructor'>{course.instructor}</p>
            </div>
          </div>

          <div className='checkout-calc-row'>
            <span>Tạm tính</span>
            <span className='checkout-calc-value'>{formatCurrency(course.originalPrice)}</span>
          </div>

          <div className='checkout-calc-row is-discount'>
            <span>Mã giảm giá ({appliedCoupon || '---'})</span>
            <span className='checkout-calc-value'>-{formatCurrency(discountAmount)}</span>
          </div>

          <div className='checkout-calc-row is-total'>
            <span>Tổng tiền</span>
            <span className='checkout-total-price'>{formatCurrency(totalPrice)}</span>
          </div>

          <button type='button' className='checkout-btn-checkout' onClick={handleCheckout}>
            🔒 Thanh toán ngay
          </button>

          <p className='checkout-policy-note'>
            Bằng việc thanh toán, bạn đồng ý với Điều khoản sử dụng của chúng tôi.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default ManHinhThanhToan;
