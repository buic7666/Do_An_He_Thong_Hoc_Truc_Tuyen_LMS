import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitContactMessageApi } from '../../api/contactApi';

import './LienHe.css';

function LienHe() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await submitContactMessageApi({
        fullName,
        email,
        phone,
        message,
      });

      setIsSubmitted(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Gửi liên hệ thất bại, vui lòng thử lại.');
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='contact-page'>
      <header className='contact-header'>
        <div className='contact-logo'>LMS Platform</div>
        <nav className='contact-nav'>
          <Link to='/'>Trang chủ</Link>
          <Link to='/courses'>Khóa học</Link>
          <Link to='/instructors'>Giảng viên</Link>
          <Link to='/contact' className='is-active'>
            Liên hệ
          </Link>
        </nav>
      </header>

      <main className='contact-main'>
        <section className='contact-intro'>
          <h1>Liên hệ với chúng tôi</h1>
          <p>
            Nếu bạn cần tư vấn lộ trình học, hợp tác giảng dạy hoặc hỗ trợ kỹ thuật, vui lòng để lại
            thông tin. Đội ngũ LMS sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </section>

        <section className='contact-grid'>
          <article className='contact-card'>
            <h2>Thông tin liên hệ</h2>
            <p>📍 123 Đường Học Tập, TP. Hà Nội</p>
            <p>📞 1900 1234</p>
            <p>✉️ support@lmsplatform.edu.vn</p>
            <p>🕘 08:00 - 21:00 (Thứ 2 - Chủ nhật)</p>
          </article>

          <article className='contact-card'>
            <h2>Gửi tin nhắn</h2>
            <form onSubmit={handleSubmit} className='contact-form'>
              <input
                type='text'
                placeholder='Họ và tên'
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
              <input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <input
                type='tel'
                placeholder='Số điện thoại'
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <textarea
                placeholder='Nội dung cần hỗ trợ'
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
              <button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi liên hệ'}
              </button>
            </form>
            {errorMessage && <p className='contact-error'>{errorMessage}</p>}
            {isSubmitted && <p className='contact-success'>Đã gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm.</p>}
          </article>
        </section>
      </main>
    </div>
  );
}

export default LienHe;
