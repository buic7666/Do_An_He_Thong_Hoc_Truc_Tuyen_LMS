import { useEffect, useRef, useState } from 'react';
import {
  fetchTeacherProfileApi,
  updateTeacherProfileApi,
  uploadTeacherFileApi,
} from '../../api/teacherApi';
import TeacherSidebar from '../../components/TeacherSidebar';

import './HoSoGiangVien.css';

const initialForm = {
  fullName: 'Bùi Văn Đồng',
  title: 'Giảng viên',
  bio: '',
  avatarUrl: '',
  linkedin: '',
  facebook: '',
  bankName: '',
  bankAccount: '',
  bankOwner: '',
};

const getInitial = (name) => {
  const text = String(name || '').trim();
  return text ? text.charAt(0).toUpperCase() : 'G';
};

const getAssetUrl = (url) => {
  if (!url) return '';

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const origin = baseUrl.replace(/\/api\/?$/, '');

  return `${origin}${url}`;
};

function HoSoGiangVien() {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleFieldChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const data = await fetchTeacherProfileApi();

        setForm((previous) => ({
          ...previous,
          ...data,
          avatarUrl: data?.avatarUrl || '',
        }));
      } catch (_error) {
        setForm(initialForm);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh JPG, PNG hoặc GIF.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh đại diện không được vượt quá 2MB.');
      event.target.value = '';
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const uploaded = await uploadTeacherFileApi(file, 'image');
      const nextAvatarUrl = uploaded?.path || uploaded?.url || '';

      if (!nextAvatarUrl) {
        throw new Error('Upload ảnh thành công nhưng không nhận được đường dẫn ảnh.');
      }

      setForm((previous) => ({
        ...previous,
        avatarUrl: nextAvatarUrl,
      }));

      alert('Đã tải ảnh lên. Bấm "Lưu tất cả thay đổi" để lưu vào hồ sơ.');
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || 'Không thể upload ảnh đại diện.');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

 const handleSave = async () => {
  setIsSaving(true);

  try {
    const payload = {
      fullName: form.fullName,
      title: form.title,
      bio: form.bio,
      avatarUrl: form.avatarUrl,
      linkedin: form.linkedin,
      facebook: form.facebook,
      bankName: form.bankName,
      bankAccount: form.bankAccount,
      bankOwner: form.bankOwner,
    };

    const updated = await updateTeacherProfileApi(payload);

    setForm((previous) => ({
      ...previous,
      ...updated,
      avatarUrl: updated?.avatarUrl || previous.avatarUrl || '',
    }));

    alert('Đã lưu tất cả thay đổi.');
  } catch (error) {
    alert(error?.response?.data?.message || 'Không thể lưu hồ sơ.');
  } finally {
    setIsSaving(false);
  }
};
  const avatarSrc = getAssetUrl(form.avatarUrl);

  return (
    <div className="instructor-profile-page">
      <TeacherSidebar />

      <main className="instructor-profile-main-content">
        <header className="instructor-profile-page-header">
          <h1 className="instructor-profile-page-title">Cài đặt Hồ sơ Giảng viên</h1>
          {isLoading ? <p>Đang tải dữ liệu từ CSDL...</p> : null}
        </header>

        <div className="instructor-profile-settings-container">
          <section className="instructor-profile-card">
            <h2 className="instructor-profile-card-title">Hồ sơ công khai</h2>

            <div className="instructor-profile-avatar-upload">
              <div className="instructor-profile-avatar-preview">
                {avatarSrc ? (
                  <img
                    alt="Ảnh đại diện giảng viên"
                    src={avatarSrc}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  getInitial(form.fullName)
                )}
              </div>

              <div className="instructor-profile-avatar-info">
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  type="file"
                />

                <button
                  className="instructor-profile-btn instructor-profile-btn-outline"
                  disabled={isUploadingAvatar}
                  onClick={handleChooseAvatar}
                  type="button"
                >
                  {isUploadingAvatar ? 'Đang tải ảnh...' : 'Tải ảnh mới lên'}
                </button>

                <p>Định dạng JPG, PNG hoặc GIF. Kích thước tối đa 2MB.</p>
              </div>
            </div>

            <div className="instructor-profile-form-grid">
              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="fullName">
                  Họ và tên
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="fullName"
                  onChange={handleFieldChange('fullName')}
                  type="text"
                  value={form.fullName}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="title">
                  Chức danh chuyên môn
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="title"
                  onChange={handleFieldChange('title')}
                  type="text"
                  value={form.title}
                />
              </div>

              <div className="instructor-profile-form-group full-width">
                <label className="instructor-profile-form-label" htmlFor="bio">
                  Tiểu sử / kinh nghiệm giảng dạy / chuyên môn
                </label>
                <textarea
                  className="instructor-profile-form-control"
                  id="bio"
                  onChange={handleFieldChange('bio')}
                  placeholder="Viết một đoạn ngắn giới thiệu về chuyên môn, kinh nghiệm giảng dạy và các công nghệ bạn am hiểu..."
                  value={form.bio}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="linkedin">
                  Liên kết LinkedIn
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="linkedin"
                  onChange={handleFieldChange('linkedin')}
                  placeholder="https://linkedin.com/in/yourprofile"
                  type="url"
                  value={form.linkedin}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="facebook">
                  Liên kết Facebook
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="facebook"
                  onChange={handleFieldChange('facebook')}
                  placeholder="https://facebook.com/yourprofile"
                  type="url"
                  value={form.facebook}
                />
              </div>
            </div>
          </section>

          <section className="instructor-profile-card">
            <h2 className="instructor-profile-card-title">
              Cài đặt thanh toán nhận doanh thu
            </h2>

            <p className="instructor-profile-payment-note">
              Vui lòng cung cấp thông tin tài khoản ngân hàng chính xác để hệ thống chuyển tiền doanh thu bán khóa học.
            </p>

            <div className="instructor-profile-form-grid">
              <div className="instructor-profile-form-group full-width">
                <label className="instructor-profile-form-label" htmlFor="bankName">
                  Tên ngân hàng
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="bankName"
                  onChange={handleFieldChange('bankName')}
                  placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                  type="text"
                  value={form.bankName}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="bankAccount">
                  Số tài khoản
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="bankAccount"
                  onChange={handleFieldChange('bankAccount')}
                  placeholder="Nhập số tài khoản"
                  type="text"
                  value={form.bankAccount}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="bankOwner">
                  Tên chủ tài khoản
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="bankOwner"
                  onChange={handleFieldChange('bankOwner')}
                  placeholder="NGUYEN VAN A"
                  type="text"
                  value={form.bankOwner}
                />
              </div>
            </div>
          </section>

          <div className="instructor-profile-form-actions">
            <button
              className="instructor-profile-btn instructor-profile-btn-primary"
              disabled={isSaving || isUploadingAvatar}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HoSoGiangVien;