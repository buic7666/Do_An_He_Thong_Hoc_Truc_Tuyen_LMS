import './ManHinhHoSoCaNhan.css';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../utils/authSession';

function ManHinhHoSoCaNhan() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleLogout = (event) => {
    event.preventDefault();
    logout({ navigate });
  };

  return (
    <div className='student-profile-page'>
      <aside className='student-profile-sidebar'>
        <div className='student-profile-brand'>LMS Platform</div>

        <ul className='student-profile-nav-menu'>
          <li>
            <Link to='/dashboard' className='student-profile-nav-link'>
              <span>📚 Khóa học của tôi</span>
            </Link>
          </li>
          <li>
            <Link to='/profile' className='student-profile-nav-link is-active'>
              <span>👤 Hồ sơ cá nhân</span>
            </Link>
          </li>
          <li>
            <Link to='/transactions' className='student-profile-nav-link'>
              <span>💳 Lịch sử giao dịch</span>
            </Link>
          </li>
        </ul>

        <Link to='/login' className='student-profile-logout-btn' onClick={handleLogout}>
          <span>🚪 Đăng xuất</span>
        </Link>
      </aside>

      <main className='student-profile-main-content'>
        <h1 className='student-profile-page-title'>Hồ sơ của tôi</h1>

        <div className='student-profile-container'>
          <section className='student-profile-card'>
            <h2 className='student-profile-card-title'>Thông tin cơ bản</h2>

            <div className='student-profile-avatar-section'>
              <div className='student-profile-avatar-image'>Đ</div>
              <button type='button' className='student-profile-btn-change-avatar'>
                📷 Thay đổi ảnh
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className='student-profile-form-grid'>
                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-fullname'>
                    Họ và tên
                  </label>
                  <input
                    id='student-fullname'
                    type='text'
                    className='student-profile-input-field'
                    defaultValue='Bùi Văn Đồng'
                  />
                </div>

                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-phone'>
                    Số điện thoại
                  </label>
                  <input
                    id='student-phone'
                    type='tel'
                    className='student-profile-input-field'
                    defaultValue='0912 345 678'
                  />
                </div>

                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-email'>
                    Địa chỉ Email (Không thể thay đổi)
                  </label>
                  <input
                    id='student-email'
                    type='email'
                    className='student-profile-input-field'
                    defaultValue='dong.buivan@student.tlu.edu.vn'
                    disabled
                  />
                </div>

                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-dob'>
                    Ngày sinh
                  </label>
                  <input
                    id='student-dob'
                    type='date'
                    className='student-profile-input-field'
                    defaultValue='2003-01-15'
                  />
                </div>
              </div>

              <div className='student-profile-action-right'>
                <button type='submit' className='student-profile-btn-submit student-profile-btn-primary'>
                  Lưu thông tin
                </button>
              </div>
            </form>
          </section>

          <section className='student-profile-card'>
            <h2 className='student-profile-card-title'>Đổi mật khẩu</h2>

            <form onSubmit={handleSubmit}>
              <div className='student-profile-form-column'>
                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-current-pwd'>
                    Mật khẩu hiện tại
                  </label>
                  <input
                    id='student-current-pwd'
                    type='password'
                    className='student-profile-input-field'
                    placeholder='Nhập mật khẩu hiện tại'
                  />
                </div>

                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-new-pwd'>
                    Mật khẩu mới
                  </label>
                  <input
                    id='student-new-pwd'
                    type='password'
                    className='student-profile-input-field'
                    placeholder='Mật khẩu mới (Tối thiểu 8 ký tự)'
                  />
                </div>

                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-confirm-pwd'>
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    id='student-confirm-pwd'
                    type='password'
                    className='student-profile-input-field'
                    placeholder='Nhập lại mật khẩu mới'
                  />
                </div>

                <div>
                  <button type='submit' className='student-profile-btn-submit student-profile-btn-outline'>
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ManHinhHoSoCaNhan;
