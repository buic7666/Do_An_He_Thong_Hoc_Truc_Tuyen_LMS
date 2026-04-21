import './ManHinhDangKyKhoaHoc.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchCourseDetailApi } from '../../api/courseApi';
import { createEnrollmentApi } from '../../api/enrollmentApi';
import { getCourseImageDataUrl } from '../../utils/courseImage';

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

function ManHinhDangKyKhoaHoc() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadCourse = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchCourseDetailApi(courseId);
        if (!isCancelled) {
          setCourseDetail(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error?.response?.data?.message || 'Không tải được thông tin khóa học.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      isCancelled = true;
    };
  }, [courseId]);

  const sortedLessons = useMemo(() => {
    const lessons = Array.isArray(courseDetail?.lessons) ? [...courseDetail.lessons] : [];
    lessons.sort((left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0));
    return lessons;
  }, [courseDetail]);

  const firstLessonId = sortedLessons.length > 0 ? sortedLessons[0].id : null;

  const goToLearning = () => {
    if (!courseDetail?.id) {
      return;
    }

    if (firstLessonId) {
      navigate(`/learn?courseId=${courseDetail.id}&lessonId=${firstLessonId}`);
      return;
    }

    navigate(`/learn?courseId=${courseDetail.id}`);
  };

  const handleEnroll = async () => {
    if (!courseDetail?.id) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setNoticeMessage('');

    try {
      await createEnrollmentApi(courseDetail.id);
      setNoticeMessage('Đăng ký khóa học thành công. Bạn có thể bắt đầu học ngay.');
      setIsAlreadyEnrolled(true);
    } catch (error) {
      if (error?.response?.status === 409) {
        setNoticeMessage('Bạn đã đăng ký khóa học này trước đó. Chuyển sang học ngay.');
        setIsAlreadyEnrolled(true);
      } else {
        setErrorMessage(error?.response?.data?.message || 'Không thể đăng ký khóa học lúc này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className='course-enroll-page course-enroll-message'>Đang tải thông tin đăng ký...</div>;
  }

  if (errorMessage && !courseDetail) {
    return <div className='course-enroll-page course-enroll-message'>{errorMessage}</div>;
  }

  if (!courseDetail) {
    return <div className='course-enroll-page course-enroll-message'>Khóa học không tồn tại.</div>;
  }

  return (
    <div className='course-enroll-page'>
      <header className='course-enroll-topbar'>
        <Link to='/courses' className='course-enroll-brand'>
          LMS Platform
        </Link>
      </header>

      <section className='course-enroll-hero'>
        <div className='course-enroll-hero-content'>
          <h1 className='course-enroll-title'>Đăng ký khóa học</h1>
          <p className='course-enroll-subtitle'>Xác nhận thông tin trước khi ghi danh và bắt đầu học ngay.</p>
        </div>
      </section>

      <main className='course-enroll-layout'>
        <section className='course-enroll-main'>
          <div className='course-enroll-card'>
            <div className='course-enroll-preview'>
              <img
                src={getCourseImageDataUrl(courseDetail.title, courseDetail.id)}
                alt={courseDetail.title}
                className='course-enroll-thumb'
              />
            </div>

            <h2 className='course-enroll-course-name'>{courseDetail.title}</h2>
            <p className='course-enroll-description'>{courseDetail.description || 'Mô tả đang cập nhật.'}</p>

            <ul className='course-enroll-meta'>
              <li>Giảng viên: {courseDetail.instructor?.name || 'Đang cập nhật'}</li>
              <li>Số bài học: {courseDetail.stats?.totalLessons || sortedLessons.length}</li>
              <li>Học viên đã tham gia: {courseDetail.stats?.totalStudents || 0}</li>
            </ul>
          </div>
        </section>

        <aside className='course-enroll-sidebar'>
          <p className='course-enroll-price'>{formatPrice(courseDetail.price)}</p>

          {!isAlreadyEnrolled ? (
            <button
              type='button'
              className='course-enroll-btn course-enroll-btn-primary'
              onClick={handleEnroll}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý đăng ký...' : 'Xác nhận đăng ký'}
            </button>
          ) : (
            <button type='button' className='course-enroll-btn course-enroll-btn-primary' onClick={goToLearning}>
              Bắt đầu học ngay
            </button>
          )}

          <button type='button' className='course-enroll-btn course-enroll-btn-secondary' onClick={() => navigate(`/courses/${courseDetail.id}`)}>
            Quay lại chi tiết khóa học
          </button>

          {noticeMessage ? <p className='course-enroll-notice'>{noticeMessage}</p> : null}
          {errorMessage ? <p className='course-enroll-error'>{errorMessage}</p> : null}
        </aside>
      </main>
    </div>
  );
}

export default ManHinhDangKyKhoaHoc;