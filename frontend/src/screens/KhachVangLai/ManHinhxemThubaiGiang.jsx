import './ManHinhxemThubaiGiang.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchCourseDetailApi } from '../../api/courseApi';

function ManHinhxemThubaiGiang() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const lessonId = Number(searchParams.get('lessonId'));
  const courseId = id || searchParams.get('courseId');

  useEffect(() => {
    if (!courseId) {
      setIsLoading(false);
      setErrorMessage('Thiếu thông tin khóa học để xem thử.');
      return;
    }

    const loadCourse = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchCourseDetailApi(courseId);
        setCourseDetail(data);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không thể tải dữ liệu xem thử.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  const selectedLesson = useMemo(() => {
    const lessons = Array.isArray(courseDetail?.lessons) ? courseDetail.lessons : [];

    if (lessons.length === 0) {
      return null;
    }

    if (lessonId) {
      return lessons.find((lesson) => Number(lesson.id) === lessonId) || lessons[0];
    }

    return lessons[0];
  }, [courseDetail, lessonId]);

  const handleClose = () => {
    if (courseId) {
      navigate(`/guest/course/${courseId}`);
      return;
    }

    navigate('/courses');
  };

  return (
    <div className='guest-preview-overlay'>
      <button
        type='button'
        className='guest-preview-close-btn'
        title='Đóng'
        aria-label='Đóng'
        onClick={handleClose}
      >
        &times;
      </button>

      <div className='guest-preview-modal'>
        <div className='guest-preview-video-container'>
          <img
            src='https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
            alt='Video Thumb'
            className='guest-preview-video-placeholder'
          />
          <div className='guest-preview-play-icon'>▶</div>
        </div>

        <div className='guest-preview-body'>
          {isLoading && <p className='guest-preview-notice'>Đang tải dữ liệu xem thử...</p>}
          {!isLoading && errorMessage && <p className='guest-preview-notice'>{errorMessage}</p>}

          {!isLoading && !errorMessage && (
            <>
              <h2 className='guest-preview-title'>
                {selectedLesson?.title || 'Bài học xem thử'}
              </h2>

              <p className='guest-preview-notice'>
                {selectedLesson?.content || 'Bạn đang xem thử nội dung miễn phí của khóa học.'}{' '}
                <strong>Đăng ký tài khoản</strong> để mở khóa toàn bộ bài giảng và tài liệu đi kèm.
              </p>
            </>
          )}

          <Link to='/register' className='guest-preview-btn-register'>
            🚀 Đăng ký tài khoản ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ManHinhxemThubaiGiang;
