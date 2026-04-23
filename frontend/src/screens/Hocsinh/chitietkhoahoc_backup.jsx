import './chitietkhoahoc.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCourseDetailApi } from '../../api/courseApi';
import { fetchMyEnrollmentsApi } from '../../api/enrollmentApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import { isAccessTokenValid } from '../../utils/authSession';
import { getCourseImageDataUrl } from '../../utils/courseImage';
import QuizList from '../../components/QuizList';
import QuizTaker from '../../components/QuizTaker';
import QuizList from '../../components/QuizList';
import QuizTaker from '../../components/QuizTaker';

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

function ChiTietKhoaHoc() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = getCurrentUserSafely();
  const token = sessionStorage.getItem('accessToken');
  const isStudentAuthenticated = currentUser?.role === 'student' && isAccessTokenValid(token);
  const [courseDetail, setCourseDetail] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [showQuizTaker, setShowQuizTaker] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [showQuizTaker, setShowQuizTaker] = useState(false);

  useEffect(() => {
    const loadCourseDetail = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [data, enrollmentData] = await Promise.all([
          fetchCourseDetailApi(id),
          isStudentAuthenticated ? fetchMyEnrollmentsApi().catch(() => []) : Promise.resolve([]),
        ]);

        setCourseDetail(data);

        const enrollments = Array.isArray(enrollmentData) ? enrollmentData : [];
        const enrolled = enrollments.some((item) => Number(item.courseId) === Number(id));
        setIsEnrolled(enrolled);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không tải được chi tiết khóa học.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseDetail();
  }, [id, isStudentAuthenticated]);

  const syllabus = useMemo(() => {
    const lessons = Array.isArray(courseDetail?.lessons) ? [...courseDetail.lessons] : [];

    lessons.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));

    if (lessons.length === 0) {
      return [];
    }

    return [
      {
        id: 1,
        chapter: 'Nội dung khóa học',
        lessonCount: `${lessons.length} Bài học`,
        lessons: lessons.map((lesson) => lesson.title),
      },
    ];
  }, [courseDetail]);

  const firstLessonId = useMemo(() => {
    const lessons = Array.isArray(courseDetail?.lessons) ? [...courseDetail.lessons] : [];
    lessons.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
    return lessons.length > 0 ? lessons[0].id : null;
  }, [courseDetail]);

  const handlePrimaryAction = () => {
    if (isEnrolled) {
      if (firstLessonId) {
        navigate(`/learn?courseId=${id}&lessonId=${firstLessonId}`);
        return;
      }

      navigate(`/learn?courseId=${id}`);
      return;
    }

    if (isStudentAuthenticated) {
      navigate(`/enroll/${id}`);
      return;
    }

    navigate(`/login?redirect=${encodeURIComponent(`/enroll/${id}`)}`);
  };

  if (isLoading) {
    return <div className='course-detail-page course-detail-message'>Đang tải chi tiết khóa học...</div>;
  }

  if (errorMessage) {
    return <div className='course-detail-page course-detail-message'>{errorMessage}</div>;
  }

  if (!courseDetail) {
    return <div className='course-detail-page course-detail-message'>Không có dữ liệu khóa học.</div>;
  }

  return (
    <div className='course-detail-page'>
      <header className='course-detail-topbar'>
        <div className='course-detail-logo'>LMS Platform</div>
      </header>

      <section className='course-detail-hero'>
        <div className='course-detail-hero-content'>
          <div className='course-detail-badges'>
            <span>Khóa học trực tuyến</span>
            <span>{courseDetail.stats?.totalStudents || 0} học viên đã đăng ký</span>
          </div>

          <h1 className='course-detail-title'>{courseDetail.title}</h1>

          <p className='course-detail-short-desc'>{courseDetail.description || 'Mô tả đang cập nhật.'}</p>
        </div>
      </section>

      <div className='course-detail-layout'>
        <section className='course-detail-main'>
          <div className='course-detail-video-wrap'>
            <img
              src={getCourseImageDataUrl(courseDetail.title, courseDetail.id)}
              alt='Video giới thiệu khóa học'
              className='course-detail-video'
            />
          </div>

          <h2 className='course-detail-section-title'>Mô tả khóa học</h2>
          <p className='course-detail-description'>
            {courseDetail.description || 'Nội dung chi tiết của khóa học đang được cập nhật.'}
          </p>

          <h2 className='course-detail-section-title'>Lộ trình học tập</h2>

          <div className='course-detail-syllabus'>
            {syllabus.length === 0 && <p>Khóa học chưa có bài học nào.</p>}
            {syllabus.map((item) => (
              <article key={item.id} className='course-detail-syllabus-item'>
                <header className='course-detail-syllabus-header'>
                  <span>{item.chapter}</span>
                  <span>{item.lessonCount}</span>
                </header>

                <div className='course-detail-syllabus-body'>
                  {item.lessons.map((lesson) => (
                    <p key={lesson} className='course-detail-lesson'>
                      {lesson}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className='course-detail-sidebar'>
          <p className='course-detail-price'>{formatPrice(courseDetail.price)}</p>

          <button
            type='button'
            className='course-detail-btn course-detail-btn-primary'
            onClick={handlePrimaryAction}
          >
            {isEnrolled ? 'Vào học ngay' : 'Đăng ký ngay'}
          </button>
          <button
            type='button'
            className='course-detail-btn course-detail-btn-secondary'
            onClick={() => navigate(`/enroll/${courseDetail.id}`)}
          >
            {isEnrolled ? 'Quản lý đăng ký' : 'Xem màn hình đăng ký'}
          </button>

          <ul className='course-detail-features'>
            <li>🕒 Số bài học: {courseDetail.stats?.totalLessons || 0}</li>
            <li>📄 Học viên đang theo học: {courseDetail.stats?.totalStudents || 0}</li>
            <li>♾️ Quyền truy cập trọn đời</li>
            <li>🏆 Cấp chứng chỉ sau khi hoàn thành</li>
          </ul>

          <div className='course-detail-instructor'>
            <img
              src='https://via.placeholder.com/50/007bff/fff?text=GV'
              alt='Giảng viên'
              className='course-detail-instructor-avatar'
            />
            <div>
              <p className='course-detail-instructor-name'>{courseDetail.instructor?.name || 'Đang cập nhật'}</p>
              <p className='course-detail-instructor-title'>{courseDetail.instructor?.email || 'Giảng viên'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ChiTietKhoaHoc;
