import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../utils/authSession';
import './TeacherSidebar.css';

const teacherNavItems = [
  { path: '/teacher/dashboard', label: 'Tổng quan' },
  { path: '/teacher/courses', label: 'Quản lý khóa học' },
  { path: '/teacher/questions', label: 'Ngân hàng câu hỏi' },
  { path: '/teacher/students', label: 'Quản lý học viên' },
  { path: '/teacher/interaction', label: 'Tương tác học viên' },
  { path: '/teacher/profile', label: 'Hồ sơ giảng viên' },
  { path: '/teacher/revenue', label: 'Doanh thu' },
];

function TeacherSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className='teacher-shared-sidebar'>
      <div className='teacher-shared-brand'>
        <div className='teacher-shared-brand-icon'>L</div>
        <span>LMS Admin</span>
      </div>

      <ul className='teacher-shared-nav'>
        {teacherNavItems.map((item) => (
          <li key={item.path}>
            <button
              type='button'
              className={`teacher-shared-nav-button ${isActive(item.path) ? 'is-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <button type='button' className='teacher-shared-logout' onClick={() => logout({ navigate })}>
        Đăng xuất
      </button>
    </aside>
  );
}

export default TeacherSidebar;
