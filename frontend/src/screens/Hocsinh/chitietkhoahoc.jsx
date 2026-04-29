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

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}d`;

function ChiTietKhoaHoc() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = getCurrentUserSafely();
  const token = sessionStorage.getItem('accessToken');
  const isStudentAuthenticated = currentUser?.role === 'student' && isAccessTokenValid(token);
  const [courseDetail, setCourseDetail] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
        setErrorMessage(error?.response?.data?.message || 'Kh�ng t?i du?c chi ti?t kh�a h?c.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseDetail();
  }, [id, isStudentAuthenticated]);

  const syllabus = useMemo(() => {
    const chapters = Array.isArray(courseDetail?.chapters) ? [...courseDetail.chapters] : [];
    const lessons = Array.isArray(courseDetail?.lessons) ? [...courseDetail.lessons] : [];

    if (lessons.length === 0) {
      return [];
    }

    // If chapters exist, group lessons by chapter
    if (chapters.length > 0) {
      return chapters.map((chapter) => {
        const chapterLessons = lessons.filter((lesson) => Number(lesson.chapterId) === Number(chapter.id));
        return {
          id: chapter.id,
          chapter: chapter.title,
          lessonCount: `${chapterLessons.length} Bài học`,
          lessons: chapterLessons.map((lesson) => lesson.title),
        };
      });
    }

    // If no chapters, show all lessons in one section
    lessons.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
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

  const handleSelectQuiz = (quizId) => {
    setSelectedQuizId(quizId);
    setShowQuizTaker(true);
  };

  const handleBackFromQuiz = () => {
    setShowQuizTaker(false);
    setSelectedQuizId(null);
  };

  const handleRefreshCourse = async () => {
    if (!id) return;

    setIsRefreshing(true);
    try {
      const data = await fetchCourseDetailApi(id);
      setCourseDetail(data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Không thể tải lại chi tiết khóa học.');
    } finally {
      setIsRefreshing(false);
    }
  };

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
    return <div className='course-detail-page course-detail-message'>�ang t?i chi ti?t kh�a h?c...</div>;
  }

  if (errorMessage) {
    return <div className='course-detail-page course-detail-message'>{errorMessage}</div>;
  }

  // Show quiz taker if a quiz is selected
  if (showQuizTaker && selectedQuizId) {
    return (
      <div className='course-detail-page'>
        <QuizTaker
          quizId={selectedQuizId}
          onBack={handleBackFromQuiz}
          onSubmit={(result) => {
            console.log('Quiz submitted:', result);
            // You can add additional logic here, like showing a success message
          }}
        />
      </div>
    );
  }

  if (!courseDetail) {
    return <div className='course-detail-page course-detail-message'>Kh�ng c� d? li?u kh�a h?c.</div>;
  }

  return (
    <div className='course-detail-page'>
      <header className='course-detail-topbar'>
        <div className='course-detail-logo'>LMS Platform</div>
      </header>

      <section className='course-detail-hero'>
        <div className='course-detail-hero-content'>
          <div className='course-detail-badges'>
            <span>Kh�a h?c tr?c tuy?n</span>
            <span>{courseDetail.stats?.totalStudents || 0} h?c vi�n d� dang k�</span>
          </div>

          <h1 className='course-detail-title'>{courseDetail.title}</h1>

          <p className='course-detail-short-desc'>{courseDetail.description || 'M� t? dang c?p nh?t.'}</p>
        </div>
      </section>

      <div className='course-detail-layout'>
        <section className='course-detail-main'>
          <div className='course-detail-video-wrap'>
            <img
              src={getCourseImageDataUrl(courseDetail.title, courseDetail.id)}
              alt='Video gi?i thi?u kh�a h?c'
              className='course-detail-video'
            />
          </div>

          <h2 className='course-detail-section-title'>M� t? kh�a h?c</h2>
          <p className='course-detail-description'>
            {courseDetail.description || 'N?i dung chi ti?t c?a kh�a h?c dang du?c c?p nh?t.'}
          </p>

          <h2 className='course-detail-section-title'>L? tr�nh h?c t?p</h2>

          <div className='course-detail-syllabus'>
            {syllabus.length === 0 && <p>Kh�a h?c chua c� b�i h?c n�o.</p>}
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

          <h2 className='course-detail-section-title'>Bài kiểm tra</h2>
          {isEnrolled ? (
            <div className='course-detail-quiz-section'>
              <QuizList
                courseId={id}
                onSelectQuiz={handleSelectQuiz}
              />
            </div>
          ) : (
            <p className='course-detail-quiz-message'>Vui lòng đăng ký khóa học để làm bài kiểm tra.</p>
          )}`r`n        </section>`r`n`r`n        <aside className='course-detail-sidebar'>`r`n          <p className='course-detail-price'>{formatPrice(courseDetail.price)}</p>

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
          <button
            type='button'
            className='course-detail-btn course-detail-btn-secondary'
            onClick={handleRefreshCourse}
            disabled={isRefreshing}
            title='Tải lại danh sách bài học mới từ giáo viên'
          >
            {isRefreshing ? '⏳ Đang tải...' : '🔄 Làm mới'}
          </button>

          <ul className='course-detail-features'>
            <li>?? S? b�i h?c: {courseDetail.stats?.totalLessons || 0}</li>
            <li>?? H?c vi�n dang theo h?c: {courseDetail.stats?.totalStudents || 0}</li>
            <li>?? Quy?n truy c?p tr?n d?i</li>
            <li>?? C?p ch?ng ch? sau khi ho�n th�nh</li>
          </ul>

          <div className='course-detail-instructor'>
            <img
              src='https://via.placeholder.com/50/007bff/fff?text=GV'
              alt='Gi?ng vi�n'
              className='course-detail-instructor-avatar'
            />
            <div>
              <p className='course-detail-instructor-name'>{courseDetail.instructor?.name || '�ang c?p nh?t'}</p>
              <p className='course-detail-instructor-title'>{courseDetail.instructor?.email || 'Gi?ng vi�n'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ChiTietKhoaHoc;

