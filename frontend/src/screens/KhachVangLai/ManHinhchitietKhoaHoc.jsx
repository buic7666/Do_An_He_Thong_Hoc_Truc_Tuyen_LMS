import './ManHinhchitietKhoaHoc.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCourseDetailApi } from '../../api/courseApi';

const includes = [
  '25 giờ video bài giảng chất lượng HD',
  '15 bài tập thực hành thực tế',
  'Tài liệu PDF và mã nguồn đi kèm',
  'Truy cập trọn đời trên web và di động',
  'Chứng chỉ hoàn thành khóa học',
];

function ManHinhchitietKhoaHoc() {
  const { id } = useParams();
  const [courseDetail, setCourseDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchCourseDetailApi(id);
        setCourseDetail(data);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không tải được dữ liệu khóa học.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const lessons = useMemo(() => {
    const source = Array.isArray(courseDetail?.lessons) ? [...courseDetail.lessons] : [];

    source.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));

    return source.map((lesson, index) => ({
      id: lesson.id,
      name: `${index + 1}. ${lesson.title}`,
      preview: index < 2,
      locked: index >= 2,
    }));
  }, [courseDetail]);

  const currentPrice = Number(courseDetail?.price || 0);
  const originalPrice = Math.round(currentPrice * 1.25);

  if (isLoading) {
    return <div className='guest-course-detail-page guest-course-message'>Đang tải khóa học...</div>;
  }

  if (errorMessage) {
    return <div className='guest-course-detail-page guest-course-message'>{errorMessage}</div>;
  }

  if (!courseDetail) {
    return <div className='guest-course-detail-page guest-course-message'>Không có dữ liệu khóa học.</div>;
  }

  return (
    <div className='guest-course-detail-page'>
      <section className='guest-course-banner'>
        <div className='guest-banner-content'>
          <div className='guest-course-info-top'>
            <p className='guest-breadcrumb'>Phát triển phần mềm &gt; Mobile App</p>
            <h1 className='guest-course-title'>{courseDetail.title}</h1>
            <p className='guest-course-intro'>{courseDetail.description || 'Mô tả đang được cập nhật.'}</p>

            <div className='guest-course-stats'>
              <span className='guest-rating-stars'>{courseDetail.stats?.totalLessons || 0} bài học</span>
              <span className='guest-student-count'>{courseDetail.stats?.totalStudents || 0} học viên đã tham gia</span>
            </div>

            <p className='guest-instructor'>
              Giảng viên: <span>{courseDetail.instructor?.name || 'Đang cập nhật'}</span>
            </p>
          </div>
        </div>
      </section>

      <div className='guest-main-container'>
        <main className='guest-content-left'>
          <section>
            <h2 className='guest-section-title'>Mô tả khóa học</h2>
            <div className='guest-description-box'>
              <p>
                Khóa học này được thiết kế dành cho những bạn muốn bắt đầu hành trình lập trình di động
                đa nền tảng. Chúng ta sẽ cùng nhau đi từ những khái niệm cơ bản nhất của ngôn ngữ Dart
                đến việc xây dựng hoàn chỉnh dự án HousePal - một ứng dụng quản lý không gian sống dùng
                chung.
              </p>
            </div>
          </section>

          <section>
            <h2 className='guest-section-title'>Chương trình học</h2>
            <div className='guest-curriculum-box'>
              <div className='guest-curriculum-header'>
                Phần 1: Nội dung mở đầu ({Math.min(lessons.length, 4)} bài học)
              </div>

              {lessons.slice(0, 4).map((lesson) => (
                <div key={lesson.id} className='guest-lesson-item'>
                  <div className='guest-lesson-name'>▶ {lesson.name}</div>
                  {lesson.preview && (
                    <Link to={`/guest/course/${id}/preview?lessonId=${lesson.id}`} className='guest-preview-tag'>
                      👁 Xem thử
                    </Link>
                  )}
                  {lesson.locked && <div className='guest-lock-icon'>🔒</div>}
                </div>
              ))}

              <div className='guest-curriculum-header guest-curriculum-header-secondary'>
                Phần 2: Nội dung nâng cao ({Math.max(lessons.length - 4, 0)} bài học)
              </div>

              {lessons.slice(4).map((lesson) => (
                <div key={lesson.id} className='guest-lesson-item'>
                  <div className='guest-lesson-name'>▶ {lesson.name}</div>
                  <div className='guest-lock-icon'>🔒</div>
                </div>
              ))}

              {lessons.length === 0 && (
                <div className='guest-lesson-item'>
                  <div className='guest-lesson-name'>Nội dung bài học đang cập nhật.</div>
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className='guest-sidebar-right'>
          <div className='guest-sticky-card'>
            <div className='guest-card-video-thumb'>
              <span>▶</span>
            </div>

            <div className='guest-card-body'>
              <div className='guest-price-box'>
                <span className='guest-current-price'>{currentPrice.toLocaleString('vi-VN')}đ</span>
                <span className='guest-original-price'>{originalPrice.toLocaleString('vi-VN')}đ</span>
              </div>

              <Link to={`/login?redirect=${encodeURIComponent(`/enroll/${id}`)}`} className='guest-btn-register'>
                Đăng ký ngay
              </Link>

              <h3 className='guest-includes-title'>Khóa học này bao gồm:</h3>
              <ul className='guest-includes-list'>
                {includes.map((item) => (
                  <li key={item} className='guest-includes-item'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ManHinhchitietKhoaHoc;
