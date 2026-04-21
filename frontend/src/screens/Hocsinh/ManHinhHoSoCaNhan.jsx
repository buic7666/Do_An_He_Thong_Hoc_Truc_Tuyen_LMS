import './ManHinhHoSoCaNhan.css';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import { logout } from '../../utils/authSession';

function ManHinhHoSoCaNhan() {
  const navigate = useNavigate();
  const currentUser = getCurrentUserSafely();
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.name || currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    dob: currentUser?.dob || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const avatarCharacter = useMemo(() => {
    const text = String(profileForm.fullName || profileForm.email || 'H').trim();
    return text.charAt(0).toUpperCase();
  }, [profileForm.email, profileForm.fullName]);

  const handleSubmitProfile = (event) => {
    event.preventDefault();

    const normalizedName = profileForm.fullName.trim();
    if (!normalizedName) {
      setProfileMessage('Họ và tên không được để trống.');
      return;
    }

    const mergedUser = {
      ...(currentUser || {}),
      name: normalizedName,
      fullName: normalizedName,
      phone: profileForm.phone.trim(),
      dob: profileForm.dob,
      email: profileForm.email,
    };

    sessionStorage.setItem('currentUser', JSON.stringify(mergedUser));
    setProfileMessage('Đã lưu thông tin hồ sơ trên phiên làm việc hiện tại.');
  };

  const handleSubmitPassword = (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage('Vui lòng nhập đầy đủ thông tin đổi mật khẩu.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setPasswordMessage('Đã ghi nhận yêu cầu đổi mật khẩu (demo local).');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogout = () => {
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
            <Link to='/courses' className='student-profile-nav-link'>
              <span>➕ Đăng ký khóa học</span>
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

        <button type='button' className='student-profile-logout-btn' onClick={handleLogout}>
          <span>🚪 Đăng xuất</span>
        </button>
      </aside>

      <main className='student-profile-main-content'>
        <h1 className='student-profile-page-title'>Hồ sơ của tôi</h1>

        <div className='student-profile-container'>
          <section className='student-profile-card'>
            <h2 className='student-profile-card-title'>Thông tin cơ bản</h2>

            <div className='student-profile-avatar-section'>
              <div className='student-profile-avatar-image'>{avatarCharacter}</div>
              <button type='button' className='student-profile-btn-change-avatar'>
                📷 Thay đổi ảnh
              </button>
            </div>

            <form onSubmit={handleSubmitProfile}>
              <div className='student-profile-form-grid'>
                <div className='student-profile-input-group'>
                  <label className='student-profile-input-label' htmlFor='student-fullname'>
                    Họ và tên
                  </label>
                  <input
                    id='student-fullname'
                    type='text'
                    className='student-profile-input-field'
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        fullName: event.target.value,
                      }))
                    }
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
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
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
                    value={profileForm.email}
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
                    value={profileForm.dob}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        dob: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {profileMessage ? <p className='student-profile-form-message'>{profileMessage}</p> : null}

              <div className='student-profile-action-right'>
                <button type='submit' className='student-profile-btn-submit student-profile-btn-primary'>
                  Lưu thông tin
                </button>
              </div>
            </form>
          </section>

          <section className='student-profile-card'>
            <h2 className='student-profile-card-title'>Đổi mật khẩu</h2>

            <form onSubmit={handleSubmitPassword}>
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
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
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
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
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
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </div>

                {passwordMessage ? <p className='student-profile-form-message'>{passwordMessage}</p> : null}

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
