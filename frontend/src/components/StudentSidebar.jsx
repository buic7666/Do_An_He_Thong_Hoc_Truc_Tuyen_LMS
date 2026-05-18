import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../utils/authSession';
import './StudentSidebar.css';

const studentNavItems = [
  { path: '/dashboard', label: 'Khóa học của tôi', icon: '📚' },
  { path: '/courses', label: 'Đăng ký khóa học', icon: '➕' },
  { path: '/profile', label: 'Hồ sơ cá nhân', icon: '👤' },
  { path: '/transactions', label: 'Lịch sử giao dịch', icon: '💳' },
];

function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className='student-shared-sidebar'>
      <div className='student-shared-brand'>LMS Platform</div>

      <ul className='student-shared-nav'>
        {studentNavItems.map((item) => (
          <li key={item.path}>
            <button
              type='button'
              className={`student-shared-nav-button ${isActive(item.path) ? 'is-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>
                {item.icon} {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button type='button' className='student-shared-logout' onClick={() => logout({ navigate })}>
        <span>🚪 Đăng xuất</span>
      </button>
    </aside>
  );
}

export default StudentSidebar;
