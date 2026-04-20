import './manhinhDangKy.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../../api/authApi';
import { getRoleHomePath } from '../../utils/authRedirect';

function ManHinhDangKy() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const user = await registerApi({ name, email, password, role: 'student' });

      if (user?.token) {
        sessionStorage.setItem('accessToken', user.token);
      }

      sessionStorage.setItem('currentUser', JSON.stringify(user));
      navigate(getRoleHomePath(user?.role));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='register-split-screen'>
      <div className='register-left-panel' />

      <div className='register-right-panel'>
        <div className='register-form-wrapper'>
          <h1 className='register-form-title'>Tạo tài khoản mới</h1>
          <p className='register-form-subtitle'>Bắt đầu hành trình chinh phục tri thức ngay hôm nay.</p>

          <form onSubmit={handleSubmit}>
            <div className='register-input-group'>
              <label htmlFor='register-fullname' className='register-input-label'>
                Họ và tên
              </label>
              <input
                id='register-fullname'
                type='text'
                className='register-input-field'
                placeholder='Ví dụ: Nguyễn Văn A'
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className='register-input-group'>
              <label htmlFor='register-email' className='register-input-label'>
                Email
              </label>
              <input
                id='register-email'
                type='email'
                className='register-input-field'
                placeholder='Nhập địa chỉ email của bạn'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className='register-input-group'>
              <label htmlFor='register-password' className='register-input-label'>
                Mật khẩu
              </label>
              <input
                id='register-password'
                type='password'
                className='register-input-field'
                placeholder='Tạo mật khẩu (Ít nhất 8 ký tự)'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className='register-input-group'>
              <label htmlFor='register-confirm-password' className='register-input-label'>
                Xác nhận mật khẩu
              </label>
              <input
                id='register-confirm-password'
                type='password'
                className='register-input-field'
                placeholder='Nhập lại mật khẩu'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <div className='register-terms-group'>
              <input id='register-terms' type='checkbox' className='register-terms-checkbox' required />
              <label htmlFor='register-terms' className='register-terms-text'>
                Tôi đồng ý với các{' '}
                <a href='/register' onClick={(event) => event.preventDefault()}>
                  Điều khoản dịch vụ
                </a>{' '}
                và{' '}
                <a href='/register' onClick={(event) => event.preventDefault()}>
                  Chính sách bảo mật
                </a>{' '}
                của nền tảng.
              </label>
            </div>

            {errorMessage && <p className='register-input-label'>{errorMessage}</p>}

            <button type='submit' className='register-btn-primary' disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <div className='register-divider'>
            <span>Hoặc đăng ký bằng</span>
          </div>

          <div className='register-social-buttons'>
            <button type='button' className='register-btn-social'>
              <svg viewBox='0 0 24 24' aria-hidden='true'>
                <path
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  fill='#4285F4'
                />
                <path
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  fill='#34A853'
                />
                <path
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  fill='#FBBC05'
                />
                <path
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  fill='#EA4335'
                />
              </svg>
              Google
            </button>

            <button type='button' className='register-btn-social'>
              <svg viewBox='0 0 24 24' aria-hidden='true'>
                <path
                  d='M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z'
                  fill='#1877F2'
                />
              </svg>
              Facebook
            </button>
          </div>

          <p className='register-switch-auth'>
            Đã có tài khoản? <Link to='/login'>Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ManHinhDangKy;
