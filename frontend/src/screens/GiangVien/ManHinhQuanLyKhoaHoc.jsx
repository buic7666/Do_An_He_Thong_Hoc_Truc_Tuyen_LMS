import { useEffect, useMemo, useState } from 'react';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import {
  bulkCreateLessonSegmentsApi,
  createCourseApi,
  createCourseChapterApi,
  createLessonApi,
  createLessonSegmentApi,
  deleteLessonSegmentApi,
  deleteLessonApi,
  getCourseChaptersApi,
  fetchCourseLessonsApi,
  fetchLessonSegmentsApi,
  updateCourseChapterApi,
  updateLessonApi,
  updateLessonSegmentApi,
  deleteChapterApi,
  deleteCourseApi,
} from '../../api/teacherManagementApi';

import './ManHinhQuanLyKhoaHoc.css';

const emptyCourseDraft = {
  title: '',
  description: '',
  price: '',
};

const emptyLessonDraft = {
  title: '',
  content: '',
  chapterId: '',
  orderIndex: '',
};

const emptySegmentDraft = {
  startTime: '',
  endTime: '',
  title: '',
};

const normalizeYouTubeVideoId = (candidate) => {
  if (!candidate) return null;

  const trimmed = String(candidate).trim();
  const id = trimmed.split(/[?&#/]/)[0];
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
};

const getYouTubeVideoId = (rawUrl) => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      return normalizeYouTubeVideoId(url.pathname.slice(1));
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return normalizeYouTubeVideoId(url.searchParams.get('v'));
      }

      if (url.pathname.startsWith('/embed/')) {
        return normalizeYouTubeVideoId(url.pathname.split('/embed/')[1]);
      }

      if (url.pathname.startsWith('/shorts/')) {
        return normalizeYouTubeVideoId(url.pathname.split('/shorts/')[1]);
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const parseVideoTimestamp = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return null;

  const normalized = String(rawValue).trim();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const parts = normalized.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
};

const formatVideoTimestamp = (seconds) => {
  const total = Math.max(0, Number(seconds || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const buildSegmentsFromMarkerInput = (rawValue) => {
  const markers = rawValue
    .split(/[\n,;]+/)
    .map((part) => parseVideoTimestamp(part))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  const uniqueMarkers = [...new Set(markers)];

  if (uniqueMarkers.length < 2) {
    throw new Error('Nhập ít nhất 2 mốc thời gian để tách nhanh.');
  }

  return uniqueMarkers.slice(0, -1).map((startTime, index) => {
    const endTime = uniqueMarkers[index + 1];

    if (endTime <= startTime) {
      throw new Error('Các mốc phải tăng dần và không được trùng nhau.');
    }

    return {
      startTime,
      endTime,
      title: `Phần ${index + 1} (${formatVideoTimestamp(startTime)} - ${formatVideoTimestamp(endTime)})`,
    };
  });
};

function ManHinhQuanLyKhoaHoc() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [courseDraft, setCourseDraft] = useState(emptyCourseDraft);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [lessonDraft, setLessonDraft] = useState(emptyLessonDraft);
  const [editingLesson, setEditingLesson] = useState(null);
  const [segmentDraft, setSegmentDraft] = useState(emptySegmentDraft);
  const [editingSegment, setEditingSegment] = useState(null);
  const [quickSplitMarkers, setQuickSplitMarkers] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [segments, setSegments] = useState([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [previewStartSeconds, setPreviewStartSeconds] = useState(0);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [editingChapter, setEditingChapter] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from sessionStorage
  useEffect(() => {
    try {
      const userJson = sessionStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
      }
    } catch (_error) {
      // Ignore
    }
  }, []);

  const isCurrentUserOwner = (course) => {
    if (!currentUser || !course) return false;
    return Number(course.instructor?.id) === Number(currentUser.id);
  };

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
      setSelectedChapterId(null);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Không thể tải chương học.');
      setChapters([]);
      setSelectedChapterId(null);
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

  const myCoursesOnly = useMemo(() => {
    if (!currentUser) return courses; // Fallback to all courses while loading
    return courses.filter((course) => Number(course.instructor?.id) === Number(currentUser.id));
  }, [courses, currentUser]);

  const totalCourses = useMemo(() => myCoursesOnly.length, [myCoursesOnly]);
  const totalChapters = useMemo(() => chapters.length, [chapters]);
  
  const filteredLessons = useMemo(() => {
    if (!selectedChapterId) {
      return lessons;
    }
    return lessons.filter((lesson) => Number(lesson.chapterId) === Number(selectedChapterId));
  }, [lessons, selectedChapterId]);
  
  const totalLessons = useMemo(() => filteredLessons.length, [filteredLessons]);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => Number(lesson.id) === Number(selectedLessonId)) || null,
    [lessons, selectedLessonId],
  );

  const selectedLessonVideoId = useMemo(() => getYouTubeVideoId(selectedLesson?.videoUrl), [selectedLesson?.videoUrl]);

  const selectedLessonEmbedUrl = useMemo(() => {
    if (!selectedLessonVideoId) {
      return '';
    }

    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      autoplay: '1',
    });

    if (previewStartSeconds > 0) {
      params.set('start', String(Math.max(1, Math.floor(previewStartSeconds))));
    }

    params.set('nonce', String(previewNonce));

    return `https://www.youtube.com/embed/${selectedLessonVideoId}?${params.toString()}`;
  }, [previewNonce, previewStartSeconds, selectedLessonVideoId]);

  const getChapterTitle = (chapterId) => {
    const chapter = chapters.find((item) => item.id === chapterId);
    return chapter?.title || `Chương #${chapterId}`;
  };

  const handleSelectCourse = async (courseId) => {
    setSelectedCourseId(courseId);
    await loadChapters(courseId);
    await loadLessons(courseId);
  };

  const handleSelectChapter = (chapterId) => {
    setSelectedChapterId(chapterId);
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

    try {
      await createLessonApi(selectedCourseId, {
        title,
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

  const handleStartEditLesson = (lesson) => {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title || '',
      content: lesson.content || '',
      chapterId: lesson.chapterId ? String(lesson.chapterId) : '',
      orderIndex: lesson.orderIndex || lessons.length + 1,
    });
  };

  const handleSaveLesson = async () => {
    if (!editingLesson) return;

    const title = editingLesson.title.trim();

    if (!title) {
      // eslint-disable-next-line no-alert
      alert('Tên bài học không được để trống.');
      return;
    }

    try {
      await updateLessonApi(editingLesson.id, {
        title,
        content: editingLesson.content,
        chapterId: editingLesson.chapterId ? Number(editingLesson.chapterId) : null,
        orderIndex: Number(editingLesson.orderIndex || 1),
      });
      setEditingLesson(null);
      await loadLessons(selectedCourseId);
      // eslint-disable-next-line no-alert
      alert('Đã cập nhật bài học.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể cập nhật bài học.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await deleteLessonApi(lessonId);
      if (Number(selectedLessonId) === Number(lessonId)) {
        setSelectedLessonId(null);
        setSegments([]);
        setPreviewStartSeconds(0);
      }
      await loadLessons(selectedCourseId);
      // eslint-disable-next-line no-alert
      alert('Đã xóa bài học.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể xóa bài học.');
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương này? Các bài học trong chương sẽ không bị xóa nhưng sẽ mất liên kết.')) {
      return;
    }

    try {
      await deleteChapterApi(chapterId);
      if (Number(selectedChapterId) === Number(chapterId)) {
        setSelectedChapterId(null);
      }
      await loadChapters(selectedCourseId);
      // eslint-disable-next-line no-alert
      alert('Đã xóa chương.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể xóa chương.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await deleteCourseApi(courseId);
      if (Number(selectedCourseId) === Number(courseId)) {
        setSelectedCourseId(null);
        setChapters([]);
        setLessons([]);
        setSelectedLessonId(null);
        setSegments([]);
      }
      await loadCourses();
      // eslint-disable-next-line no-alert
      alert('Đã xóa khóa học.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể xóa khóa học.');
    }
  };

  const handleSelectLesson = async (lessonId) => {
    const parsedLessonId = lessonId ? Number(lessonId) : null;
    setSelectedLessonId(parsedLessonId);
    setEditingSegment(null);
    setQuickSplitMarkers('');
    setPreviewStartSeconds(0);
    setPreviewNonce((prev) => prev + 1);
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

  const handleStartEditSegment = (segment) => {
    setEditingSegment({
      id: segment.id,
      startTime: String(segment.startTime ?? ''),
      endTime: String(segment.endTime ?? ''),
      title: segment.title || '',
    });
  };

  const handleCancelEditSegment = () => {
    setEditingSegment(null);
  };

  const handleSaveSegment = async () => {
    if (!editingSegment) return;

    const startTime = Number(editingSegment.startTime);
    const endTime = Number(editingSegment.endTime);

    if (!Number.isInteger(startTime) || !Number.isInteger(endTime)) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập thời gian hợp lệ cho đoạn video.');
      return;
    }

    if (endTime <= startTime) {
      // eslint-disable-next-line no-alert
      alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    try {
      await updateLessonSegmentApi(editingSegment.id, {
        startTime,
        endTime,
        title: editingSegment.title.trim(),
      });
      setEditingSegment(null);
      await loadSegments(selectedLessonId);
      // eslint-disable-next-line no-alert
      alert('Đã cập nhật đoạn video.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể cập nhật đoạn video.');
    }
  };

  const handleBulkSplitSegments = async () => {
    if (!selectedLessonId) {
      // eslint-disable-next-line no-alert
      alert('Hãy chọn bài học trước.');
      return;
    }

    try {
      const segmentsToCreate = buildSegmentsFromMarkerInput(quickSplitMarkers);
      await bulkCreateLessonSegmentsApi(selectedLessonId, { segments: segmentsToCreate });
      setQuickSplitMarkers('');
      await loadSegments(selectedLessonId);
      // eslint-disable-next-line no-alert
      alert('Đã tách nhanh nhiều đoạn video.');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.message || error?.response?.data?.message || 'Không thể tách nhanh đoạn video.');
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    try {
      await deleteLessonSegmentApi(segmentId);
      if (editingSegment?.id === segmentId) {
        setEditingSegment(null);
      }
      await loadSegments(selectedLessonId);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Không thể xóa đoạn video.');
    }
  };

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

            {myCoursesOnly.length > 0 && (
              <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
                <h3 style={{ marginBottom: '8px' }}>Danh sách khóa học ({myCoursesOnly.length})</h3>
                {myCoursesOnly.map((course) => (
                  <article key={course.id} className="instructor-course-builder-section-block" style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700 }}>{course.title}</div>
                    <div style={{ marginTop: '4px', color: '#666', fontSize: '13px' }}>
                      {course.description || 'Không có mô tả'}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <button
                        className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                        onClick={() => handleSelectCourse(course.id)}
                        type="button"
                        style={{ backgroundColor: selectedCourseId === course.id ? '#3b82f6' : undefined, color: selectedCourseId === course.id ? 'white' : undefined }}
                      >
                        Chọn
                      </button>
                      <button
                        className="instructor-course-builder-btn instructor-course-builder-btn-danger tiny"
                        onClick={() => handleDeleteCourse(course.id)}
                        type="button"
                        style={{ backgroundColor: '#ef4444' }}
                      >
                        Xóa
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
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
                {myCoursesOnly.map((course) => (
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
                    <div style={{ padding: '16px', backgroundColor: selectedChapterId === chapter.id ? '#f0f4ff' : 'transparent', borderLeft: selectedChapterId === chapter.id ? '4px solid #3b82f6' : 'none', paddingLeft: selectedChapterId === chapter.id ? '12px' : '16px' }}>
                      <div style={{ fontWeight: 700 }}>{chapter.title}</div>
                      <div style={{ marginTop: '6px', color: '#666' }}>{chapter.description || 'Không có mô tả'}</div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny" onClick={() => handleSelectChapter(chapter.id)} type="button">
                          Chọn chương
                        </button>
                        <button className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny" onClick={() => handleStartEditChapter(chapter)} type="button">
                          Sửa
                        </button>
                        <button className="instructor-course-builder-btn instructor-course-builder-btn-danger tiny" onClick={() => handleDeleteChapter(chapter.id)} type="button" style={{ backgroundColor: '#ef4444' }}>
                          Xóa
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
              <h3 style={{ marginBottom: '12px' }}>Danh sách bài học{selectedChapterId ? ` (Chương: ${getChapterTitle(selectedChapterId)})` : ' (Tất cả)'}</h3>
              {isLoadingLessons ? <p>Đang tải bài học...</p> : null}
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredLessons.map((lesson) => (
                  <article key={lesson.id} className="instructor-course-builder-section-block">
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                      <div style={{ marginTop: '6px', color: '#666' }}>
                        Chương: {lesson.chapterId ? getChapterTitle(lesson.chapterId) : 'Chưa gắn chương'}
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <button
                          className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny"
                          onClick={() => handleStartEditLesson(lesson)}
                          type="button"
                          style={{ marginRight: '8px' }}
                        >
                          Sửa
                        </button>
                        <button
                          className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                          onClick={() => handleSelectLesson(lesson.id)}
                          type="button"
                          style={{ marginRight: '8px' }}
                        >
                          Quản lý đoạn video
                        </button>
                        <button
                          className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          type="button"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!filteredLessons.length && !isLoadingLessons ? <p>Chưa có bài học nào{selectedChapterId ? ` cho chương đã chọn` : ` cho khóa học đã chọn`}.</p> : null}
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

                <div style={{ marginTop: '18px', padding: '14px', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                  <h4 style={{ marginBottom: '8px' }}>Tách nhanh theo nhiều mốc</h4>
                  <p style={{ marginBottom: '10px', color: '#64748b' }}>
                    Nhập các mốc theo giây hoặc mm:ss, ngăn cách bằng dấu phẩy hoặc xuống dòng. Hệ thống sẽ tự tạo các đoạn liên tiếp.
                  </p>
                  <textarea
                    className="instructor-course-builder-form-control"
                    style={{ minHeight: '120px' }}
                    value={quickSplitMarkers}
                    onChange={(event) => setQuickSplitMarkers(event.target.value)}
                    placeholder="00:00, 03:15, 07:40, 12:00"
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny"
                      onClick={handleBulkSplitSegments}
                      type="button"
                    >
                      Tách nhanh nhiều đoạn
                    </button>
                    <button
                      className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                      onClick={() => setQuickSplitMarkers('')}
                      type="button"
                    >
                      Xóa mốc
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '12px' }}>Các đoạn đã tách</h4>
                {isLoadingSegments ? <p>Đang tải đoạn video...</p> : null}
                <div style={{ display: 'grid', gap: '12px' }}>
                  {segments.map((segment) => (
                    <article key={segment.id} className="instructor-course-builder-section-block">
                      {editingSegment?.id === segment.id ? (
                        <div style={{ padding: '14px 16px', display: 'grid', gap: '10px' }}>
                          <input
                            className="instructor-course-builder-form-control"
                            type="number"
                            value={editingSegment.startTime}
                            onChange={(event) => setEditingSegment((previous) => ({ ...previous, startTime: event.target.value }))}
                            placeholder="0"
                          />
                          <input
                            className="instructor-course-builder-form-control"
                            type="number"
                            value={editingSegment.endTime}
                            onChange={(event) => setEditingSegment((previous) => ({ ...previous, endTime: event.target.value }))}
                            placeholder="300"
                          />
                          <input
                            className="instructor-course-builder-form-control"
                            value={editingSegment.title}
                            onChange={(event) => setEditingSegment((previous) => ({ ...previous, title: event.target.value }))}
                            placeholder="Tiêu đề đoạn"
                          />
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny"
                              onClick={handleSaveSegment}
                              type="button"
                            >
                              Lưu
                            </button>
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                              onClick={handleCancelEditSegment}
                              type="button"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{segment.title || `Đoạn ${segment.id}`}</div>
                            <div style={{ marginTop: '6px', color: '#666' }}>
                              {formatTime(segment.startTime)} - {formatTime(segment.endTime)} ({formatTime(segment.duration)})
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny"
                              onClick={() => handleStartEditSegment(segment)}
                              type="button"
                            >
                              Sửa
                            </button>
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                              onClick={() => {
                                setPreviewStartSeconds(Number(segment.startTime || 0));
                                setPreviewNonce((prev) => prev + 1);
                              }}
                              type="button"
                            >
                              Xem từ đoạn này
                            </button>
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                              onClick={() => handleDeleteSegment(segment.id)}
                              type="button"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                  {!segments.length && !isLoadingSegments ? <p>Chưa có đoạn video nào.</p> : null}
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="instructor-course-builder-card" style={{ marginTop: '24px' }}>
          <h2 className="instructor-course-builder-card-title">Sửa / xóa bài học</h2>

          {editingLesson ? (
            <div className="instructor-course-builder-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div className="instructor-course-builder-form-group">
                  <label className="instructor-course-builder-form-label" htmlFor="edit-lesson-title">Tên bài học</label>
                  <input
                    className="instructor-course-builder-form-control"
                    id="edit-lesson-title"
                    value={editingLesson.title}
                    onChange={(event) => setEditingLesson((previous) => ({ ...previous, title: event.target.value }))}
                  />
                </div>

                <div className="instructor-course-builder-form-group">
                  <label className="instructor-course-builder-form-label" htmlFor="edit-lesson-content">Mô tả</label>
                  <textarea
                    className="instructor-course-builder-form-control"
                    id="edit-lesson-content"
                    value={editingLesson.content}
                    onChange={(event) => setEditingLesson((previous) => ({ ...previous, content: event.target.value }))}
                  />
                </div>

                <div className="instructor-course-builder-form-group">
                  <label className="instructor-course-builder-form-label" htmlFor="edit-lesson-chapter">Chương</label>
                  <select
                    className="instructor-course-builder-form-control"
                    id="edit-lesson-chapter"
                    value={editingLesson.chapterId}
                    onChange={(event) => setEditingLesson((previous) => ({ ...previous, chapterId: event.target.value }))}
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
                  <label className="instructor-course-builder-form-label" htmlFor="edit-lesson-order">Thứ tự</label>
                  <input
                    className="instructor-course-builder-form-control"
                    id="edit-lesson-order"
                    type="number"
                    value={editingLesson.orderIndex}
                    onChange={(event) => setEditingLesson((previous) => ({ ...previous, orderIndex: event.target.value }))}
                  />
                </div>

                <div className="instructor-course-builder-header-actions" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                  <button className="instructor-course-builder-btn instructor-course-builder-btn-primary" type="button" onClick={handleSaveLesson}>
                    Lưu bài học
                  </button>
                  <button className="instructor-course-builder-btn instructor-course-builder-btn-draft" type="button" onClick={() => setEditingLesson(null)}>
                    Hủy
                  </button>
                  <button className="instructor-course-builder-btn instructor-course-builder-btn-draft" type="button" onClick={() => handleDeleteLesson(editingLesson.id)}>
                    Xóa bài học
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p>Chọn một bài học bên trên và bấm Sửa để cập nhật hoặc Xóa bài học.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default ManHinhQuanLyKhoaHoc;
