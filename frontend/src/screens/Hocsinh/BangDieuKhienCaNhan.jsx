import './BangDieuKhienCaNhan.css';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCourseDetailApi, fetchCourseProgressApi } from '../../api/courseApi';
import { fetchMyEnrollmentsApi } from '../../api/enrollmentApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import { logout } from '../../utils/authSession';
import { getCourseImageDataUrl } from '../../utils/courseImage';
import { getCourseDurationLabel } from '../../utils/courseDurationLabel';

function BangDieuKhienCaNhan() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUserSafely();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [courses, setCourses] = useState([]);

  const handleLogout = () => {
    logout({ navigate });
  };

  useEffect(() => {
    let isCancelled = false;

    const loadDashboardData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const enrollments = await fetchMyEnrollmentsApi();
        const enrolledCourses = Array.isArray(enrollments) ? enrollments : [];

        const resolvedCourses = await Promise.all(
          enrolledCourses.map(async (enrollment) => {
            const [detail, progress] = await Promise.all([
              fetchCourseDetailApi(enrollment.courseId),
              fetchCourseProgressApi(enrollment.courseId).catch(() => null),
            ]);

            const sortedLessons = [...(Array.isArray(detail?.lessons) ? detail.lessons : [])].sort(
              (left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0),
            );

            return {
              id: enrollment.courseId,
              title: detail?.title || enrollment?.course?.title || 'Khóa học',
              image: getCourseImageDataUrl(detail?.title || enrollment?.course?.title || 'Course', enrollment.courseId),
              alt: detail?.title || enrollment?.course?.title || 'Course',
              durationLabel: getCourseDurationLabel(detail || enrollment?.course),
              progressPercent: Number(progress?.completionPercent || 0),
              completedLessons: Number(progress?.completedLessons || 0),
              totalLessons: Number(progress?.totalLessons || sortedLessons.length || 0),
              firstLessonId: sortedLessons.length > 0 ? sortedLessons[0].id : null,
            };
          }),
        );

        if (!isCancelled) {
          setCourses(resolvedCourses);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error?.response?.data?.message || 'Không tải được dữ liệu dashboard.');
          setCourses([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter((course) => course.progressPercent >= 100).length;

    return [
      {
        id: 1,
        icon: '📖',
        value: totalCourses,
        label: 'Khóa học đang học',
        iconClass: 'student-dashboard-stat-icon is-primary',
      },
      {
        id: 2,
        icon: '✅',
        value: completedCourses,
        label: 'Khóa học hoàn thành',
        iconClass: 'student-dashboard-stat-icon is-success',
      },
      {
        id: 3,
        icon: '🏆',
        value: completedCourses,
        label: 'Chứng chỉ đạt được',
        iconClass: 'student-dashboard-stat-icon is-warning',
      },
    ];
  }, [courses]);

  const goToLearn = (course) => {
    if (!course?.firstLessonId) {
      return;
    }

    navigate(`/learn?courseId=${course.id}&lessonId=${course.firstLessonId}`);
  };

  const goToCourseDetail = (course) => {
    if (!course?.id) {
      return;
    }

    navigate(`/courses/${course.id}`);
  };

  const getAvatarCharacter = () => {
    const name = String(currentUser?.name || currentUser?.fullName || 'H').trim();
    return name.charAt(0).toUpperCase();
  };

  const isCurrentPath = (path) => location.pathname === path;

  return (
    <div className='student-dashboard'>
      <aside className='student-dashboard-sidebar'>
        <div className='student-dashboard-brand'>LMS Platform</div>

        <ul className='student-dashboard-nav'>
          <li>
            <button
              type='button'
              className={`student-dashboard-nav-link ${isCurrentPath('/dashboard') ? 'is-active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              📚 Khóa học của tôi
            </button>
          </li>
          <li>
            <button
              type='button'
              className={`student-dashboard-nav-link ${isCurrentPath('/profile') ? 'is-active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              👤 Hồ sơ cá nhân
            </button>
          </li>
          <li>
            <button
              type='button'
              className={`student-dashboard-nav-link ${isCurrentPath('/transactions') ? 'is-active' : ''}`}
              onClick={() => navigate('/transactions')}
            >
              💳 Lịch sử giao dịch
            </button>
          </li>
          <li>
            <button
              type='button'
              className={`student-dashboard-nav-link ${isCurrentPath('/courses') ? 'is-active' : ''}`}
              onClick={() => navigate('/courses')}
            >
              ➕ Đăng ký khóa học
            </button>
          </li>
        </ul>

        <button type='button' className='student-dashboard-logout' onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </aside>

      <main className='student-dashboard-main'>
        <header className='student-dashboard-header'>
          <div>
            <h1>Chào mừng trở lại, {currentUser?.name || currentUser?.fullName || 'Bạn'}!</h1>
            <p>Tiếp tục hành trình học tập của bạn ngay hôm nay.</p>
          </div>

          <div className='student-dashboard-user'>
            <div className='student-dashboard-avatar'>{getAvatarCharacter()}</div>
          </div>
        </header>

        <section className='student-dashboard-stats'>
          {stats.map((item) => (
            <article key={item.id} className='student-dashboard-stat-card'>
              <div className={item.iconClass}>{item.icon}</div>
              <div>
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section>
          <h2 className='student-dashboard-section-title'>Khóa học đang diễn ra</h2>

          {isLoading ? <p className='student-dashboard-state-text'>Đang tải danh sách khóa học...</p> : null}
          {!isLoading && errorMessage ? <p className='student-dashboard-state-text'>{errorMessage}</p> : null}
          {!isLoading && !errorMessage && courses.length === 0 ? (
            <p className='student-dashboard-state-text'>Bạn chưa đăng ký khóa học nào.</p>
          ) : null}

          <div className='student-dashboard-courses'>
            {courses.map((course) => (
              <article
                key={course.id}
                className='student-dashboard-course-card is-clickable'
                role='button'
                tabIndex={0}
                onClick={() => goToCourseDetail(course)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    goToCourseDetail(course);
                  }
                }}
              >
                <img src={course.image} alt={course.alt} className='student-dashboard-course-thumb' />

                <div className='student-dashboard-course-body'>
                  <span className='student-dashboard-course-duration'>{course.durationLabel}</span>
                  <h3 className='student-dashboard-course-title'>{course.title}</h3>

                  <div className='student-dashboard-progress-wrap'>
                    <div className='student-dashboard-progress-text'>
                      <span>Tiến độ học tập</span>
                      <span className='student-dashboard-progress-value'>{course.progressPercent}%</span>
                    </div>

                    <div className='student-dashboard-progress-text'>
                      <span>
                        {course.completedLessons}/{course.totalLessons} bài học
                      </span>
                    </div>

                    <div className='student-dashboard-progress-bg'>
                      <div className='student-dashboard-progress-fill' style={{ width: `${course.progressPercent}%` }} />
                    </div>
                  </div>

                  <button
                    type='button'
                    className='student-dashboard-continue'
                    onClick={(event) => {
                      event.stopPropagation();
                      goToLearn(course);
                    }}
                    disabled={!course.firstLessonId}
                  >
                    ▶ Tiếp tục học
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default BangDieuKhienCaNhan;
