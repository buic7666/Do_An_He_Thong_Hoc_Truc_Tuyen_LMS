import { useEffect, useState } from 'react';
import { fetchTeacherProfileApi, updateTeacherProfileApi } from '../../api/teacherApi';
import TeacherSidebar from '../../components/TeacherSidebar';

import './HoSoGiangVien.css';

const initialForm = {
  fullName: 'Bui Van Dong',
  title: 'Giảng viên',
  bio: '',
  linkedin: '',
  facebook: '',
  bankName: '',
  bankAccount: '',
  bankOwner: '',
};

function HoSoGiangVien() {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        }));
      } catch (_error) {
        setForm(initialForm);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updated = await updateTeacherProfileApi(form);
      setForm((previous) => ({
        ...previous,
        ...updated,
      }));
      // eslint-disable-next-line no-alert
      alert('Đã lưu tất cả thay đổi.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể lưu hồ sơ.');
    } finally {
      setIsSaving(false);
    }
  };

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
              <div className="instructor-profile-avatar-preview">D</div>
              <div className="instructor-profile-avatar-info">
                <button className="instructor-profile-btn instructor-profile-btn-outline" type="button">
                  Tải ảnh mới lên
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
                  Chuc danh chuyen mon
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
                  Tieu su / Kinh nghiem lam viec (Bio)
                </label>
                <textarea
                  className="instructor-profile-form-control"
                  id="bio"
                  onChange={handleFieldChange('bio')}
                  placeholder="Viet mot doan ngan gioi thieu ve chuyen mon, kinh nghiem giang day va cac cong nghe ban am hieu..."
                  value={form.bio}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="linkedin">
                  Lien ket LinkedIn
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
                  Lien ket Facebook
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
            <h2 className="instructor-profile-card-title">Cai dat thanh toan (Nhan tien hoa hong)</h2>

            <p className="instructor-profile-payment-note">
              Vui long cung cap thong tin tai khoan ngan hang chinh xac de he thong tu dong chuyen tien doanh thu ban khoa hoc hang thang.
            </p>

            <div className="instructor-profile-form-grid">
              <div className="instructor-profile-form-group full-width">
                <label className="instructor-profile-form-label" htmlFor="bankName">
                  Ten Ngan hang
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
                  So tai khoan
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="bankAccount"
                  onChange={handleFieldChange('bankAccount')}
                  placeholder="Nhap so tai khoan"
                  type="text"
                  value={form.bankAccount}
                />
              </div>

              <div className="instructor-profile-form-group">
                <label className="instructor-profile-form-label" htmlFor="bankOwner">
                  Ten chu tai khoan
                </label>
                <input
                  className="instructor-profile-form-control"
                  id="bankOwner"
                  onChange={handleFieldChange('bankOwner')}
                  placeholder="NHAP TIENG VIET KHONG DAU"
                  type="text"
                  value={form.bankOwner}
                />
              </div>
            </div>
          </section>

          <div className="instructor-profile-form-actions">
            <button className="instructor-profile-btn instructor-profile-btn-primary" disabled={isSaving} onClick={handleSave} type="button">
              {isSaving ? 'Dang luu...' : 'Luu tat ca thay doi'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HoSoGiangVien;
