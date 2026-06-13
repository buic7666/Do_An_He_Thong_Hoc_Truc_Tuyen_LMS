import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import httpClient from '../../api/httpClient';
import { fetchCoursesApi } from '../../api/courseApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import QuizAssignmentStyleForm from '../../components/TeacherQuizManager/QuizAssignmentStyleForm';
import {
  createQuestionApi,
  createQuizApi,
  deleteQuestionApi,
  fetchQuestionsApi,
  fetchTeacherQuizzesApi,
  fetchCourseLessonsApi,
  fetchLessonSegmentsApi,
  getCourseChaptersApi,
  updateQuestionApi,
} from '../../api/teacherManagementApi';
import TeacherSidebar from '../../components/TeacherSidebar';
import QuestionFormModal from '../../components/QuestionFormModal';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText } from '../../components/RichContentEditor';
import RichContentRenderer from '../../components/RichContentRenderer';
import ClozeQuestionForm from '../../components/ClozeQuestionForm';
import QuestionTypeFields from '../../components/QuestionTypeFields';
import SelectQuestionsModal from '../../components/SelectQuestionsModal';

import './ManHinhQuanLyNganHangCauhoi.css';
import QuestionBankTab from '../../components/TeacherQuestionBank/QuestionBankTab';
import QuizManagerTab from '../../components/TeacherQuizManager/QuizManagerTab';
import { bankDetailParseJson, bankDetailNormalizeType, bankDetailNormalizeBlocks, bankDetailBlocksToText, bankDetailNormalizeIndex, bankDetailGetCorrectIndices, bankDetailGetOptions } from '../../components/TeacherQuestionBank/QuestionDetailPanel';


const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CLOZE'];

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CLOZE: 'Câu hỏi bài đọc',
};

const QUIZ_PRESETS = [
  {
    label: 'Mặc định 3-3-3-1',
    value: {
      multipleChoiceCount: '3',
      trueFalseCount: '3',
      shortAnswerCount: '3',
      essayCount: '1',
    },
  },
  {
    label: 'Trắc nghiệm nhiều hơn 5-3-1-1',
    value: {
      multipleChoiceCount: '5',
      trueFalseCount: '3',
      shortAnswerCount: '1',
      essayCount: '1',
    },
  },
  {
    label: 'Ngắn gọn 2-2-2-1',
    value: {
      multipleChoiceCount: '2',
      trueFalseCount: '2',
      shortAnswerCount: '2',
      essayCount: '1',
    },
  },
];

const QUIZ_QUOTA_STORAGE_KEY = 'teacher-quiz-quota-defaults';

const parseJson = (value, fallback = {}) => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }
  return value;
};

const normalizeQuestionPreviewBlocks = (question) => {
  const metadata = parseJson(question?.metadata, {});

  const candidates = [
    metadata?.contentBlocks,
    question?.contentBlocks,
    metadata?.blocks,
    question?.blocks,
    metadata?.richContent?.blocks,
    question?.richContent?.blocks,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }

  return [];
};

const createEmptyDraft = () => ({
  type: 'MULTIPLE_CHOICE',
  metadata: { text_template: '', inner_questions: {} },
  content: '',
  contentBlocks: createEmptyRichBlocks(),
  isPublished: false,
  options: ['', '', '', ''],
  optionsRich: [createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks(), createEmptyRichBlocks()],
  correctIndices: [0],
  allowMultipleCorrect: false,
  explanation: '',
  correctAnswer: true,
  acceptedAnswersText: '',
  caseSensitive: false,
  fuzzyMatch: true,
  instructions: '',
  rubric: [
    { name: 'Nội dung', weight: 40, description: '' },
    { name: 'Lập luận', weight: 30, description: '' },
    { name: 'Ngôn ngữ', weight: 30, description: '' },
  ],
  wordLimitMin: 100,
  wordLimitMax: 400,
  aiModel: 'gpt-3.5-turbo',
  gradingMethod: 'ai',
});

const createEmptyQuizDraft = () => ({
  title: '',
  description: '',
  chapterId: '',
  duration: '45',
  passScore: '70',
  maxAttempts: '0',
  questionIds: [],
  questionTitles: [],
  randomize: false,
  randomCount: 0,
  multipleChoiceCount: '0',
  trueFalseCount: '0',
  shortAnswerCount: '0',
  essayCount: '0',
});

const getTeacherQuizDetailApi = async (quizId) => {
  const response = await httpClient.get(`/quiz-manager/${quizId}`);
  return response?.data?.data || response?.data;
};

const updateTeacherQuizApi = async (quizId, payload) => {
  const response = await httpClient.put(`/quiz-manager/${quizId}`, payload);
  return response?.data?.data || response?.data;
};

const deleteTeacherQuizApi = async (quizId) => {
  const response = await httpClient.delete(`/quiz-manager/${quizId}`);
  return response?.data?.data || response?.data;
};

const addQuestionToQuizApi = async (quizId, questionId, payload = {}) => {
  const response = await httpClient.post(`/quiz-manager/${quizId}/questions/${questionId}`, payload);
  return response?.data?.data || response?.data;
};

const removeQuestionFromQuizApi = async (quizId, questionId) => {
  const response = await httpClient.delete(`/quiz-manager/${quizId}/questions/${questionId}`);
  return response?.data?.data || response?.data;
};
const bankEditFirstNonEmptyArray = (...values) => {
  return values.find((value) => Array.isArray(value) && value.length) || [];
};

const bankEditNormalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'đúng', 'dung'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'sai'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

const bankEditNormalizeRichBlocks = (value) => {
  const blocks = bankDetailNormalizeBlocks(value);
  return Array.isArray(blocks) ? blocks : [];
};

const bankEditFindFirstBlocks = (...values) => {
  for (const value of values) {
    const blocks = bankEditNormalizeRichBlocks(value);

    if (blocks.length) {
      return blocks;
    }
  }

  return [];
};

const bankEditStringValue = (value) => {
  if (value == null) return '';

  if (typeof value === 'object') {
    return String(
      value.text
      || value.content
      || value.value
      || value.label
      || value.title
      || ''
    ).trim();
  }

  return String(value).trim();
};

const buildQuestionDraftForEdit = (question) => {
  const emptyDraft = createEmptyDraft();
  const metadata = bankDetailParseJson(question?.metadata, {});
  const type = bankDetailNormalizeType(question?.type || metadata?.type);

  const textContent = String(
    type === 'CLOZE'
      ? metadata?.text_template || question?.content || question?.questionText || metadata?.questionText || ''
      : question?.content || question?.questionText || metadata?.questionText || metadata?.title || ''
  ).trim();

  const existingContentBlocks = bankEditFindFirstBlocks(
    question?.contentBlocks,
    metadata?.contentBlocks,
    metadata?.blocks,
    metadata?.richContent?.blocks,
    question?.blocks,
    question?.richContent?.blocks
  );

  const contentBlocks = existingContentBlocks.length
    ? existingContentBlocks
    : textContent
      ? [{ type: 'text', text: textContent }]
      : createEmptyRichBlocks();

  const rawOptions = bankEditFirstNonEmptyArray(
    metadata?.options,
    question?.options
  );

  const rawOptionsRich = bankEditFirstNonEmptyArray(
    metadata?.optionsRich,
    question?.optionsRich
  );

  const optionCount = Math.max(
    rawOptions.length,
    rawOptionsRich.length,
    type === 'MULTIPLE_CHOICE' ? 4 : 0
  );

  const optionsRich = Array.from({ length: optionCount }).map((_, index) => {
    const richSource = rawOptionsRich[index];

    const blocks = bankEditFindFirstBlocks(
      richSource?.contentBlocks,
      richSource?.blocks,
      richSource?.richContent?.blocks,
      richSource
    );

    if (blocks.length) {
      return blocks;
    }

    const optionText = bankEditStringValue(rawOptions[index]);

    return optionText
      ? [{ type: 'text', text: optionText }]
      : createEmptyRichBlocks();
  });

  const options = optionsRich.map((blocks, index) => (
    richContentToPlainText(blocks) || bankEditStringValue(rawOptions[index])
  ));

  const correctIndices = bankDetailGetCorrectIndices(question, metadata)
    .filter((index) => index < Math.max(optionCount, 1));

  const acceptedAnswers = bankEditFirstNonEmptyArray(
    metadata?.acceptedAnswers,
    question?.acceptedAnswers,
    metadata?.answers,
    question?.answers
  );

  const wordLimit = metadata?.wordLimit || question?.wordLimit || {};

  const clozeMetadata = {
    ...metadata,
    text_template: String(metadata?.text_template || textContent || '').trim(),
    inner_questions:
      metadata?.inner_questions && typeof metadata.inner_questions === 'object'
        ? metadata.inner_questions
        : {},
  };

  return {
    ...emptyDraft,
    type,
    metadata: type === 'CLOZE' ? clozeMetadata : metadata,

    content: type === 'CLOZE' ? clozeMetadata.text_template : textContent,
    contentBlocks,
    isPublished: bankEditNormalizeBoolean(question?.isPublished, false),

    courseId: question?.courseId ?? metadata?.courseId ?? '',
    chapterId: question?.chapterId ?? metadata?.chapterId ?? '',
    lectureId: question?.lectureId ?? question?.lessonId ?? metadata?.lectureId ?? metadata?.lessonId ?? '',
    lessonId: question?.lessonId ?? question?.lectureId ?? metadata?.lessonId ?? metadata?.lectureId ?? '',
    segmentId: question?.segmentId ?? metadata?.segmentId ?? '',

    options: options.length ? options : emptyDraft.options,
    optionsRich: optionsRich.length ? optionsRich : emptyDraft.optionsRich,
    correctIndices: correctIndices.length ? correctIndices : [0],
    allowMultipleCorrect: bankEditNormalizeBoolean(
      metadata?.allowMultipleCorrect ?? question?.allowMultipleCorrect,
      false
    ),

    explanation: String(metadata?.explanation || question?.explanation || ''),

    correctAnswer: bankEditNormalizeBoolean(
      metadata?.correctAnswer ?? question?.correctAnswer,
      true
    ),

    acceptedAnswersText: acceptedAnswers
      .map((item) => bankEditStringValue(item))
      .filter(Boolean)
      .join('\n'),

    caseSensitive: bankEditNormalizeBoolean(
      metadata?.caseSensitive ?? question?.caseSensitive,
      false
    ),

    fuzzyMatch: bankEditNormalizeBoolean(
      metadata?.fuzzyMatch ?? question?.fuzzyMatch,
      true
    ),

    instructions: String(metadata?.instructions || question?.instructions || ''),

    rubric:
      Array.isArray(metadata?.rubric) && metadata.rubric.length
        ? metadata.rubric
        : Array.isArray(question?.rubric) && question.rubric.length
          ? question.rubric
          : emptyDraft.rubric,

    wordLimitMin: Number(
      wordLimit?.min ?? metadata?.wordLimitMin ?? question?.wordLimitMin ?? 100
    ),

    wordLimitMax: Number(
      wordLimit?.max ?? metadata?.wordLimitMax ?? question?.wordLimitMax ?? 400
    ),

    aiModel: metadata?.aiModel || question?.aiModel || 'gpt-3.5-turbo',
    gradingMethod: metadata?.gradingMethod || question?.gradingMethod || 'ai',
  };
};
function ManHinhQuanLyNganHangCauhoi({ embedded = false, fixedCourseId = '' }) {
  const navigate = useNavigate();
  const { courseId: routeCourseId } = useParams();
  const scopedCourseId = fixedCourseId || routeCourseId;
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'quizzes'
  const [draft, setDraft] = useState(createEmptyDraft());
  const [quizDraft, setQuizDraft] = useState(createEmptyQuizDraft());
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState(null);
  const [isLoadingQuizDetail, setIsLoadingQuizDetail] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizAddQuestionId, setQuizAddQuestionId] = useState('');
  const [selectQuizQuestionsModalOpen, setSelectQuizQuestionsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [error, setError] = useState('');
  const [quizError, setQuizError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const isCourseScopedView = Boolean(scopedCourseId);

  const questionCount = useMemo(() => questions.length, [questions]);
  const publishedCount = useMemo(() => questions.filter((item) => Boolean(item.isPublished)).length, [questions]);
  const draftCount = useMemo(() => questions.filter((item) => !item.isPublished).length, [questions]);
  const typeSummary = useMemo(() => {
    const summary = questions.reduce((acc, item) => {
      const key = String(item.type || 'MULTIPLE_CHOICE');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return summary;
  }, [questions]);
  const filteredQuestions = useMemo(() => {
    if (!selectedTypeFilter) return questions;
    return questions.filter(q => {
      const qType = String(q.type || q.questionType || 'MULTIPLE_CHOICE').toUpperCase().replace(/[\s-]+/g, '_');
      const sType = String(selectedTypeFilter).toUpperCase().replace(/[\s-]+/g, '_');
      return qType === sType || (qType === 'MULTICHOICE' && sType === 'MULTIPLE_CHOICE');
    });
  }, [questions, selectedTypeFilter]);

  const quizSelectedQuestionCount = useMemo(() => (
    Array.isArray(quizDraft.questionIds) ? quizDraft.questionIds.length : 0
  ), [quizDraft.questionIds]);

  const quizRandomQuestionCount = useMemo(() => (
    Number(quizDraft.randomize ? quizDraft.randomCount || 0 : 0)
  ), [quizDraft.randomize, quizDraft.randomCount]);

  const quizQuestionTotal = useMemo(() => (
    quizSelectedQuestionCount + quizRandomQuestionCount
  ), [quizSelectedQuestionCount, quizRandomQuestionCount]);
const visibleQuizzes = useMemo(() => {
  const courseFilterId = selectedCourseId || scopedCourseId;

  if (!courseFilterId) {
    return quizzes;
  }

  return quizzes.filter((quiz) => Number(quiz.courseId) === Number(courseFilterId));
}, [quizzes, selectedCourseId, scopedCourseId]);

const selectedQuizQuestionIds = useMemo(() => {
  return new Set(
    (selectedQuizDetail?.questions || [])
      .map((question) => Number(question.id))
      .filter((id) => Number.isFinite(id))
  );
}, [selectedQuizDetail]);

const availableQuestionsForQuiz = useMemo(() => {
  return questions.filter((question) => {
    if (selectedQuizQuestionIds.has(Number(question.id))) {
      return false;
    }

    return Boolean(question.isPublished);
  });
}, [questions, selectedQuizQuestionIds]);
  useEffect(() => {
    try {
      const savedQuota = window.localStorage.getItem(QUIZ_QUOTA_STORAGE_KEY);
      if (!savedQuota) {
        return;
      }

      const parsedQuota = JSON.parse(savedQuota);
      if (!parsedQuota || typeof parsedQuota !== 'object') {
        return;
      }

      setQuizDraft((prev) => ({
        ...prev,
        multipleChoiceCount: String(parsedQuota.multipleChoiceCount ?? prev.multipleChoiceCount),
        trueFalseCount: String(parsedQuota.trueFalseCount ?? prev.trueFalseCount),
        shortAnswerCount: String(parsedQuota.shortAnswerCount ?? prev.shortAnswerCount),
        essayCount: String(parsedQuota.essayCount ?? prev.essayCount),
      }));
    } catch (_error) {
      window.localStorage.removeItem(QUIZ_QUOTA_STORAGE_KEY);
    }
  }, []);

  const loadChapters = async (courseId) => {
    if (!courseId) {
      setChapters([]);
      setSelectedChapterId('');
      setLessons([]);
      setSelectedLessonId('');
      setSegments([]);
      setSelectedSegmentId('');
      return;
    }
    const items = await getCourseChaptersApi(courseId);
    const nextChapters = Array.isArray(items) ? items : [];
    setChapters(nextChapters);
    setSelectedChapterId('');
    setSelectedLessonId('');
    setSegments([]);
    setSelectedSegmentId('');
    return nextChapters;
  };

  const loadLessons = async (courseId, chapterId) => {
    if (!courseId || !chapterId) {
      setLessons([]);
      setSelectedLessonId('');
      setSegments([]);
      setSelectedSegmentId('');
      return;
    }

    const items = await fetchCourseLessonsApi(courseId);
    const nextLessons = Array.isArray(items)
      ? items.filter((lesson) => String(lesson.chapterId) === String(chapterId))
      : [];

    setLessons(nextLessons);
    setSelectedLessonId('');

    return nextLessons;
  };

  const loadSegments = async (lessonId) => {
    if (!lessonId) {
      setSegments([]);
      setSelectedSegmentId('');
      return;
    }

    const items = await fetchLessonSegmentsApi(lessonId);
    const nextSegments = Array.isArray(items) ? items : [];

    setSegments(nextSegments);
    setSelectedSegmentId('');

    return nextSegments;
  };

  const loadCourses = async () => {
    try {
      const items = await fetchCoursesApi();
      const allCourses = Array.isArray(items) ? items : [];
      const currentUser = getCurrentUserSafely();
      let visibleCourses = allCourses;

      if (currentUser?.role === 'teacher') {
        visibleCourses = allCourses.filter((c) => Number(c.instructor?.id ?? c.instructorId ?? -1) === Number(currentUser.id));
      }

      setCourses(visibleCourses);

      if (scopedCourseId) {
        setSelectedCourseId(String(scopedCourseId));
        await loadChapters(scopedCourseId);
        return;
      }

      if (!selectedCourseId && visibleCourses.length > 0) {
        const firstCourseId = visibleCourses[0].id;
        setSelectedCourseId(String(firstCourseId));
        await loadChapters(firstCourseId);
      }
    } catch (_err) {
      setCourses([]);
    }
  };

  const loadQuestions = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!selectedCourseId) {
        setQuestions([]);
        return;
      }

      const items = await fetchQuestionsApi({
        courseId: Number(selectedCourseId),
        chapterId: selectedChapterId ? Number(selectedChapterId) : undefined,
        lectureId: selectedLessonId ? Number(selectedLessonId) : undefined,
        segmentId: selectedSegmentId ? Number(selectedSegmentId) : undefined,
      });
      setQuestions(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải câu hỏi.');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    setQuizError('');
    try {
      const items = await fetchTeacherQuizzesApi();
      setQuizzes(Array.isArray(items) ? items : []);
    } catch (err) {
      setQuizError(err?.response?.data?.message || 'Không thể tải danh sách quiz.');
      setQuizzes([]);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadCourses(), loadQuizzes()]);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedCourseId || !selectedChapterId) {
      setLessons([]);
      setSelectedLessonId('');
      setSegments([]);
      setSelectedSegmentId('');
      return;
    }

    loadLessons(selectedCourseId, selectedChapterId);
  }, [selectedCourseId, selectedChapterId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setSegments([]);
      setSelectedSegmentId('');
      return;
    }

    loadSegments(selectedLessonId);
  }, [selectedLessonId]);

  useEffect(() => {
    loadQuestions();
  }, [selectedCourseId, selectedChapterId, selectedLessonId, selectedSegmentId]);

  const handleOptionChange = (index, value) => {
    setDraft((prev) => {
      const nextOptions = [...prev.options];
      nextOptions[index] = value;
      return { ...prev, options: nextOptions };
    });
  };

  const addOption = () => {
    setDraft((prev) => {
      if (prev.options.length >= 10) {
        return prev;
      }

      return {
        ...prev,
        options: [...prev.options, ''],
        optionsRich: [...prev.optionsRich, createEmptyRichBlocks()],
      };
    });
  };

  const removeOption = (index) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đáp án này?')) return;
    setDraft((prev) => {
      if (prev.options.length <= 2) {
        return prev;
      }

      const nextOptions = prev.options.filter((_, itemIndex) => itemIndex !== index);
      const currentCorrectIndex = prev.correctIndices[0] ?? 0;
      let nextCorrectIndex = currentCorrectIndex;

      if (index === currentCorrectIndex) {
        nextCorrectIndex = 0;
      } else if (index < currentCorrectIndex) {
        nextCorrectIndex = currentCorrectIndex - 1;
      }

      return {
        ...prev,
        options: nextOptions,
        optionsRich: prev.optionsRich.filter((_, itemIndex) => itemIndex !== index),
        correctIndices: [Math.max(0, Math.min(nextCorrectIndex, nextOptions.length - 1))],
      };
    });
  };

  const toggleCorrectIndex = (index) => {
    setDraft((prev) => {
      if (prev.allowMultipleCorrect) {
        const next = new Set(prev.correctIndices || []);
        if (next.has(index)) next.delete(index); else next.add(index);
        const arr = Array.from(next).sort((a, b) => a - b);
        return { ...prev, correctIndices: arr.length ? arr : [0] };
      }
      return { ...prev, correctIndices: [index] };
    });
  };

  const resetDraft = () => {
    setDraft(createEmptyDraft());
    setEditingId(null);
    setIsModalOpen(false);
  };

const resetQuizDraft = () => {
  setQuizDraft(createEmptyQuizDraft());
  setEditingQuizId(null);
};
  const createQuestionPayload = () => {
    const content = richContentToPlainText(draft.contentBlocks) || String(draft.content || '').trim();
    if (!content) {
      throw new Error('Vui lòng nhập nội dung câu hỏi.');
    }

    const payloadCourseId = selectedCourseId || draft.courseId;
    const payloadChapterId = selectedChapterId || draft.chapterId;
    const payloadLessonId = selectedLessonId || draft.lectureId || draft.lessonId;
    const payloadSegmentId = selectedSegmentId || draft.segmentId;

    if (!payloadCourseId) {
      throw new Error('Vui lòng chọn khóa học trước khi tạo câu hỏi.');
    }
    if (!payloadChapterId) {
      throw new Error('Vui lòng chọn chương trước khi tạo câu hỏi.');
    }
    if (!payloadLessonId) {
      throw new Error('Vui lòng chọn bài giảng trước khi tạo câu hỏi.');
    }
    if (!payloadSegmentId) {
      throw new Error('Vui lòng chọn phần bài giảng trước khi tạo câu hỏi.');
    }

    const base = {
      type: draft.type,
      content,
      contentBlocks: draft.contentBlocks,
      courseId: Number(payloadCourseId),
      chapterId: payloadChapterId ? Number(payloadChapterId) : undefined,
      lectureId: payloadLessonId ? Number(payloadLessonId) : undefined,
      segmentId: payloadSegmentId ? Number(payloadSegmentId) : undefined,
      isPublished: draft.isPublished,
    };

    if (draft.type === 'MULTIPLE_CHOICE') {
      const pairs = draft.options
        .map((item, index) => ({ rawIndex: index, value: item.trim() }))
        .filter((item) => item.value);

      const options = pairs.map((item) => item.value);
      let correctIndices = [];
      if (draft.allowMultipleCorrect) {
        correctIndices = pairs
          .map((item, index) => ({ index, isCorrect: (draft.correctIndices || []).includes(item.rawIndex) }))
          .filter((item) => item.isCorrect)
          .map((item) => item.index);
      } else {
        const selectedCorrectIndex = draft.correctIndices[0];
        correctIndices = pairs
          .map((item, index) => ({ index, isCorrect: item.rawIndex === selectedCorrectIndex }))
          .filter((item) => item.isCorrect)
          .map((item) => item.index);
      }

      if (options.length < 2) {
        throw new Error('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án.');
      }
      if (!correctIndices.length) {
        throw new Error('Hãy chọn ít nhất 1 đáp án đúng.');
      }

      return {
        ...base,
        options,
        optionsRich: draft.optionsRich,
        correctIndices,
        explanation: draft.explanation.trim() || undefined,
      };
    }

    if (draft.type === 'TRUE_FALSE') {
      return {
        ...base,
        correctAnswer: draft.correctAnswer,
        explanation: draft.explanation.trim() || undefined,
      };
    }

    if (draft.type === 'SHORT_ANSWER') {
      const acceptedAnswers = draft.acceptedAnswersText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!acceptedAnswers.length) {
        throw new Error('Câu trả lời ngắn cần ít nhất 1 đáp án chấp nhận.');
      }

      return {
        ...base,
        acceptedAnswers,
        caseSensitive: draft.caseSensitive,
        fuzzyMatch: draft.fuzzyMatch,
        explanation: draft.explanation.trim() || undefined,
      };
    }

    if (draft.type === 'CLOZE') {
      const metadata = draft.metadata && typeof draft.metadata === 'object'
        ? draft.metadata
        : { text_template: draft.content, inner_questions: {} };

      const textTemplate = String(metadata.text_template || draft.content || '').trim();

      if (!textTemplate) {
        throw new Error('Câu hỏi bài đọc cần có nội dung đọc hợp lệ.');
      }

      return {
        ...base,
        content: textTemplate,
        metadata: {
          ...metadata,
          text_template: textTemplate,
          inner_questions:
            metadata.inner_questions && typeof metadata.inner_questions === 'object'
              ? metadata.inner_questions
              : {},
        },
      };
    }

    const rubric = draft.rubric
      .map((item) => ({
        name: item.name.trim(),
        weight: Number(item.weight),
        description: item.description.trim(),
      }))
      .filter((item) => item.name && item.description && Number.isFinite(item.weight));

    const totalWeight = rubric.reduce((sum, item) => sum + item.weight, 0);
    if (!rubric.length) {
      throw new Error('Câu tự luận cần ít nhất 1 tiêu chí hợp lệ.');
    }
    if (totalWeight !== 100) {
      throw new Error('Tổng trọng số rubric của ESSAY phải bằng 100.');
    }

   return {
  ...base,
  instructions: draft.instructions.trim(),
  rubric,
  wordLimit: {
    min: Number(draft.wordLimitMin),
    max: Number(draft.wordLimitMax),
  },
  aiModel: draft.aiModel,
  gradingMethod: draft.gradingMethod || 'ai',
};
  };

  const buildNormalQuestionPayloadFromInner = (innerQuestion, parentQuestionId, orderIndex) => {
    const base = {
      type: innerQuestion.type,
      content: String(innerQuestion.content || '').trim() || String(draft.content || '').trim(),
      contentBlocks: Array.isArray(innerQuestion.contentBlocks) ? innerQuestion.contentBlocks : createEmptyRichBlocks(),
      courseId: Number(selectedCourseId),
      chapterId: selectedChapterId ? Number(selectedChapterId) : undefined,
      lectureId: selectedLessonId ? Number(selectedLessonId) : undefined,
      segmentId: selectedSegmentId ? Number(selectedSegmentId) : undefined,
      parentQuestionId,
      orderIndex,
      isPublished: Boolean(innerQuestion.isPublished),
    };

    if (innerQuestion.type === 'MULTIPLE_CHOICE') {
      const optionsRich = Array.isArray(innerQuestion.optionsRich) ? innerQuestion.optionsRich : [];
      const options = optionsRich.length
        ? optionsRich.map((blocks, index) => richContentToPlainText(blocks) || String(innerQuestion.options?.[index] || '').trim()).filter(Boolean)
        : (Array.isArray(innerQuestion.options) ? innerQuestion.options.map((item) => String(item || '').trim()).filter(Boolean) : []);

      return {
        ...base,
        options,
        optionsRich,
        correctIndices: Array.isArray(innerQuestion.correctIndices) ? innerQuestion.correctIndices : [0],
        allowMultipleCorrect: Boolean(innerQuestion.allowMultipleCorrect),
        explanation: String(innerQuestion.explanation || '').trim() || undefined,
      };
    }

    if (innerQuestion.type === 'TRUE_FALSE') {
      return {
        ...base,
        correctAnswer: Boolean(innerQuestion.correctAnswer),
        explanation: String(innerQuestion.explanation || '').trim() || undefined,
      };
    }

    if (innerQuestion.type === 'SHORT_ANSWER') {
      const acceptedAnswers = String(innerQuestion.acceptedAnswersText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      return {
        ...base,
        acceptedAnswers,
        caseSensitive: Boolean(innerQuestion.caseSensitive),
        fuzzyMatch: innerQuestion.fuzzyMatch !== false,
        explanation: String(innerQuestion.explanation || '').trim() || undefined,
      };
    }

    if (innerQuestion.type === 'NUMERICAL') {
      return {
        ...base,
        correct: Number(innerQuestion.correct),
        tolerance: Number.isFinite(Number(innerQuestion.tolerance)) ? Number(innerQuestion.tolerance) : 0,
        explanation: String(innerQuestion.explanation || '').trim() || undefined,
      };
    }

    if (innerQuestion.type === 'ESSAY') {
      const rubric = Array.isArray(innerQuestion.rubric)
        ? innerQuestion.rubric
            .map((item) => ({
              name: String(item.name || '').trim(),
              weight: Number(item.weight),
              description: String(item.description || '').trim(),
            }))
            .filter((item) => item.name && item.description && Number.isFinite(item.weight))
        : [];

      return {
        ...base,
        instructions: String(innerQuestion.instructions || '').trim(),
        rubric,
        wordLimit: {
          min: Number(innerQuestion.wordLimitMin || 0),
          max: Number(innerQuestion.wordLimitMax || 0) || 5000,
        },
        aiModel: innerQuestion.aiModel || 'gpt-3.5-turbo',
        gradingMethod: innerQuestion.gradingMethod || 'ai',
        externalApiUrl: String(innerQuestion.externalApiUrl || '').trim() || null,
        externalApiAuthHeader: String(innerQuestion.externalApiAuthHeader || '').trim() || null,
      };
    }

    return base;
  };

  const addOrUpdateQuestion = async () => {
    try {
      const payload = createQuestionPayload();

      if (editingId) {
        await updateQuestionApi(editingId, payload);
        // Bỏ qua cảnh báo eslint dòng này
        alert('Đã cập nhật câu hỏi.');
      } else {
        await createQuestionApi(payload);

// Bỏ qua cảnh báo eslint dòng này
alert('Đã thêm câu hỏi mới.');
      }

      await loadQuestions();
      resetDraft();
      setIsModalOpen(false);
    } catch (err) {
      // Bỏ qua cảnh báo eslint dòng này
      alert(err?.response?.data?.message || err.message || 'Không thể lưu câu hỏi.');
    }
  };

  const startEditQuestion = async (id) => {
    const question = questions.find((item) => Number(item.id) === Number(id));

    if (!question) {
      alert('Không tìm thấy câu hỏi cần sửa.');
      return;
    }

    const nextDraft = buildQuestionDraftForEdit(question);

    setEditingId(question.id);
    setDraft(nextDraft);

    if (nextDraft.courseId) {
      setSelectedCourseId(String(nextDraft.courseId));
    }
    if (nextDraft.chapterId) {
      setSelectedChapterId(String(nextDraft.chapterId));
    }
    if (nextDraft.lectureId || nextDraft.lessonId) {
      setSelectedLessonId(String(nextDraft.lectureId || nextDraft.lessonId));
    }
    if (nextDraft.segmentId) {
      setSelectedSegmentId(String(nextDraft.segmentId));
    }

    setIsModalOpen(true);
  };

  const deleteQuestion = async (id) => {
    try {
      await deleteQuestionApi(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (editingId === id) {
        resetDraft();
      }
    } catch (err) {
      // Bỏ qua cảnh báo eslint dòng này
      alert(err?.response?.data?.message || 'Không thể xóa câu hỏi.');
    }
  };

  const handleSelectCourse = async (courseId) => {
    if (isCourseScopedView) {
      return;
    }
    setSelectedCourseId(String(courseId));
    await loadChapters(courseId);
  };
const getQuizChapterTitle = (quiz) => {
  const chapter = chapters.find((item) => Number(item.id) === Number(quiz?.chapterId));

  return chapter?.title || quiz?.chapter?.title || quiz?.chapterTitle || 'Chưa chọn chương';
};

const formatQuizDate = (value) => {
  if (!value) return 'Chưa có';

  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch (_error) {
    return 'Chưa có';
  }
};

const getQuestionTextForQuiz = (question) => {
  const blocks = normalizeQuestionPreviewBlocks(question);
  const textFromBlocks = richContentToPlainText(blocks);

  return String(
    textFromBlocks
    || question?.questionText
    || question?.content
    || question?.metadata?.questionText
    || ''
  ).trim();
};

const truncateQuizText = (value, maxLength = 120) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};
const handleCreateQuiz = async () => {
  const title = quizDraft.title.trim();
  const selectedQuestionIds = Array.isArray(quizDraft.questionIds)
    ? quizDraft.questionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
    : [];
  const randomCount = quizDraft.randomize ? Number(quizDraft.randomCount || 0) : 0;

  if (!selectedCourseId) {
    alert('Vui lòng chọn khóa học cho bài kiểm tra.');
    return;
  }

  if (!quizDraft.chapterId) {
    alert('Vui lòng chọn chương cho bài kiểm tra.');
    return;
  }

  if (!title) {
    alert('Vui lòng nhập tên bài kiểm tra.');
    return;
  }

  if (Number(quizDraft.duration || 0) <= 0) {
    alert('Thời gian làm bài phải lớn hơn 0 phút.');
    return;
  }

  if (Number(quizDraft.passScore || 0) < 0 || Number(quizDraft.passScore || 0) > 100) {
    alert('Điểm đạt phải nằm trong khoảng 0 đến 100%.');
    return;
  }

  if (!editingQuizId && selectedQuestionIds.length + randomCount <= 0) {
    alert('Hãy chọn ít nhất 1 câu hỏi hoặc nhập số câu random.');
    return;
  }
  try {
    if (editingQuizId) {
      await updateTeacherQuizApi(editingQuizId, {
        title,
        description: quizDraft.description.trim(),
        duration: Number(quizDraft.duration || 45),
        passScore: Number(quizDraft.passScore || 70),
        maxAttempts: Number(quizDraft.maxAttempts || 0),
      });

      const nextEditingQuizId = editingQuizId;
      resetQuizDraft();
      await loadQuizzes();
      await loadQuizDetail(nextEditingQuizId);

      alert('Đã cập nhật bài kiểm tra.');
      return;
    }

const createdQuiz = await createQuizApi({
  courseId: Number(selectedCourseId),
  chapterId: Number(quizDraft.chapterId),
  title,
  description: quizDraft.description.trim(),
  duration: Number(quizDraft.duration || 45),
  passScore: Number(quizDraft.passScore || 70),
  maxAttempts: Number(quizDraft.maxAttempts || 0),
  questionIds: selectedQuestionIds,
  randomize: randomCount > 0,
  randomCount,
});
    resetQuizDraft();
    await loadQuizzes();

    if (createdQuiz?.id) {
      await loadQuizDetail(createdQuiz.id);
    }

    alert('Đã tạo bài kiểm tra mới. Hãy xem lại danh sách câu hỏi trước khi xuất bản.');
  } catch (err) {
    alert(err?.response?.data?.message || 'Không thể lưu bài kiểm tra.');
  }
};
const loadQuizDetail = async (quizId) => {
  setIsLoadingQuizDetail(true);

  try {
    const detail = await getTeacherQuizDetailApi(quizId);
    setSelectedQuizDetail(detail);
    setQuizAddQuestionId('');
  } catch (err) {
    alert(err?.response?.data?.message || 'Không thể tải chi tiết bài kiểm tra.');
  } finally {
    setIsLoadingQuizDetail(false);
  }
};

const handleStartEditQuiz = (quiz) => {
  setEditingQuizId(quiz.id);
  setQuizDraft({
    title: quiz.title || '',
    description: quiz.description || '',
    chapterId: quiz.chapterId ? String(quiz.chapterId) : '',
    duration: String(quiz.duration || 45),
    passScore: String(quiz.passScore || 70),
    maxAttempts: String(quiz.maxAttempts ?? 0),
    questionIds: [],
    questionTitles: [],
    randomize: false,
    randomCount: 0,
    multipleChoiceCount: '0',
    trueFalseCount: '0',
    shortAnswerCount: '0',
    essayCount: '0',
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleDeleteQuiz = async (quizId) => {
  const ok = window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này không?');

  if (!ok) return;

  try {
    await deleteTeacherQuizApi(quizId);

    if (Number(selectedQuizDetail?.id) === Number(quizId)) {
      setSelectedQuizDetail(null);
    }

    await loadQuizzes();
    alert('Đã xóa bài kiểm tra.');
  } catch (err) {
    alert(err?.response?.data?.message || 'Không thể xóa bài kiểm tra.');
  }
};

const handleAddQuestionToQuiz = async () => {
  if (!selectedQuizDetail?.id) {
    alert('Vui lòng chọn bài kiểm tra trước.');
    return;
  }

  if (!quizAddQuestionId) {
    alert('Vui lòng chọn câu hỏi cần thêm.');
    return;
  }

  try {
    await addQuestionToQuizApi(selectedQuizDetail.id, quizAddQuestionId, {
      order: (selectedQuizDetail.questions || []).length + 1,
      points: 1,
    });

    await loadQuizDetail(selectedQuizDetail.id);
    await loadQuizzes();

    alert('Đã thêm câu hỏi vào bài kiểm tra.');
  } catch (err) {
    alert(err?.response?.data?.message || 'Không thể thêm câu hỏi vào bài kiểm tra.');
  }
};

const handleRemoveQuestionFromQuiz = async (quizId, questionId) => {
  const ok = window.confirm('Bạn có chắc chắn muốn bỏ câu hỏi này khỏi bài kiểm tra không?');

  if (!ok) return;

  try {
    await removeQuestionFromQuizApi(quizId, questionId);
    await loadQuizDetail(quizId);
    await loadQuizzes();

    alert('Đã bỏ câu hỏi khỏi bài kiểm tra.');
  } catch (err) {
    alert(err?.response?.data?.message || 'Không thể bỏ câu hỏi khỏi bài kiểm tra.');
  }
};
const handlePublishQuiz = async (quizId) => {
  const ok = window.confirm(
    'Sau khi xuất bản, học viên có thể nhìn thấy bài kiểm tra này. Bạn chắc chắn muốn xuất bản?'
  );

  if (!ok) return;

  try {
    await httpClient.post(`/quiz-manager/${quizId}/publish`);
    await loadQuizzes();

    if (Number(selectedQuizDetail?.id) === Number(quizId)) {
      await loadQuizDetail(quizId);
    }

    alert('Đã xuất bản bài kiểm tra.');
  } catch (err) {
    alert(err?.response?.data?.message || 'Không thể xuất bản bài kiểm tra.');
  }
};

  const updateRubricItem = (index, field, value) => {
    setDraft((prev) => {
      const next = [...prev.rubric];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, rubric: next };
    });
  };

  const addRubricItem = () => {
    setDraft((prev) => ({
      ...prev,
      rubric: [...prev.rubric, { name: '', weight: 0, description: '' }],
    }));
  };

  const removeRubricItem = (index) => {
    setDraft((prev) => ({
      ...prev,
      rubric: prev.rubric.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const applyQuizPreset = (preset) => {
    setQuizDraft((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  const saveQuizQuotaDefaults = () => {
    const defaults = {
      multipleChoiceCount: quizDraft.multipleChoiceCount,
      trueFalseCount: quizDraft.trueFalseCount,
      shortAnswerCount: quizDraft.shortAnswerCount,
      essayCount: quizDraft.essayCount,
    };

    window.localStorage.setItem(QUIZ_QUOTA_STORAGE_KEY, JSON.stringify(defaults));
    // Bỏ qua cảnh báo eslint dòng này
    alert('Đã lưu preset quota mặc định.');
  };

  const clearQuizQuotaDefaults = () => {
    window.localStorage.removeItem(QUIZ_QUOTA_STORAGE_KEY);
    setQuizDraft((prev) => ({
      ...prev,
      multipleChoiceCount: '3',
      trueFalseCount: '3',
      shortAnswerCount: '3',
      essayCount: '1',
    }));
    // Bỏ qua cảnh báo eslint dòng này
    alert('Đã xóa preset quota mặc định.');
  };

  const renderTypeSpecificForm = () => (
    <QuestionTypeFields draft={draft} setDraft={setDraft} />
  );

  return (
    <div className={embedded ? '' : 'instructor-question-bank-page'}>
      {!embedded ? <TeacherSidebar /> : null}

      
      <main className="instructor-question-bank-main-content" style={embedded ? { marginLeft: 0, padding: 0 } : undefined}>
        <header className="instructor-question-bank-page-header">
          <h1 className="instructor-question-bank-page-title">Quản lý Ngân hàng Câu hỏi</h1>
          {isCourseScopedView && !embedded ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="instructor-question-bank-btn instructor-question-bank-btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => navigate(`/teacher/courses/${selectedCourseId}/chapters`)}
              >
                ← Quay lại quản lý khóa học
              </button>
            </div>
          ) : null}
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('questions')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'questions' ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === 'questions' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'questions' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              📚 Ngân hàng Câu hỏi
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'quizzes' ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === 'quizzes' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'quizzes' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              🎓 Quản lý Bài Kiểm Tra
            </button>
          </div>
        </header>

        {/* Common error display */}
        {error && activeTab === 'questions' ? (
          <section className="instructor-question-bank-card" style={{ color: 'red' }}>
            <p>Lỗi: {error}</p>
          </section>
        ) : null}

        {quizError && activeTab === 'quizzes' ? (
          <section className="instructor-question-bank-card" style={{ color: 'red' }}>
            <p>Lỗi quiz: {quizError}</p>
          </section>
        ) : null}

        {activeTab === 'questions' && (
          <QuestionBankTab
            questions={questions}
            filteredQuestions={filteredQuestions}
            courses={courses}
            chapters={chapters}
            lessons={lessons}
            segments={segments}
            selectedChapterId={selectedChapterId}
            selectedLessonId={selectedLessonId}
            selectedSegmentId={selectedSegmentId}
            selectedTypeFilter={selectedTypeFilter}
            loading={isLoading}
            error={error}
            setSelectedChapterId={setSelectedChapterId}
            setSelectedLessonId={setSelectedLessonId}
            setSelectedSegmentId={setSelectedSegmentId}
            setSelectedTypeFilter={setSelectedTypeFilter}
            startEditQuestion={startEditQuestion}
            deleteQuestion={deleteQuestion}
            addOrUpdateQuestion={addOrUpdateQuestion}
            QUESTION_TYPES={QUESTION_TYPES}
            QUESTION_TYPE_LABELS={QUESTION_TYPE_LABELS}
            questionCount={questionCount}
            publishedCount={publishedCount}
            typeSummary={typeSummary}
            draft={draft}
            setDraft={setDraft}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            editingId={editingId}
            setEditingId={setEditingId}
            createEmptyDraft={createEmptyDraft}
            renderTypeSpecificForm={renderTypeSpecificForm}
            expandedQuestionId={expandedQuestionId}
            setExpandedQuestionId={setExpandedQuestionId}
            parseJson={parseJson}
            normalizeQuestionPreviewBlocks={normalizeQuestionPreviewBlocks}
            resetDraft={resetDraft}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizManagerTab
            quizDraft={quizDraft}
            setQuizDraft={setQuizDraft}
            chapters={chapters}
            questions={questions}
            editingQuizId={editingQuizId}
            quizSelectedQuestionCount={quizSelectedQuestionCount}
            quizRandomQuestionCount={quizRandomQuestionCount}
            quizQuestionTotal={quizQuestionTotal}
            selectQuizQuestionsModalOpen={selectQuizQuestionsModalOpen}
            setSelectQuizQuestionsModalOpen={setSelectQuizQuestionsModalOpen}
            selectedCourseId={selectedCourseId}
            truncateQuizText={truncateQuizText}
            handleCreateQuiz={handleCreateQuiz}
            resetQuizDraft={resetQuizDraft}
            selectedQuizDetail={selectedQuizDetail}
            setSelectedQuizDetail={setSelectedQuizDetail}
            getQuizChapterTitle={getQuizChapterTitle}
            quizAddQuestionId={quizAddQuestionId}
            setQuizAddQuestionId={setQuizAddQuestionId}
            availableQuestionsForQuiz={availableQuestionsForQuiz}
            getQuestionTextForQuiz={getQuestionTextForQuiz}
            handleAddQuestionToQuiz={handleAddQuestionToQuiz}
            isLoadingQuizDetail={isLoadingQuizDetail}
            handleRemoveQuestionFromQuiz={handleRemoveQuestionFromQuiz}
            QUESTION_TYPE_LABELS={QUESTION_TYPE_LABELS}
            isLoadingQuizzes={isLoadingQuizzes}
            visibleQuizzes={visibleQuizzes}
            formatQuizDate={formatQuizDate}
            loadQuizDetail={loadQuizDetail}
            handleStartEditQuiz={handleStartEditQuiz}
            handlePublishQuiz={handlePublishQuiz}
            handleDeleteQuiz={handleDeleteQuiz}
          />
        )}
      </main>

    </div>
  );
}

export default ManHinhQuanLyNganHangCauhoi;
