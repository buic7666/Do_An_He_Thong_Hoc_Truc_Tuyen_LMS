import { Navigate, Route, Routes } from 'react-router-dom';

import TrangchuWeb from './screens/Public/TrangchuWeb';
import DanhSachGiangVien from './screens/Public/DanhSachGiangVien';
import ChiTietGiangVien from './screens/Public/ChiTietGiangVien';
import LienHe from './screens/Public/LienHe';
import Chitietkhoahoc from './screens/Hocsinh/chitietkhoahoc';
import TrangDsKhoaHoc from './screens/Hocsinh/TrangDsKhoaHoc';
import ManHinhDangNhap from './screens/Public/ManHinhDangNhap';
import ManHinhDangKy from './screens/Public/manhinhDangKy';
import BangDieuKhienCaNhan from './screens/Hocsinh/BangDieuKhienCaNhan';
import ManHinhHocTap from './screens/Hocsinh/ManHinhHocTap';
import ManHinhHoSoCaNhan from './screens/Hocsinh/ManHinhHoSoCaNhan';
import ManHinhLamBaiThi from './screens/Hocsinh/ManHinhLamBaiThi';
import ManHinhLichSuGiaoDich from './screens/Hocsinh/ManHinhLichSuGiaoDich';
import ManHinhThanhToan from './screens/Hocsinh/ManHinhThanhToan';
import ManHinhTrangThaiGiaoDich from './screens/Hocsinh/ManHinhTrangThaiGiaoDich';
import ManHinhDangKyKhoaHoc from './screens/Hocsinh/ManHinhDangKyKhoaHoc';
import ManHinhChinhGiaoVien from './screens/GiangVien/ManHinhChinhGiaoVien';
import ManHinhQuanLyKhoaHoc from './screens/GiangVien/ManHinhQuanLyKhoaHoc';
import Step1_DanhSachKhoaHoc from './screens/GiangVien/Step1_DanhSachKhoaHoc';
import Step2_ChiTietKhoaHoc from './screens/GiangVien/Step2_ChiTietKhoaHoc';
import Step3_ChiTietChapter from './screens/GiangVien/Step3_ChiTietChapter';
import LessonDetail from './screens/GiangVien/LessonDetail';
import ManHinhQuanLyNganHangCauhoi from './screens/GiangVien/ManHinhQuanLyNganHangCauhoi';
import ManHinhTheoDoiDSoHocvien from './screens/GiangVien/ManHinhTheoDoi_DSoHocvien';
import ManHInhChatGV from './screens/GiangVien/ManHInhChatGV';
import HoSoGiangVien from './screens/GiangVien/HoSoGiangVien';
import ManHinhBaoCaoDoanhthu from './screens/GiangVien/ManHinhBaoCaoDoanhthu';
import ManHinhChinhAdmin from './screens/Admin/ManHinhChinhAdmin';
import QuanLyNguoiDung from './screens/Admin/QuanLyNguoiDung';
import PheDuyetBaiDang from './screens/Admin/PheDuyetBaiDang';
import CauHinhHeThong from './screens/Admin/CauHinhHeThong';
import QuanLyPhanHoi from './screens/Admin/quanlyPhanHoi';
import QuanLyGiaoDich from './screens/Admin/QuanLyGiaoDich';
import ManHinhchitietKhoaHoc from './screens/KhachVangLai/ManHinhchitietKhoaHoc';
import ManHinhTinTuc_Sk from './screens/KhachVangLai/ManHinhTinTuc_Sk';
import ManHinhxemThubaiGiang from './screens/KhachVangLai/ManHinhxemThubaiGiang';
import FacebookOAuthCallback from './screens/Public/FacebookOAuthCallback';
import { getAuthenticatedHomePath, getCurrentUserSafely, getRoleHomePath } from './utils/authRedirect';
import { clearAuthSession, isAccessTokenValid } from './utils/authSession';

function PublicOnlyRoute({ children }) {
  const token = sessionStorage.getItem('accessToken');
  const user = getCurrentUserSafely();
  const hasValidToken = isAccessTokenValid(token);

  if (hasValidToken && user?.role) {
    return <Navigate to={getAuthenticatedHomePath()} replace />;
  }

  if ((token && !hasValidToken) || (hasValidToken && !user?.role)) {
    clearAuthSession();
  }

  return children;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = sessionStorage.getItem('accessToken');
  const user = getCurrentUserSafely();
  const hasValidToken = isAccessTokenValid(token);

  if (!token || !hasValidToken) {
    clearAuthSession();
    return <Navigate to='/login' replace />;
  }

  if (!user?.role) {
    clearAuthSession();
    return <Navigate to='/login' replace />;
  }

  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={getRoleHomePath(user?.role)} replace />;
    }
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<TrangchuWeb />} />
      <Route path='/contact' element={<LienHe />} />
      <Route path='/instructors' element={<DanhSachGiangVien />} />
      <Route path='/instructors/:id' element={<ChiTietGiangVien />} />
      <Route path="/courses" element={<TrangDsKhoaHoc />} />
      <Route path="/courses/:id" element={<Chitietkhoahoc />} />
      <Route
        path='/login'
        element={
          <PublicOnlyRoute>
            <ManHinhDangNhap />
          </PublicOnlyRoute>
        }
      />
      <Route
        path='/register'
        element={
          <PublicOnlyRoute>
            <ManHinhDangKy />
          </PublicOnlyRoute>
        }
      />
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <BangDieuKhienCaNhan />
          </ProtectedRoute>
        }
      />
      <Route
        path='/learn'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhHocTap />
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhHoSoCaNhan />
          </ProtectedRoute>
        }
      />
      <Route
        path='/exam'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhLamBaiThi />
          </ProtectedRoute>
        }
      />
      <Route
        path='/transactions'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhLichSuGiaoDich />
          </ProtectedRoute>
        }
      />
      <Route
        path='/checkout'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhThanhToan />
          </ProtectedRoute>
        }
      />
      <Route
        path='/enroll/:courseId'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhDangKyKhoaHoc />
          </ProtectedRoute>
        }
      />
      <Route
        path='/payment-status'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ManHinhTrangThaiGiaoDich />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/dashboard'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManHinhChinhGiaoVien />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/courses'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Step1_DanhSachKhoaHoc />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/courses/:courseId/chapters'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Step2_ChiTietKhoaHoc />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/courses/:courseId/chapters/:chapterId/lessons'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Step3_ChiTietChapter />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/courses/:courseId/chapters/:chapterId/lessons/:lessonId'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <LessonDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/questions'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManHinhQuanLyNganHangCauhoi />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/students'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManHinhTheoDoiDSoHocvien />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/interaction'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManHInhChatGV />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/profile'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <HoSoGiangVien />
          </ProtectedRoute>
        }
      />
      <Route
        path='/teacher/revenue'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManHinhBaoCaoDoanhthu />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/dashboard'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManHinhChinhAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/users'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <QuanLyNguoiDung />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/course-approval'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PheDuyetBaiDang />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/settings'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CauHinhHeThong />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/support'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <QuanLyPhanHoi />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/transactions'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <QuanLyGiaoDich />
          </ProtectedRoute>
        }
      />
      <Route path="/guest/course/:id" element={<ManHinhchitietKhoaHoc />} />
      <Route path="/guest/news" element={<ManHinhTinTuc_Sk />} />
      <Route path="/guest/preview" element={<ManHinhxemThubaiGiang />} />
      <Route path='/guest/course/:id/preview' element={<ManHinhxemThubaiGiang />} />
      <Route path='/oauth/facebook/callback' element={<FacebookOAuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;