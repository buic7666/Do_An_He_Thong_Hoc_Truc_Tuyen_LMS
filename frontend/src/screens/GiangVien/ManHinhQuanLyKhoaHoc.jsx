import { useEffect, useMemo, useState } from 'react';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import {
  createCourseApi,
  createCourseChapterApi,
  createLessonApi,
  createLessonSegmentApi,
  deleteLessonSegmentApi,
  getCourseChaptersApi,
  fetchCourseLessonsApi,
  fetchLessonSegmentsApi,
  updateCourseChapterApi,
} from '../../api/teacherManagementApi';

import './ManHinhQuanLyKhoaHoc.css';

const emptyCourseDraft = {
  title: '',
  description: '',
  price: '',
};

const emptyLessonDraft = {
  title: '',
  videoUrl: '',
  content: '',
  chapterId: '',
  orderIndex: '',
};

const emptySegmentDraft = {
  startTime: '',
  endTime: '',
  title: '',
};

function ManHinhQuanLyKhoaHoc() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [courseDraft, setCourseDraft] = useState(emptyCourseDraft);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [lessonDraft, setLessonDraft] = useState(emptyLessonDraft);
  const [segmentDraft, setSegmentDraft] = useState(emptySegmentDraft);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [segments, setSegments] = useState([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    setStatusMessage('');

    try {
      const response = await httpClient.get('/courses');
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCourses(items);

      if (items.length > 0) {
        const firstCourseId = items[0].id;
        setSelectedCourseId(firstCourseId);
        await loadChapters(firstCourseId);
        await loadLessons(firstCourseId);
      } else {
        setSelectedCourseId(null);
        setChapters([]);
        setLessons([]);
        setSelectedLessonId(null);
        setSegments([]);
      }
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Không thể tải danh sách khóa học.');
      setCourses([]);
      setChapters([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadChapters = async (courseId) => {
    if (!courseId) return;

    setIsLoadingChapters(true);
    try {
      const items = await getCourseChaptersApi(courseId);
      setChapters(Array.isArray(items) ? items : []);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Không thể tải chương học.');
      setChapters([]);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const loadLessons = async (courseId) => {
    if (!courseId) return;

    setIsLoadingLessons(true);
    try {
      const items = await fetchCourseLessonsApi(courseId);
      const normalized = Array.isArray(items) ? items : [];
      setLessons(normalized);

      if (normalized.length > 0) {
        if (!selectedLessonId || !normalized.some((lesson) => lesson.id === selectedLessonId)) {
          setSelectedLessonId(normalized[0].id);
          await loadSegments(normalized[0].id);
        }
      } else {
        setSelectedLessonId(null);
        setSegments([]);
      }
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Không thể tải bài học.');
      setLessons([]);
      setSegments([]);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const loadSegments = async (lessonId) => {
    if (!lessonId) {
      setSegments([]);
      return;
    }

    setIsLoadingSegments(true);
    try {
      const items = await fetchLessonSegmentsApi(lessonId);
      setSegments(Array.isArray(items) ? items : []);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Không thể tải đoạn video.');
      setSegments([]);
    } finally {
      setIsLoadingSegments(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const totalCourses = useMemo(() => courses.length, [courses]);
  const totalChapters = useMemo(() => chapters.length, [chapters]);
  const totalLessons = useMemo(() => lessons.length, [lessons]);

  const getChapterTitle = (chapterId) => {
    const chapter = chapters.find((item) => item.id === chapterId);
    return chapter?.title || `Chương #${chapterId}`;
  };

  const handleSelectCourse = async (courseId) => {
    setSelectedCourseId(courseId);
    await loadChapters(courseId);
    await loadLessons(courseId);
  };

  const handleCreateCourse = async () => {
    const title = courseDraft.title.trim();
    if (!title) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập tên khóa học.');
      return;
    }

    try {
      await createCourseApi({
        title,
        description: courseDraft.description.trim(),
        price: Number(courseDraft.price || 0),
      });
      setCourseDraft(emptyCourseDraft);
      await loadCourses();
      // eslint-disable-next-line no-alert
      alert('Đã tạo khóa học mới.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể tạo khóa học.');
    }
  };

  const handleCreateChapter = async () => {
    if (!selectedCourseId) {
      // eslint-disable-next-line no-alert
      alert('Hãy chọn một khóa học trước.');
      return;
    }

    const title = chapterTitle.trim();
    if (!title) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập tên chương.');
      return;
    }

    try {
      await createCourseChapterApi(selectedCourseId, {
        title,
        description: chapterDescription.trim(),
        orderIndex: chapters.length + 1,
      });
      setChapterTitle('');
      setChapterDescription('');
      await loadChapters(selectedCourseId);
      // eslint-disable-next-line no-alert
      alert('Đã thêm chương mới.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể thêm chương.');
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedCourseId) {
      // eslint-disable-next-line no-alert
      alert('Hãy chọn một khóa học trước.');
      return;
    }

    const title = lessonDraft.title.trim();
    const videoUrl = lessonDraft.videoUrl.trim();
    const chapterId = lessonDraft.chapterId ? Number(lessonDraft.chapterId) : null;
    const orderIndex = Number(lessonDraft.orderIndex || lessons.length + 1);

    if (!title) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập tên bài học.');
      return;
    }

    if (!videoUrl) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập link YouTube cho bài học.');
      return;
    }

    try {
      await createLessonApi(selectedCourseId, {
        title,
        videoUrl,
        content: lessonDraft.content.trim(),
        chapterId: chapterId || undefined,
        orderIndex,
      });
      setLessonDraft(emptyLessonDraft);
      await loadLessons(selectedCourseId);
      // eslint-disable-next-line no-alert
      alert('Đã thêm bài học mới.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể thêm bài học.');
    }
  };

  const handleSelectLesson = async (lessonId) => {
    const parsedLessonId = lessonId ? Number(lessonId) : null;
    setSelectedLessonId(parsedLessonId);
    await loadSegments(parsedLessonId);
  };

  const handleCreateSegment = async () => {
    if (!selectedLessonId) {
      // eslint-disable-next-line no-alert
      alert('Hãy chọn bài học trước.');
      return;
    }

    const startTime = Number(segmentDraft.startTime);
    const endTime = Number(segmentDraft.endTime);

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập thời gian hợp lệ.');
      return;
    }

    if (endTime <= startTime) {
      // eslint-disable-next-line no-alert
      alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    try {
      await createLessonSegmentApi(selectedLessonId, {
        startTime,
        endTime,
        title: segmentDraft.title.trim(),
      });
      setSegmentDraft(emptySegmentDraft);
      await loadSegments(selectedLessonId);
      // eslint-disable-next-line no-alert
      alert('Đã thêm đoạn video.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể thêm đoạn video.');
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    try {
      await deleteLessonSegmentApi(segmentId);
      await loadSegments(selectedLessonId);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể xóa đoạn video.');
    }
  };

  const handleStartEditChapter = (chapter) => {
    setEditingChapter({
      id: chapter.id,
      title: chapter.title || '',
      description: chapter.description || '',
      orderIndex: chapter.orderIndex || 1,
    });
  };

  const handleSaveChapter = async () => {
    if (!editingChapter) return;

    const title = editingChapter.title.trim();
    if (!title) {
      // eslint-disable-next-line no-alert
      alert('Tên chương không được để trống.');
      return;
    }

    try {
      await updateCourseChapterApi(editingChapter.id, {
        title,
        description: editingChapter.description,
        orderIndex: editingChapter.orderIndex,
      });
      setEditingChapter(null);
      await loadChapters(selectedCourseId);
      // eslint-disable-next-line no-alert
      alert('Đã cập nhật chương.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể cập nhật chương.');
    }
  };

  return (
    <div className="instructor-course-builder-page">
      <TeacherSidebar />

      <main className="instructor-course-builder-main-content">
        <header className="instructor-course-builder-header">
          <h1 className="instructor-course-builder-page-title">Quản lý khóa học</h1>
          <div className="instructor-course-builder-header-actions">
            <button className="instructor-course-builder-btn instructor-course-builder-btn-draft" onClick={loadCourses} type="button">
              Tải lại
            </button>
          </div>
        </header>

        {statusMessage ? (
          <section className="instructor-course-builder-card" style={{ color: 'red' }}>
            <p>{statusMessage}</p>
          </section>
        ) : null}

        <section className="instructor-course-builder-card">
          <h2 className="instructor-course-builder-card-title">Thống kê</h2>
          {isLoadingCourses ? <p>Đang tải danh sách khóa học...</p> : null}
          <p>Số khóa học: <b>{totalCourses}</b></p>
          <p>Số chương của khóa đang chọn: <b>{totalChapters}</b></p>
          <p>Số bài học của khóa đang chọn: <b>{totalLessons}</b></p>
        </section>

        <div className="instructor-course-builder-grid">
          <section className="instructor-course-builder-card">
            <h2 className="instructor-course-builder-card-title">Tạo khóa học mới</h2>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="course-title">Tên khóa học</label>
              <input
                className="instructor-course-builder-form-control"
                id="course-title"
                value={courseDraft.title}
                onChange={(event) => setCourseDraft((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="Ví dụ: Lập trình Flutter cơ bản"
              />
            </div>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="course-desc">Mô tả</label>
              <textarea
                className="instructor-course-builder-form-control"
                id="course-desc"
                value={courseDraft.description}
                onChange={(event) => setCourseDraft((previous) => ({ ...previous, description: event.target.value }))}
                placeholder="Mô tả ngắn về khóa học"
              />
            </div>

            <div className="instructor-course-builder-inline-fields">
              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="course-price">Giá bán</label>
                <input
                  className="instructor-course-builder-form-control"
                  id="course-price"
                  type="number"
                  value={courseDraft.price}
                  onChange={(event) => setCourseDraft((previous) => ({ ...previous, price: event.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <button className="instructor-course-builder-btn instructor-course-builder-btn-primary full" onClick={handleCreateCourse} type="button">
              Tạo khóa học
            </button>
          </section>

          <section className="instructor-course-builder-card">
            <h2 className="instructor-course-builder-card-title">Chương trình học</h2>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="course-select">Chọn khóa học</label>
              <select
                className="instructor-course-builder-form-control"
                id="course-select"
                value={selectedCourseId || ''}
                onChange={(event) => handleSelectCourse(Number(event.target.value))}
              >
                <option value="">-- Chọn khóa học --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="chapter-title">Tên chương mới</label>
              <input
                className="instructor-course-builder-form-control"
                id="chapter-title"
                value={chapterTitle}
                onChange={(event) => setChapterTitle(event.target.value)}
                placeholder="Ví dụ: Chương 1 - Nhập môn"
              />
            </div>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="chapter-desc">Mô tả chương</label>
              <textarea
                className="instructor-course-builder-form-control"
                id="chapter-desc"
                value={chapterDescription}
                onChange={(event) => setChapterDescription(event.target.value)}
                placeholder="Mô tả ngắn cho chương"
              />
            </div>

            <button className="instructor-course-builder-btn instructor-course-builder-btn-primary full" onClick={handleCreateChapter} type="button">
              Thêm chương
            </button>

            {isLoadingChapters ? <p style={{ marginTop: '12px' }}>Đang tải chương...</p> : null}

            <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
              {chapters.map((chapter) => (
                <article key={chapter.id} className="instructor-course-builder-section-block">
                  {editingChapter?.id === chapter.id ? (
                    <div style={{ display: 'grid', gap: '10px', padding: '16px' }}>
                      <input
                        className="instructor-course-builder-form-control"
                        value={editingChapter.title}
                        onChange={(event) => setEditingChapter((previous) => ({ ...previous, title: event.target.value }))}
                      />
                      <textarea
                        className="instructor-course-builder-form-control"
                        value={editingChapter.description}
                        onChange={(event) => setEditingChapter((previous) => ({ ...previous, description: event.target.value }))}
                      />
                      <input
                        className="instructor-course-builder-form-control"
                        type="number"
                        value={editingChapter.orderIndex}
                        onChange={(event) => setEditingChapter((previous) => ({ ...previous, orderIndex: Number(event.target.value) }))}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="instructor-course-builder-btn instructor-course-builder-btn-primary" onClick={handleSaveChapter} type="button">
                          Lưu
                        </button>
                        <button className="instructor-course-builder-btn instructor-course-builder-btn-draft" onClick={() => setEditingChapter(null)} type="button">
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700 }}>{chapter.title}</div>
                      <div style={{ marginTop: '6px', color: '#666' }}>{chapter.description || 'Không có mô tả'}</div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny" onClick={() => handleStartEditChapter(chapter)} type="button">
                          Sửa
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}

              {!chapters.length && !isLoadingChapters ? <p>Chưa có chương nào cho khóa học đã chọn.</p> : null}
            </div>
          </section>
        </div>

        <section className="instructor-course-builder-card" style={{ marginTop: '24px' }}>
          <h2 className="instructor-course-builder-card-title">Bài học và video YouTube</h2>

          <div className="instructor-course-builder-grid" style={{ gridTemplateColumns: '1fr 1.1fr', gap: '24px' }}>
            <div>
              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="lesson-chapter">Chọn chương</label>
                <select
                  className="instructor-course-builder-form-control"
                  id="lesson-chapter"
                  value={lessonDraft.chapterId}
                  onChange={(event) => setLessonDraft((previous) => ({ ...previous, chapterId: event.target.value }))}
                >
                  <option value="">-- Chọn chương --</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="lesson-title">Tên bài học</label>
                <input
                  className="instructor-course-builder-form-control"
                  id="lesson-title"
                  value={lessonDraft.title}
                  onChange={(event) => setLessonDraft((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Ví dụ: Bài 1 - Giới thiệu"
                />
              </div>

              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="lesson-video">Link YouTube</label>
                <input
                  className="instructor-course-builder-form-control"
                  id="lesson-video"
                  value={lessonDraft.videoUrl}
                  onChange={(event) => setLessonDraft((previous) => ({ ...previous, videoUrl: event.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="lesson-content">Mô tả nội dung</label>
                <textarea
                  className="instructor-course-builder-form-control"
                  id="lesson-content"
                  value={lessonDraft.content}
                  onChange={(event) => setLessonDraft((previous) => ({ ...previous, content: event.target.value }))}
                  placeholder="Mô tả ngắn cho bài học"
                />
              </div>

              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="lesson-order">Thứ tự bài học</label>
                <input
                  className="instructor-course-builder-form-control"
                  id="lesson-order"
                  type="number"
                  value={lessonDraft.orderIndex}
                  onChange={(event) => setLessonDraft((previous) => ({ ...previous, orderIndex: event.target.value }))}
                  placeholder={String(lessons.length + 1)}
                />
              </div>

              <button className="instructor-course-builder-btn instructor-course-builder-btn-primary full" onClick={handleCreateLesson} type="button">
                Thêm bài học
              </button>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Danh sách bài học</h3>
              {isLoadingLessons ? <p>Đang tải bài học...</p> : null}
              <div style={{ display: 'grid', gap: '12px' }}>
                {lessons.map((lesson) => (
                  <article key={lesson.id} className="instructor-course-builder-section-block">
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                      <div style={{ marginTop: '6px', color: '#666' }}>
                        Chương: {lesson.chapterId ? getChapterTitle(lesson.chapterId) : 'Chưa gắn chương'}
                      </div>
                      <div style={{ marginTop: '6px', color: '#666', wordBreak: 'break-all' }}>
                        YouTube: {lesson.videoUrl || 'Chưa có link'}
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <button
                          className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                          onClick={() => handleSelectLesson(lesson.id)}
                          type="button"
                        >
                          Quản lý đoạn video
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!lessons.length && !isLoadingLessons ? <p>Chưa có bài học nào cho khóa học đã chọn.</p> : null}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '12px' }}>
              Quản lý đoạn video cho bài học {selectedLessonId ? `#${selectedLessonId}` : ''}
            </h3>

            <div className="instructor-course-builder-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div className="instructor-course-builder-form-group">
                  <label className="instructor-course-builder-form-label" htmlFor="segment-start">Thời gian bắt đầu (giây)</label>
                  <input
                    className="instructor-course-builder-form-control"
                    id="segment-start"
                    type="number"
                    value={segmentDraft.startTime}
                    onChange={(event) => setSegmentDraft((previous) => ({ ...previous, startTime: event.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="instructor-course-builder-form-group">
                  <label className="instructor-course-builder-form-label" htmlFor="segment-end">Thời gian kết thúc (giây)</label>
                  <input
                    className="instructor-course-builder-form-control"
                    id="segment-end"
                    type="number"
                    value={segmentDraft.endTime}
                    onChange={(event) => setSegmentDraft((previous) => ({ ...previous, endTime: event.target.value }))}
                    placeholder="300"
                  />
                </div>

                <div className="instructor-course-builder-form-group">
                  <label className="instructor-course-builder-form-label" htmlFor="segment-title">Tiêu đề đoạn</label>
                  <input
                    className="instructor-course-builder-form-control"
                    id="segment-title"
                    value={segmentDraft.title}
                    onChange={(event) => setSegmentDraft((previous) => ({ ...previous, title: event.target.value }))}
                    placeholder="Ví dụ: Phần giới thiệu"
                  />
                </div>

                <button className="instructor-course-builder-btn instructor-course-builder-btn-primary full" onClick={handleCreateSegment} type="button">
                  Thêm đoạn video
                </button>
              </div>

              <div>
                <h4 style={{ marginBottom: '12px' }}>Các đoạn đã tách</h4>
                {isLoadingSegments ? <p>Đang tải đoạn video...</p> : null}
                <div style={{ display: 'grid', gap: '12px' }}>
                  {segments.map((segment) => (
                    <article key={segment.id} className="instructor-course-builder-section-block">
                      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{segment.title || `Đoạn ${segment.id}`}</div>
                          <div style={{ marginTop: '6px', color: '#666' }}>
                            {segment.startTime}s - {segment.endTime}s ({segment.duration}s)
                          </div>
                        </div>
                        <button
                          className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                          onClick={() => handleDeleteSegment(segment.id)}
                          type="button"
                        >
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                  {!segments.length && !isLoadingSegments ? <p>Chưa có đoạn video nào.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ManHinhQuanLyKhoaHoc;
