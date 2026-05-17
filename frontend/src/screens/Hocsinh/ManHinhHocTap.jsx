import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import httpClient from '../../api/httpClient';
import { fetchCourseDetailApi, fetchCourseProgressApi } from '../../api/courseApi';
import { fetchMyEnrollmentsApi } from '../../api/enrollmentApi';
import {
  fetchLessonDetailApi,
  fetchLessonWatchPositionApi,
  markLessonCompletedApi,
  saveLessonWatchPositionApi,
} from '../../api/lessonApi';
import QuizList from '../../components/QuizList';
import QuizTaker from '../../components/QuizTaker';
import './ManHinhHocTap.css';

const SEGMENT_CONTENT_META = {
  text: { icon: '📝', title: 'Text' },
  document: { icon: '📎', title: 'Tài liệu' },
  question: { icon: '❓', title: 'Câu hỏi' },
  quiz: { icon: '🧪', title: 'Bài kiểm tra' },
  videoClip: { icon: '🎬', title: 'Đoạn video' },
};

const isStudentVisibleContentItem = (item) => item && item.type !== 'question';

const getStudentVisibleContentItems = (segment) => (
  Array.isArray(segment?.contentItems)
    ? segment.contentItems.filter(isStudentVisibleContentItem)
    : []
);

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

    const direct = normalizeYouTubeVideoId(rawUrl);
    if (direct) {
      return direct;
    }
  } catch (_error) {
    return null;
  }

  return null;
};

function ManHinhHocTap() {
  const GOOGLE_YOUTUBE_TOKEN_KEY = 'googleYoutubeAccessToken';
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingLessons, setIsRefreshingLessons] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [currentLessonDetail, setCurrentLessonDetail] = useState(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [iframeStartSeconds, setIframeStartSeconds] = useState(0);
  const [iframeResumeNonce, setIframeResumeNonce] = useState(0);
  const [positionSaveMessage, setPositionSaveMessage] = useState('');
  const [courseProgress, setCourseProgress] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedQuizScope, setSelectedQuizScope] = useState(null);
  const [showQuizForChapterId, setShowQuizForChapterId] = useState(null);
  const [lessonSegments, setLessonSegments] = useState([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [selectedContentKey, setSelectedContentKey] = useState(null);
  const [viewedContentItems, setViewedContentItems] = useState({});
  const [isVideoUnlocked, setIsVideoUnlocked] = useState(false);
  const [youtubeAccessToken, setYoutubeAccessToken] = useState(() => sessionStorage.getItem(GOOGLE_YOUTUBE_TOKEN_KEY) || '');
  const [youtubeSubscribeMessage, setYoutubeSubscribeMessage] = useState('');

  const currentLessonIdRef = useRef(null);
  const lessonBaseSecondsRef = useRef(0);
  const lessonSessionStartAtRef = useRef(null);
  const lastSavedSecondsRef = useRef(0);
  const autoSaveIntervalRef = useRef(null);
  const initialQueryRef = useRef(null);

  if (!initialQueryRef.current) {
    const params = new URLSearchParams(window.location.search);
    initialQueryRef.current = {
      courseId: params.get('courseId'),
      lessonId: params.get('lessonId'),
    };
  }

  const selectedCourseId = initialQueryRef.current?.courseId || null;
  const selectedLessonId = initialQueryRef.current?.lessonId || null;

  const getEstimatedPositionSeconds = useCallback(() => {
    const startedAt = lessonSessionStartAtRef.current;
    const base = Number(lessonBaseSecondsRef.current || 0);

    if (!startedAt) {
      return Math.max(0, Math.floor(base));
    }

    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return Math.max(0, Math.floor(base + elapsed));
  }, []);

  const persistLessonPosition = useCallback(
    async (lessonId, { force = false } = {}) => {
      const parsedLessonId = Number(lessonId || currentLessonIdRef.current);
      if (!parsedLessonId) {
        return;
      }

      const estimatedSeconds = getEstimatedPositionSeconds();
      const delta = Math.abs(estimatedSeconds - Number(lastSavedSecondsRef.current || 0));

      if (!force && delta < 5) {
        return;
      }

      try {
        await saveLessonWatchPositionApi(parsedLessonId, estimatedSeconds);
        lastSavedSecondsRef.current = estimatedSeconds;

        if (force) {
          setPositionSaveMessage(`Đã lưu mốc ${formatDuration(estimatedSeconds)} cho bài hiện tại.`);
        }
      } catch (_error) {
        if (force) {
          setPositionSaveMessage('Không lưu được vị trí xem.');
        }
      }
    },
    [getEstimatedPositionSeconds],
  );

  const syncUrlParams = useCallback((courseId, lessonId) => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    if (courseId) {
      url.searchParams.set('courseId', String(courseId));
    }
    if (lessonId) {
      url.searchParams.set('lessonId', String(lessonId));
    }

    window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
  }, []);

  const currentLesson = useMemo(
    () => lessons.find((lesson) => Number(lesson.id) === Number(currentLessonId)) || null,
    [lessons, currentLessonId],
  );

  const selectedSegment = useMemo(
    () => lessonSegments.find((segment) => Number(segment.id) === Number(selectedSegmentId)) || null,
    [lessonSegments, selectedSegmentId],
  );

  const selectedContent = useMemo(() => {
    if (!selectedContentKey) {
      return null;
    }

    const segment = lessonSegments.find((item) => Number(item.id) === Number(selectedContentKey.segmentId)) || null;
    if (!segment || !Array.isArray(segment.contentItems)) {
      return null;
    }

    const itemIndex = Number(selectedContentKey.itemIndex);
    const item = segment.contentItems[itemIndex];
    if (!item || !isStudentVisibleContentItem(item)) {
      return null;
    }

    return { segment, item, itemIndex };
  }, [lessonSegments, selectedContentKey]);

  const currentVideoId = useMemo(() => getYouTubeVideoId(currentLesson?.videoUrl), [currentLesson?.videoUrl]);

  const getSegmentStartSeconds = useCallback((segment) => {
    if (!segment) {
      return 0;
    }

    const videoClip = Array.isArray(segment.contentItems)
      ? segment.contentItems.find((item) => item?.type === 'videoClip' && Number(item?.startTime) >= 0)
      : null;

    const clipStart = Number(videoClip?.startTime);
    if (Number.isFinite(clipStart) && clipStart >= 0) {
      return Math.floor(clipStart);
    }

    return Math.max(0, Math.floor(Number(segment.startTime || 0)));
  }, []);

  const handleSelectSegment = useCallback((segment) => {
    if (!segment) {
      return;
    }

    const segmentId = Number(segment.id);
    setSelectedSegmentId(segmentId);
    setSelectedContentKey(
      getStudentVisibleContentItems(segment)[0]
        ? { segmentId, itemIndex: segment.contentItems.findIndex((item) => isStudentVisibleContentItem(item)) }
        : null,
    );

    const startAt = getSegmentStartSeconds(segment);
    setIframeStartSeconds(startAt);
    setIframeResumeNonce((prev) => prev + 1);
    setPositionSaveMessage(`Đang học: ${segment.title || `Phần ${segmentId}`}`);
  }, [getSegmentStartSeconds]);

  const handleSelectContentItem = useCallback((segment, itemIndex) => {
    if (!segment || !Array.isArray(segment.contentItems)) {
      return;
    }

    const item = segment.contentItems[itemIndex];
    if (!item || !isStudentVisibleContentItem(item)) {
      return;
    }

    const key = { segmentId: Number(segment.id), itemIndex };
    // Toggle: if same item clicked again, close it
    if (selectedContentKey && selectedContentKey.segmentId === key.segmentId && Number(selectedContentKey.itemIndex) === Number(key.itemIndex)) {
      setSelectedContentKey(null);
      // reset selected segment only if no other selected
      setSelectedSegmentId(Number(segment.id));
    } else {
      setSelectedSegmentId(Number(segment.id));
      setSelectedContentKey(key);
    }

    // Mark này là đã viewed
    const viewedKey = `${segment.id}-${itemIndex}`;
    setViewedContentItems((prev) => ({ ...prev, [viewedKey]: true }));
  }, []);

  // Check xem content item có bị lock không (phải xem item trước đó trước)
  const isContentItemLocked = useCallback((segment, itemIndex) => {
    if (!segment || !Array.isArray(segment.contentItems) || itemIndex <= 0) {
      return false;
    }
    // Item bị lock nếu item trước đó chưa viewed
    const prevKey = `${segment.id}-${itemIndex - 1}`;
    return !viewedContentItems[prevKey];
  }, [viewedContentItems]);

  const selectedContentVideoUrl = useMemo(() => {
    if (!isVideoUnlocked || !selectedContent || selectedContent.item?.type !== 'videoClip' || !currentVideoId) {
      return '';
    }

    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      autoplay: '1',
    });

    const startSeconds = Math.max(0, Math.floor(Number(iframeStartSeconds || 0)));
    if (startSeconds > 0) {
      params.set('start', String(startSeconds));
    }

    return `https://www.youtube.com/embed/${currentVideoId}?${params.toString()}`;
  }, [currentVideoId, iframeStartSeconds, isVideoUnlocked, selectedContent]);

  const renderYoutubeSubscribeGate = useCallback((titleText) => {
    const requiresLogin = !youtubeAccessToken;

    return (
      <div className='study-youtube-gate'>
        <div className='study-youtube-gate-icon'>🔒</div>
        <h4>{titleText || 'Video này cần đăng ký kênh YouTube'}</h4>
        <p>
          {youtubeSubscribeMessage || 'Nếu bạn đã đăng ký kênh của giảng viên thì bấm kiểm tra để xem ngay. Nếu chưa, hãy đăng nhập Google và đăng ký kênh trước khi xem.'}
        </p>
        <div className='study-youtube-gate-actions'>
          <button type='button' className='study-btn-resume' onClick={requiresLogin ? () => loginAndSubscribe() : () => handleAutoSubscribeChannel()}>
            {requiresLogin ? 'Đăng nhập Google để kiểm tra' : 'Kiểm tra / đăng ký kênh'}
          </button>
        </div>
      </div>
    );
  }, [youtubeAccessToken, youtubeSubscribeMessage]);

  const completedLessonIdSet = useMemo(() => {
    const ids = Array.isArray(courseProgress?.completedLessonIds) ? courseProgress.completedLessonIds : [];
    return new Set(ids.map((id) => Number(id)).filter(Boolean));
  }, [courseProgress?.completedLessonIds]);

  const lessonsByChapter = useMemo(() => {
    const chapters = Array.isArray(courseDetail?.chapters) ? [...courseDetail.chapters] : [];
    // Sort chapters by orderIndex when available
    chapters.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
    const lessonMap = new Map();

    // Group lessons by chapter
    lessons.forEach((lesson) => {
      const chapterId = lesson.chapterId || 'no-chapter';
      if (!lessonMap.has(chapterId)) {
        lessonMap.set(chapterId, []);
      }
      lessonMap.get(chapterId).push(lesson);
    });

    // Sort lessons within each chapter by orderIndex
    lessonMap.forEach((lessonArray) => {
      lessonArray.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
    });

    // Build result with chapter groups first (even if a chapter has no lessons)
    const result = [];

    chapters.forEach((chapter) => {
      result.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        lessons: lessonMap.get(chapter.id) || [],
        isChapter: true,
      });
    });

    // Append lessons without chapters at the end, but do not use the "Bài học khác" label — render them as ungrouped list
    if (lessonMap.has('no-chapter')) {
      result.push({
        id: 'no-chapter',
        title: 'Chưa phân chương',
        lessons: lessonMap.get('no-chapter'),
        isChapter: false,
      });
    }

    return result;
  }, [courseDetail?.chapters, lessons]);

  const completedLessons = Number(courseProgress?.completedLessons || 0);
  const totalLessons = Number(courseProgress?.totalLessons || lessons.length || 0);
  const completionPercent = Number(courseProgress?.completionPercent || 0);

  const refreshCourseProgress = useCallback(async (courseId) => {
    if (!courseId) return;

    try {
      const progress = await fetchCourseProgressApi(courseId);
      setCourseProgress(progress);
    } catch (_error) {
      setCourseProgress(null);
    }
  }, []);

  const loadLessonData = useCallback(async (lessonId) => {
    if (!lessonId) {
      setCurrentLessonDetail(null);
      setResumeSeconds(0);
      setIframeStartSeconds(0);
      setLessonSegments([]);
      setViewedContentItems({});
      return;
    }

    const [lessonDetail, watchPosition] = await Promise.all([
      fetchLessonDetailApi(lessonId),
      fetchLessonWatchPositionApi(lessonId),
    ]);

    setCurrentLessonDetail(lessonDetail);
    setSelectedContentKey(null);
    setLessonSegments(
      Array.isArray(lessonDetail?.segments)
        ? [...lessonDetail.segments].sort((left, right) => {
            const leftOrder = Number(left.orderIndex || 0);
            const rightOrder = Number(right.orderIndex || 0);
            if (leftOrder !== rightOrder) {
              return leftOrder - rightOrder;
            }
            return Number(left.startTime || 0) - Number(right.startTime || 0);
          })
        : [],
    );
    const nextSegments = Array.isArray(lessonDetail?.segments)
      ? [...lessonDetail.segments].sort((left, right) => {
          const leftOrder = Number(left.orderIndex || 0);
          const rightOrder = Number(right.orderIndex || 0);
          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }
          return Number(left.startTime || 0) - Number(right.startTime || 0);
        })
      : [];
    setLessonSegments(nextSegments);
    setSelectedSegmentId(nextSegments[0]?.id ? Number(nextSegments[0].id) : null);
    setSelectedContentKey(
      getStudentVisibleContentItems(nextSegments[0])[0]
        ? { segmentId: Number(nextSegments[0].id), itemIndex: nextSegments[0].contentItems.findIndex((item) => isStudentVisibleContentItem(item)) }
        : null,
    );
    const seconds = Number(watchPosition?.positionSeconds || 0);
    setResumeSeconds(seconds);
    setIframeStartSeconds(nextSegments[0] ? getSegmentStartSeconds(nextSegments[0]) : 0);
    lessonBaseSecondsRef.current = seconds;
    lessonSessionStartAtRef.current = Date.now();
    lastSavedSecondsRef.current = seconds;
    currentLessonIdRef.current = Number(lessonId);
    setPositionSaveMessage(seconds > 0 ? `Đã tìm thấy mốc ${formatDuration(seconds)}` : 'Bắt đầu từ đầu bài học.');
  }, [getSegmentStartSeconds]);

  useEffect(() => {
    currentLessonIdRef.current = Number(currentLessonId || 0) || null;
  }, [currentLessonId]);

  useEffect(() => {
    if (!currentLessonId) {
      return undefined;
    }

    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    autoSaveIntervalRef.current = setInterval(() => {
      const estimated = getEstimatedPositionSeconds();
      setResumeSeconds(estimated);
      persistLessonPosition(currentLessonId, { force: false });
    }, 5000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [currentLessonId, getEstimatedPositionSeconds, persistLessonPosition]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const lessonId = Number(currentLessonIdRef.current || 0);
        if (lessonId) {
          persistLessonPosition(lessonId, { force: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const lessonId = Number(currentLessonIdRef.current || 0);
      if (lessonId) {
        persistLessonPosition(lessonId, { force: true });
      }
    };
  }, [persistLessonPosition]);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapStudyWorkspace = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const enrollments = await fetchMyEnrollmentsApi();
        const enrolledList = Array.isArray(enrollments) ? enrollments : [];

        if (enrolledList.length === 0) {
          throw new Error('Bạn chưa đăng ký khóa học nào. Hãy enroll một khóa học trước.');
        }

        const firstEnrollment = enrolledList[0];
        const fallbackCourseId = String(firstEnrollment.courseId);
        const resolvedCourseId = selectedCourseId || fallbackCourseId;

        const course = await fetchCourseDetailApi(resolvedCourseId);
        const sortedLessons = [...(Array.isArray(course.lessons) ? course.lessons : [])].sort(
          (left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0),
        );

        if (sortedLessons.length === 0) {
          throw new Error('Khóa học hiện chưa có bài học nào để xem.');
        }

        const fallbackLessonId = String(sortedLessons[0].id);
        const resolvedLessonId = selectedLessonId || fallbackLessonId;

        if (!isCancelled) {
          setCourseDetail(course);
          setLessons(sortedLessons);
          setCurrentLessonId(Number(resolvedLessonId));
          
          // Expand all chapters by default
          const chapters = Array.isArray(course.chapters) ? course.chapters : [];
          const allExpanded = {};
          chapters.forEach((chapter) => {
            allExpanded[chapter.id] = true;
          });
          setExpandedChapters(allExpanded);
          
          await loadLessonData(Number(resolvedLessonId));
          await refreshCourseProgress(resolvedCourseId);
          syncUrlParams(resolvedCourseId, resolvedLessonId);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error?.response?.data?.message || error?.message || 'Không tải được dữ liệu học tập.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    bootstrapStudyWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [loadLessonData, refreshCourseProgress, selectedCourseId, selectedLessonId, syncUrlParams]);

  const handleSelectLesson = async (lessonId) => {
    if (Number(lessonId) === Number(currentLessonId)) {
      return;
    }

    try {
      setErrorMessage('');
      await persistLessonPosition(currentLessonId, { force: true });

      const parsedLessonId = Number(lessonId);
      setCurrentLessonId(parsedLessonId);
      setSelectedQuizId(null);
      setSelectedQuizScope(null);
      setShowQuizForChapterId(null);
      setSelectedSegmentId(null);
      setSelectedContentKey(null);
      setIsVideoUnlocked(false);
      setYoutubeSubscribeMessage('');
      await loadLessonData(parsedLessonId);
      syncUrlParams(selectedCourseId || courseDetail?.id, parsedLessonId);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Không thể chuyển sang bài học này.';
      setErrorMessage(message);
    }
  };

  const handleRefreshLessons = async () => {
    if (!courseDetail?.id) return;

    setIsRefreshingLessons(true);
    try {
      const updatedCourse = await fetchCourseDetailApi(courseDetail.id);
      const sortedLessons = [...(Array.isArray(updatedCourse.lessons) ? updatedCourse.lessons : [])].sort(
        (left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0),
      );
      
      setCourseDetail(updatedCourse);
      setLessons(sortedLessons);
      setShowQuizForChapterId(null);
      setSelectedSegmentId(null);
      setSelectedContentKey(null);
      
      // Expand all chapters by default
      const chapters = Array.isArray(updatedCourse.chapters) ? updatedCourse.chapters : [];
      const allExpanded = {};
      chapters.forEach((chapter) => {
        allExpanded[chapter.id] = true;
      });
      setExpandedChapters(allExpanded);
      
      setPositionSaveMessage('✅ Đã tải lại danh sách bài học.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Không thể tải lại danh sách bài học.');
    } finally {
      setIsRefreshingLessons(false);
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleResume = () => {
    const startAt = Math.max(0, Math.floor(Number(resumeSeconds || 0)));

    if (startAt > 0) {
      setIframeStartSeconds(startAt);
      setIframeResumeNonce((prev) => prev + 1);
      lessonBaseSecondsRef.current = startAt;
      lessonSessionStartAtRef.current = Date.now();
      setPositionSaveMessage(`Tiếp tục từ mốc ${formatDuration(startAt)}.`);
      return;
    }

    setPositionSaveMessage('Bài học này chưa có mốc lưu trước đó.');
  };

  const handleMarkCompleted = async () => {
    if (!currentLessonId) return;

    try {
      await persistLessonPosition(currentLessonId, { force: true });
      await markLessonCompletedApi(currentLessonId);
      await refreshCourseProgress(selectedCourseId || courseDetail?.id);
      setPositionSaveMessage('Đã đánh dấu hoàn thành bài học hiện tại.');
    } catch (_error) {
      setPositionSaveMessage('Không thể đánh dấu hoàn thành bài học.');
    }
  };

  const handleOpenCurrentVideoOnYoutube = () => {
    if (!currentVideoId) return;

    window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank', 'noopener,noreferrer');
  };

  const subscribeCurrentVideoChannel = useCallback(
    async (token) => {
      if (!currentVideoId) {
        setYoutubeSubscribeMessage('Không tìm thấy video_id hợp lệ để xác định kênh gốc.');
        return;
      }

      setIsSubscribingChannel(true);
      setYoutubeSubscribeMessage('Đang đăng ký kênh gốc của video...');

      try {
        const response = await httpClient.post('/youtube/subscribe', {
          access_token: token,
          video_id: currentVideoId,
        });

        const successMessage = response?.data?.message || 'Đăng ký kênh gốc thành công.';
        setIsVideoUnlocked(true);
        setYoutubeSubscribeMessage(`✅ ${successMessage}`);
      } catch (error) {
        const status = Number(error?.response?.status || 0);
        const message = error?.response?.data?.message || 'Không thể đăng ký kênh gốc từ video này.';

        if (status === 409) {
          setIsVideoUnlocked(true);
          setYoutubeSubscribeMessage('✅ Bạn đã đăng ký kênh gốc của video này từ trước.');
        } else if (status === 401) {
          setIsVideoUnlocked(false);
          setYoutubeSubscribeMessage('⚠️ Token Google hết hạn. Vui lòng đăng nhập lại để đăng ký.');
          setYoutubeAccessToken('');
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(GOOGLE_YOUTUBE_TOKEN_KEY);
          }
        } else {
          setIsVideoUnlocked(false);
          setYoutubeSubscribeMessage(`⚠️ ${message}`);
        }
      } finally {
        setIsSubscribingChannel(false);
      }
    },
    [currentVideoId],
  );

  const verifyCurrentVideoSubscription = useCallback(
    async (token, { silent = false } = {}) => {
      if (!token || !currentVideoId) {
        setIsVideoUnlocked(false);
        return false;
      }

      try {
        const response = await httpClient.post('/youtube/check-subscription', {
          access_token: token,
          video_id: currentVideoId,
        });

        const subscribed = Boolean(response?.data?.isSubscribed);
        setIsVideoUnlocked(subscribed);

        if (!silent) {
          setYoutubeSubscribeMessage(
            subscribed
              ? '✅ Bạn đã đăng ký kênh gốc của video này, có thể xem luôn.'
              : '⚠️ Bạn chưa đăng ký kênh gốc của video này.',
          );
        }

        return subscribed;
      } catch (error) {
        const status = Number(error?.response?.status || 0);
        setIsVideoUnlocked(false);

        if (status === 401) {
          setYoutubeAccessToken('');
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(GOOGLE_YOUTUBE_TOKEN_KEY);
          }
          if (!silent) {
            setYoutubeSubscribeMessage('⚠️ Phiên đăng nhập Google đã hết hạn, vui lòng đăng nhập lại.');
          }
        } else if (!silent) {
          setYoutubeSubscribeMessage(
            error?.response?.data?.message || 'Không kiểm tra được trạng thái đăng ký kênh.',
          );
        }

        return false;
      }
    },
    [currentVideoId],
  );

  const loginAndSubscribe = useGoogleLogin({
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/youtube.force-ssl'].join(' '),
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse?.access_token || '';
      if (!token) {
        setYoutubeSubscribeMessage('Không lấy được access token Google.');
        return;
      }

      setYoutubeAccessToken(token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(GOOGLE_YOUTUBE_TOKEN_KEY, token);
      }
      await subscribeCurrentVideoChannel(token);
    },
    onError: () => {
      setYoutubeSubscribeMessage('Đăng nhập Google thất bại. Vui lòng thử lại.');
    },
  });

  const handleAutoSubscribeChannel = async () => {
    if (youtubeAccessToken) {
      const isSubscribed = await verifyCurrentVideoSubscription(youtubeAccessToken, { silent: true });
      if (isSubscribed) {
        setYoutubeSubscribeMessage('✅ Bạn đã đăng ký trước đó, mở video luôn.');
        return;
      }

      await subscribeCurrentVideoChannel(youtubeAccessToken);
      return;
    }

    loginAndSubscribe();
  };

  useEffect(() => {
    if (!currentVideoId) {
      setIsVideoUnlocked(false);
      return;
    }

    if (!youtubeAccessToken) {
      setIsVideoUnlocked(false);
      return;
    }

    verifyCurrentVideoSubscription(youtubeAccessToken, { silent: true });
  }, [currentVideoId, youtubeAccessToken, verifyCurrentVideoSubscription]);

  const handleSelectQuiz = (quizId, scopeType) => {
    setSelectedQuizId(Number(quizId));
    setSelectedQuizScope(scopeType || null);
  };

  const handleBackFromQuiz = () => {
    setSelectedQuizId(null);
    setSelectedQuizScope(null);
  };

  const handleQuizSubmitted = () => {
    setSelectedQuizId(null);
    setSelectedQuizScope(null);
  };

  const formatSegmentContentText = (item) => {
    const text = String(item?.content || item?.title || '').trim();
    return text || 'Chưa có nội dung mô tả.';
  };

  const renderSegmentContentItem = (segment, item, itemIndex) => {
    if (!isStudentVisibleContentItem(item)) {
      return null;
    }

    const meta = SEGMENT_CONTENT_META[item.type] || SEGMENT_CONTENT_META.text;
    const resourceUrl = String(item?.resourceUrl || '').trim();
    const isSelected = Number(selectedContentKey?.segmentId) === Number(segment.id)
      && Number(selectedContentKey?.itemIndex) === Number(itemIndex);
    const isLocked = isContentItemLocked(segment, itemIndex);

    return (
      <article
        key={`${segment.id}-${itemIndex}`}
        className={`study-segment-content-item is-${item.type || 'text'} ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`}
        role='button'
        tabIndex={isLocked ? -1 : 0}
        onClick={() => !isLocked && handleSelectContentItem(segment, itemIndex)}
        onKeyDown={(event) => {
          if (!isLocked && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            handleSelectContentItem(segment, itemIndex);
          }
        }}
        aria-disabled={isLocked}
      >
        <div className='study-segment-content-item-header'>
          <span className='study-segment-content-badge'>
            <span>{isLocked ? '🔒' : meta.icon}</span>
            <span>{isLocked ? `Khoá (xem phần ${itemIndex} trước)` : meta.title}</span>
          </span>
          <span className='study-segment-content-order'>#{item.orderIndex || itemIndex + 1}</span>
        </div>

        {item.title ? <h4 className='study-segment-content-title'>{item.title}</h4> : null}

        {item.type === 'text' && <p className='study-segment-content-text'>{formatSegmentContentText(item)}</p>}

        {item.type === 'document' && (
          <div className='study-segment-content-body'>
            <p>{formatSegmentContentText(item)}</p>
            {resourceUrl && !isLocked ? (
              <a className='study-segment-content-link' href={resourceUrl} target='_blank' rel='noreferrer'>
                Mở tài liệu
              </a>
            ) : null}
          </div>
        )}

        {item.type === 'question' && (
          <div className='study-segment-content-body'>
            <p>{formatSegmentContentText(item)}</p>
            {resourceUrl && !isLocked ? (
              <a className='study-segment-content-link' href={resourceUrl} target='_blank' rel='noreferrer'>
                Mở câu hỏi
              </a>
            ) : null}
          </div>
        )}

        {item.type === 'quiz' && (
          <div className='study-segment-content-body'>
            <p>{formatSegmentContentText(item)}</p>
            {resourceUrl && !isLocked ? (
              <a className='study-segment-content-link' href={resourceUrl} target='_blank' rel='noreferrer'>
                Làm bài kiểm tra
              </a>
            ) : null}
          </div>
        )}

        {item.type === 'videoClip' && (
          <div className='study-segment-content-body'>
            <p>{formatSegmentContentText(item)}</p>
            <div className='study-segment-content-actions'>
              <span className='study-segment-content-meta'>
                {formatDuration(item.startTime)} - {formatDuration(item.endTime)}
              </span>
              <span className='study-segment-content-link-button'>Xem đoạn này</span>
            </div>

            {/* Inline player: render only when this item is selected */}
            {selectedContentKey && Number(selectedContentKey.segmentId) === Number(segment.id) && Number(selectedContentKey.itemIndex) === Number(itemIndex) ? (
              isVideoUnlocked ? (
                (() => {
                  const videoId = getYouTubeVideoId(currentLesson?.videoUrl);
                  const start = Number(item.startTime || segment.startTime || 0);
                  if (!videoId) {
                    return <p className='study-segment-content-empty'>Không có video hợp lệ cho đoạn này.</p>;
                  }
                  const params = new URLSearchParams({
                    rel: '0',
                    modestbranding: '1',
                    playsinline: '1',
                    enablejsapi: '1',
                    autoplay: '1',
                  });
                  if (Number.isFinite(start) && start > 0) params.set('start', String(Math.max(0, Math.floor(start))));
                  const src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
                  return (
                    <iframe
                      key={`inline-${segment.id}-${itemIndex}-${start}`}
                      className='study-youtube-player study-clip-player inline-clip-player'
                      src={src}
                      title={item.title || segment.title || 'Video clip'}
                      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                      allowFullScreen
                    />
                  );
                })()
              ) : (
                renderYoutubeSubscribeGate('Cần đăng ký kênh để mở video này')
              )
            ) : null}
          </div>
        )}
      </article>
    );
  };

  const renderSelectedSegmentPanel = () => {
    const segmentTabs = Array.isArray(lessonSegments) ? lessonSegments : [];

    if (!selectedSegment && segmentTabs.length === 0) {
      return (
        <div className='study-segment-focus-empty'>
          <h3>Chọn một phần để bắt đầu học</h3>
          <p>Bấm vào từng phần trong danh sách bên phải để xem đúng nội dung của phần đó.</p>
        </div>
      );
    }

    return (
      <div className='study-segment-focus-card'>
        <div className='study-segment-focus-header'>
          <div>
            <div className='study-segment-focus-kicker'>Phần bài học</div>
            <h3>{selectedSegment?.title || 'Chọn một phần bên dưới'}</h3>
          </div>
        </div>

        <div className='study-segment-focus-body'>
          {selectedSegment ? (
            Array.isArray(selectedSegment.contentItems) && selectedSegment.contentItems.length > 0 ? (
              <>
                <div className='study-segment-focus-meta'>
                  <span>{formatDuration(selectedSegment.startTime)} - {formatDuration(selectedSegment.endTime)}</span>
                  <span>{`${getStudentVisibleContentItems(selectedSegment).length} nội dung`}</span>
                </div>

                <div className='study-content-items-tabs'>
                  {selectedSegment.contentItems.map((item, itemIndex) => {
                    if (!isStudentVisibleContentItem(item)) {
                      return null;
                    }

                    const isSelected = Number(selectedContentKey?.segmentId) === Number(selectedSegment.id)
                      && Number(selectedContentKey?.itemIndex) === Number(itemIndex);
                    const meta = SEGMENT_CONTENT_META[item.type] || SEGMENT_CONTENT_META.text;

                    return (
                      <button
                        key={`${selectedSegment.id}-${itemIndex}`}
                        type='button'
                        className={`study-content-item-tab ${isSelected ? 'is-active' : ''}`}
                        onClick={() => handleSelectContentItem(selectedSegment, itemIndex)}
                      >
                        <span className='study-content-item-tab-icon'>{meta.icon}</span>
                        <span className='study-content-item-tab-label'>{item.title || `${meta.title} #${itemIndex + 1}`}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedContent ? (
                  <div className='study-content-item-panel'>
                    {renderSegmentContentItem(selectedSegment, selectedContent.item, selectedContent.itemIndex)}
                  </div>
                ) : (
                  <p className='study-segment-content-empty'>Phần này không có nội dung hiển thị cho học sinh.</p>
                )}
              </>
            ) : (
              <p className='study-segment-content-empty'>Phần này chưa có nội dung hiển thị cho học sinh.</p>
            )
          ) : (
            <p className='study-segment-content-empty'>Chọn một tab phần bài học để hiển thị nội dung ở bên dưới.</p>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className='study-workspace-page study-loading-state'>Đang tải dữ liệu học tập...</div>;
  }

  if (errorMessage) {
    return <div className='study-workspace-page study-loading-state'>{errorMessage}</div>;
  }

  return (
    <div className='study-workspace-page'>
      <header className='study-top-header'>
        <a href='/dashboard' className='study-back-btn'>
          ← Quay lại Dashboard
        </a>
        <div className='study-course-title-header'>{courseDetail?.title || 'Không có khóa học'}</div>
      </header>

      <div className='study-workspace'>
        <section className='study-main-content'>
          <div className='study-resume-alert'>
            <p className='study-resume-text'>
              Bạn đang dừng lại ở <strong>{formatDuration(resumeSeconds)}</strong> của bài học hiện tại.
            </p>
            <button type='button' className='study-btn-resume' onClick={handleResume}>
              ▶ Tiếp tục học
            </button>
          </div>

          {renderSelectedSegmentPanel()}

          <div className='study-course-description-card'>
            <div className='study-course-description-kicker'>Mô tả khóa học</div>
            <h3 className='study-course-description-title'>{courseDetail?.title || 'Khóa học'}</h3>
            <p className='study-course-description-text'>
              {courseDetail?.description || currentLessonDetail?.content || currentLesson?.content || 'Chưa có mô tả khóa học.'}
            </p>
          </div>

          {showQuizForChapterId ? (
            <div className='study-video-wrapper'>
              <div className='study-quiz-section'>
                {selectedQuizId && selectedQuizScope === 'chapter' ? (
                  <QuizTaker 
                    quizId={selectedQuizId} 
                    onBack={() => {
                      setShowQuizForChapterId(null);
                      setSelectedQuizId(null);
                      setSelectedQuizScope(null);
                    }} 
                    onSubmit={() => {
                      setShowQuizForChapterId(null);
                      setSelectedQuizId(null);
                      setSelectedQuizScope(null);
                    }}
                  />
                ) : (
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}>🎓 Bài kiểm tra chương</h3>
                    <QuizList
                      courseId={selectedCourseId || courseDetail?.id}
                      chapterId={showQuizForChapterId}
                      scope='chapter'
                      onSelectQuiz={(quizId) => {
                        setSelectedQuizId(Number(quizId));
                        setSelectedQuizScope('chapter');
                      }}
                      emptyMessage='Chương này chưa có bài kiểm tra tổng hợp.'
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}

        </section>

        <aside className='study-sidebar'>
          <div className='study-sidebar-header'>
            <h3 className='study-sidebar-title'>Nội dung khóa học</h3>
            <button
              type='button'
              onClick={handleRefreshLessons}
              disabled={isRefreshingLessons}
              title='Tải lại danh sách bài học mới'
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: isRefreshingLessons ? '#d1d5db' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRefreshingLessons ? 'not-allowed' : 'pointer',
              }}
            >
              {isRefreshingLessons ? '⏳ Đang tải...' : '🔄 Làm mới'}
            </button>
            <p className='study-progress-text'>
              Đã hoàn thành {completedLessons}/{totalLessons} bài học ({completionPercent}%)
            </p>
          </div>

          <div className='study-course-content'>
            {Array.isArray(courseDetail?.chapters) && courseDetail.chapters.length > 0 ? (
              lessonsByChapter.map((chapterGroup) => {
                if (chapterGroup.isChapter) {
                  return (
                    <article key={chapterGroup.id} className='study-chapter'>
                      <header
                        className='study-chapter-title'
                        onClick={() => toggleChapter(chapterGroup.id)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ fontSize: '14px', transform: expandedChapters[chapterGroup.id] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            ▶
                          </span>
                          {chapterGroup.title}
                        </span>
                        <span>{chapterGroup.lessons.length} bài</span>
                      </header>

                      {expandedChapters[chapterGroup.id] && (
                        <div>
                          {chapterGroup.lessons.map((lesson) => {
                            const isActive = Number(lesson.id) === Number(currentLessonId);
                            const isCompleted = completedLessonIdSet.has(Number(lesson.id));

                            return (
                              <div key={lesson.id}>
                                <button
                                  type='button'
                                  className={`study-lesson-item ${isActive ? 'is-active' : ''}`}
                                  onClick={() => handleSelectLesson(lesson.id)}
                                >
                                  <span className={`study-lesson-icon ${isActive ? 'study-icon-playing' : isCompleted ? 'study-icon-done' : 'study-icon-lock'}`}>
                                    {isActive ? '▶' : isCompleted ? '✔' : '○'}
                                  </span>
                                  <span className={`study-lesson-name ${isCompleted ? 'is-done' : ''}`}>{lesson.title}</span>
                                  <span className='study-lesson-duration'>#{lesson.orderIndex}</span>
                                </button>

                                {isActive && lessonSegments.length > 0 && (
                                  <div className='study-sidebar-segment-tabs'>
                                    {lessonSegments.map((segment) => {
                                      const isSelected = Number(selectedSegmentId) === Number(segment.id);

                                      return (
                                        <button
                                          key={segment.id}
                                          type='button'
                                          className={`study-sidebar-segment-tab ${isSelected ? 'is-active' : ''}`}
                                          onClick={() => {
                                            handleSelectSegment(segment);
                                          }}
                                        >
                                          <span className='study-sidebar-segment-title'>
                                            {segment.title || `Phần ${segment.id}`}
                                          </span>
                                          <span className='study-sidebar-segment-time'>
                                            {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Chapter Quiz Button */}
                          <button
                            type='button'
                            className={`study-lesson-item study-chapter-quiz-item ${Number(showQuizForChapterId) === Number(chapterGroup.id) ? 'is-active' : ''}`}
                            onClick={() => {
                              setCurrentLessonId(null);
                              setShowQuizForChapterId(Number(chapterGroup.id));
                              setSelectedQuizId(null);
                              setSelectedQuizScope(null);
                            }}
                          >
                            <span className='study-lesson-icon'>🎓</span>
                            <span className='study-lesson-name'>Bài kiểm tra chương</span>
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }

                // ungrouped
                return (
                  <article key={chapterGroup.id} className='study-chapter study-ungrouped-lessons'>
                    <header className='study-ungrouped-header'>
                      <span style={{ fontSize: '13px', color: 'var(--study-text-secondary)', fontWeight: 600 }}>{chapterGroup.title}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{chapterGroup.lessons.length} bài</span>
                    </header>

                    <div>
                      {chapterGroup.lessons.map((lesson) => {
                        const isActive = Number(lesson.id) === Number(currentLessonId);
                        const isCompleted = completedLessonIdSet.has(Number(lesson.id));

                        return (
                          <div key={lesson.id}>
                            <button
                              type='button'
                              className={`study-lesson-item ${isActive ? 'is-active' : ''}`}
                              onClick={() => handleSelectLesson(lesson.id)}
                            >
                              <span className={`study-lesson-icon ${isActive ? 'study-icon-playing' : isCompleted ? 'study-icon-done' : 'study-icon-lock'}`}>
                                {isActive ? '▶' : isCompleted ? '✔' : '○'}
                              </span>
                              <span className={`study-lesson-name ${isCompleted ? 'is-done' : ''}`}>{lesson.title}</span>
                              <span className='study-lesson-duration'>#{lesson.orderIndex}</span>
                            </button>

                            {isActive && lessonSegments.length > 0 && (
                              <div className='study-sidebar-segment-tabs'>
                                {lessonSegments.map((segment) => {
                                  const isSelected = Number(selectedSegmentId) === Number(segment.id);

                                  return (
                                    <button
                                      key={segment.id}
                                      type='button'
                                      className={`study-sidebar-segment-tab ${isSelected ? 'is-active' : ''}`}
                                      onClick={() => {
                                        handleSelectSegment(segment);
                                      }}
                                    >
                                      <span className='study-sidebar-segment-title'>
                                        {segment.title || `Phần ${segment.id}`}
                                      </span>
                                      <span className='study-sidebar-segment-time'>
                                        {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            ) : (
              <article className='study-chapter'>
                <header className='study-chapter-title'>
                  <span>Nội dung khóa học</span>
                  <span>{lessons.length} bài</span>
                </header>

                <div>
                  {lessons.map((lesson) => {
                    const isActive = Number(lesson.id) === Number(currentLessonId);
                    const isCompleted = completedLessonIdSet.has(Number(lesson.id));

                    return (
                      <div key={lesson.id}>
                        <button
                          type='button'
                          className={`study-lesson-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleSelectLesson(lesson.id)}
                        >
                          <span className={`study-lesson-icon ${isActive ? 'study-icon-playing' : isCompleted ? 'study-icon-done' : 'study-icon-lock'}`}>
                            {isActive ? '▶' : isCompleted ? '✔' : '○'}
                          </span>
                          <span className={`study-lesson-name ${isCompleted ? 'is-done' : ''}`}>{lesson.title}</span>
                          <span className='study-lesson-duration'>#{lesson.orderIndex}</span>
                        </button>

                        {isActive && lessonSegments.length > 0 && (
                          <div className='study-sidebar-segment-tabs'>
                            {lessonSegments.map((segment) => {
                              const isSelected = Number(selectedSegmentId) === Number(segment.id);

                              return (
                                <button
                                  key={segment.id}
                                  type='button'
                                  className={`study-sidebar-segment-tab ${isSelected ? 'is-active' : ''}`}
                                  onClick={() => {
                                    handleSelectSegment(segment);
                                  }}
                                >
                                  <span className='study-sidebar-segment-title'>
                                    {segment.title || `Phần ${segment.id}`}
                                  </span>
                                  <span className='study-sidebar-segment-time'>
                                    {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ManHinhHocTap;
