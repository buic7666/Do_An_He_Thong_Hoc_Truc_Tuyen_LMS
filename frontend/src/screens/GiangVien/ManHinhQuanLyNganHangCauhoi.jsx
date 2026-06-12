import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import httpClient from '../../api/httpClient';
import { fetchCoursesApi } from '../../api/courseApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
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

import './ManHinhQuanLyNganHangCauhoi.css';

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
  externalApiUrl: '',
  externalApiAuthHeader: '',
});

const createEmptyQuizDraft = () => ({
  title: '',
  description: '',
  chapterId: '',
  duration: '45',
  passScore: '70',
  maxAttempts: '0',
  multipleChoiceCount: '3',
  trueFalseCount: '3',
  shortAnswerCount: '3',
  essayCount: '1',
});
const bankDetailParseJson = (value, fallback = {}) => {
  if (value == null) return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }

  return value && typeof value === 'object' ? value : fallback;
};

const bankDetailNormalizeType = (value) => {
  const type = String(value || 'MULTIPLE_CHOICE').toUpperCase();
  return type === 'MULTICHOICE' ? 'MULTIPLE_CHOICE' : type;
};

const bankDetailNormalizeBlocks = (value) => {
  if (Array.isArray(value)) return value;

  const parsed = bankDetailParseJson(value, null);

  if (Array.isArray(parsed)) return parsed;

  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.contentBlocks)) return parsed.contentBlocks;
    if (Array.isArray(parsed.blocks)) return parsed.blocks;
    if (Array.isArray(parsed.richContent?.blocks)) return parsed.richContent.blocks;
  }

  if (typeof value === 'string' && value.trim()) {
    return [{ type: 'text', text: value.trim() }];
  }

  return [];
};

const bankDetailBlocksToText = (blocks) => {
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((block) => {
      if (!block) return '';
      if (block.type === 'text') return block.text || '';
      if (block.type === 'image') return block.alt || block.url || '[Ảnh]';
      if (block.type === 'video') return block.title || block.url || '[Video]';
      return block.text || block.content || '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const bankDetailNormalizeIndex = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const text = value.trim().toUpperCase();

    if (/^[A-Z]$/.test(text)) {
      return text.charCodeAt(0) - 65;
    }

    const numberValue = Number(text);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  return null;
};

const bankDetailGetCorrectIndices = (question, metadata) => {
  const raw = Array.isArray(metadata?.correctIndices)
    ? metadata.correctIndices
    : Array.isArray(question?.correctIndices)
      ? question.correctIndices
      : metadata?.correctIndex != null
        ? [metadata.correctIndex]
        : question?.correctIndex != null
          ? [question.correctIndex]
          : metadata?.answerIndex != null
            ? [metadata.answerIndex]
            : question?.answerIndex != null
              ? [question.answerIndex]
              : [];

  return raw
    .map((item) => bankDetailNormalizeIndex(item))
    .filter((item) => Number.isFinite(item) && item >= 0);
};

const bankDetailGetOptions = (question, metadata) => {
  const rawOptions = Array.isArray(metadata?.options)
    ? metadata.options
    : Array.isArray(question?.options)
      ? question.options
      : [];

  const rawOptionsRich = Array.isArray(metadata?.optionsRich)
    ? metadata.optionsRich
    : Array.isArray(question?.optionsRich)
      ? question.optionsRich
      : [];

  const length = Math.max(rawOptions.length, rawOptionsRich.length);

  return Array.from({ length }).map((_, index) => {
    const richSource = rawOptionsRich[index];
    const rawSource = rawOptions[index];

    const blocks = bankDetailNormalizeBlocks(
      richSource?.contentBlocks
      || richSource?.blocks
      || richSource?.richContent?.blocks
      || richSource
    );

    const text = bankDetailBlocksToText(blocks) || String(rawSource?.text || rawSource || '').trim();

    return {
      index,
      label: String.fromCharCode(65 + index),
      blocks,
      text,
    };
  });
};

const QuestionFullAnswerDetail = ({ question }) => {
  if (!question) return null;

  const metadata = bankDetailParseJson(question.metadata, {});
  const type = bankDetailNormalizeType(question.type || metadata.type);
  const correctIndices = bankDetailGetCorrectIndices(question, metadata);

  if (type === 'MULTIPLE_CHOICE') {
    const options = bankDetailGetOptions(question, metadata);

    return (
      <div className="question-detail-answer-section">
        <h4>✅ Đáp án của câu hỏi</h4>

        {options.length === 0 ? (
          <p className="question-detail-empty">Chưa có danh sách đáp án.</p>
        ) : (
          <div className="question-detail-options">
            {options.map((option) => {
              const isCorrect = correctIndices.includes(option.index);

              return (
                <div
                  key={`answer-${option.index}`}
                  className={`question-detail-option ${isCorrect ? 'is-correct' : ''}`}
                >
                  <div className="question-detail-option-label">
                    {option.label}
                  </div>

                  <div className="question-detail-option-content">
                    {option.blocks.length > 0 ? (
                      <RichContentRenderer blocks={option.blocks} />
                    ) : (
                      <p>{option.text || `Đáp án ${option.label}`}</p>
                    )}
                  </div>

                  {isCorrect ? (
                    <div className="question-detail-correct-badge">
                      Đáp án đúng
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="question-detail-correct-text">
          <strong>Đáp án đúng:</strong>{' '}
          {correctIndices.length
            ? correctIndices.map((index) => String.fromCharCode(65 + index)).join(', ')
            : 'Chưa chọn'}
        </div>
      </div>
    );
  }

  if (type === 'TRUE_FALSE') {
    const correctAnswer =
      typeof metadata.correctAnswer === 'boolean'
        ? metadata.correctAnswer
        : typeof question.correctAnswer === 'boolean'
          ? question.correctAnswer
          : true;

    return (
      <div className="question-detail-answer-section">
        <h4>✅ Đáp án Đúng/Sai</h4>
        <div className="question-detail-correct-text">
          <strong>Đáp án đúng:</strong> {correctAnswer ? 'Đúng' : 'Sai'}
        </div>
      </div>
    );
  }

  if (type === 'SHORT_ANSWER') {
    const acceptedAnswers = Array.isArray(metadata.acceptedAnswers)
      ? metadata.acceptedAnswers
      : Array.isArray(question.acceptedAnswers)
        ? question.acceptedAnswers
        : [];

    return (
      <div className="question-detail-answer-section">
        <h4>✅ Các câu trả lời chấp nhận</h4>

        {acceptedAnswers.length ? (
          <div className="question-detail-short-answers">
            {acceptedAnswers.map((answer, index) => (
              <span key={`short-answer-${index}`}>
                {String(answer)}
              </span>
            ))}
          </div>
        ) : (
          <p className="question-detail-empty">Chưa có đáp án chấp nhận.</p>
        )}

        <div className="question-detail-correct-text">
          <strong>Phân biệt hoa/thường:</strong>{' '}
          {metadata.caseSensitive || question.caseSensitive ? 'Có' : 'Không'}
          {' · '}
          <strong>Khớp mềm:</strong>{' '}
          {metadata.fuzzyMatch === false || question.fuzzyMatch === false ? 'Không' : 'Có'}
        </div>
      </div>
    );
  }

  if (type === 'ESSAY') {
    const rubric = Array.isArray(metadata.rubric)
      ? metadata.rubric
      : Array.isArray(question.rubric)
        ? question.rubric
        : [];

    return (
      <div className="question-detail-answer-section">
        <h4>✅ Hướng dẫn chấm tự luận</h4>

        <p>
          <strong>Hướng dẫn:</strong>{' '}
          {metadata.instructions || question.instructions || 'Chưa có'}
        </p>

        {rubric.length ? (
          <div className="question-detail-rubric-list">
            {rubric.map((item, index) => (
              <div key={`rubric-${index}`} className="question-detail-rubric-item">
                <strong>{item.name || `Tiêu chí ${index + 1}`}</strong>
                <span>{Number(item.weight || 0)}%</span>
                <p>{item.description || 'Chưa có mô tả'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="question-detail-empty">Chưa có rubric.</p>
        )}
      </div>
    );
  }

  if (type === 'CLOZE') {
    const innerQuestions = metadata.inner_questions && typeof metadata.inner_questions === 'object'
      ? Object.entries(metadata.inner_questions)
      : [];

    return (
      <div className="question-detail-answer-section">
        <h4>✅ Câu hỏi nhỏ trong bài đọc</h4>

        {innerQuestions.length ? (
          <div className="question-detail-inner-list">
            {innerQuestions.map(([key, item], index) => {
              const innerType = bankDetailNormalizeType(item?.type);
              const innerMetadata = bankDetailParseJson(item?.metadata, item || {});
              const innerCorrectIndices = bankDetailGetCorrectIndices(item, innerMetadata);
              const innerOptions = bankDetailGetOptions(item, innerMetadata);

              return (
                <div key={key || index} className="question-detail-inner-item">
                  <h5>
                    {index + 1}. {item?.content || item?.questionText || key}
                  </h5>

                  <p>
                    <strong>Loại:</strong>{' '}
                    {QUESTION_TYPE_LABELS?.[innerType] || innerType}
                  </p>

                  {innerType === 'MULTIPLE_CHOICE' ? (
                    <>
                      <div className="question-detail-options">
                        {innerOptions.map((option) => {
                          const isCorrect = innerCorrectIndices.includes(option.index);

                          return (
                            <div
                              key={`inner-option-${option.index}`}
                              className={`question-detail-option ${isCorrect ? 'is-correct' : ''}`}
                            >
                              <div className="question-detail-option-label">
                                {option.label}
                              </div>
                              <div className="question-detail-option-content">
                                {option.blocks.length > 0 ? (
                                  <RichContentRenderer blocks={option.blocks} />
                                ) : (
                                  <p>{option.text || `Đáp án ${option.label}`}</p>
                                )}
                              </div>
                              {isCorrect ? (
                                <div className="question-detail-correct-badge">
                                  Đáp án đúng
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      <p>
                        <strong>Đáp án đúng:</strong>{' '}
                        {innerCorrectIndices.length
                          ? innerCorrectIndices.map((i) => String.fromCharCode(65 + i)).join(', ')
                          : 'Chưa chọn'}
                      </p>
                    </>
                  ) : null}

                  {innerType === 'TRUE_FALSE' ? (
                    <p>
                      <strong>Đáp án đúng:</strong>{' '}
                      {item?.correctAnswer === false ? 'Sai' : 'Đúng'}
                    </p>
                  ) : null}

                  {innerType === 'SHORT_ANSWER' ? (
                    <p>
                      <strong>Đáp án chấp nhận:</strong>{' '}
                      {Array.isArray(item?.acceptedAnswers) && item.acceptedAnswers.length
                        ? item.acceptedAnswers.join(' | ')
                        : 'Chưa có'}
                    </p>
                  ) : null}

                  {innerType === 'ESSAY' ? (
                    <p>
                      <strong>Hướng dẫn:</strong>{' '}
                      {item?.instructions || 'Chưa có'}
                    </p>
                  ) : null}

                  {item?.explanation ? (
                    <p>
                      <strong>Giải thích:</strong> {item.explanation}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="question-detail-empty">Chưa có câu hỏi nhỏ.</p>
        )}
      </div>
    );
  }

  return null;
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

  const quizQuestionTotal = useMemo(() => (
    Number(quizDraft.multipleChoiceCount || 0)
    + Number(quizDraft.trueFalseCount || 0)
    + Number(quizDraft.shortAnswerCount || 0)
    + Number(quizDraft.essayCount || 0)
  ), [quizDraft]);

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

    if ((String(draft.gradingMethod || 'ai')) === 'external_api') {
      const externalApiUrl = String(draft.externalApiUrl || '').trim();
      if (!externalApiUrl) {
        throw new Error('Cần nhập URL API chấm điểm khi chọn chấm bằng API.');
      }
      new URL(externalApiUrl);
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
      externalApiUrl: (draft.gradingMethod || 'ai') === 'external_api' ? String(draft.externalApiUrl || '').trim() || null : null,
      externalApiAuthHeader: (draft.gradingMethod || 'ai') === 'external_api' ? String(draft.externalApiAuthHeader || '').trim() || null : null,
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
        const createdQuestion = await createQuestionApi(payload);

        if (draft.type === 'CLOZE') {
          const innerQuestions = draft.metadata?.inner_questions || {};
          const innerEntries = Object.entries(innerQuestions);

          for (let index = 0; index < innerEntries.length; index += 1) {
            const [, innerQuestion] = innerEntries[index];
            await createQuestionApi(buildNormalQuestionPayloadFromInner(innerQuestion, createdQuestion.id, index + 1));
          }
        }

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

  const handleCreateQuiz = async () => {
    const title = quizDraft.title.trim();
    const totalQuota = quizQuestionTotal;
    if (!selectedCourseId) {
      // Bỏ qua cảnh báo eslint dòng này
      alert('Vui lòng chọn khóa học cho quiz.');
      return;
    }
    if (!title) {
      // Bỏ qua cảnh báo eslint dòng này
      alert('Vui lòng nhập tên quiz.');
      return;
    }
    if (totalQuota <= 0) {
      // Bỏ qua cảnh báo eslint dòng này
      alert('Tổng số câu quiz phải lớn hơn 0.');
      return;
    }

    try {
      await createQuizApi({
        courseId: Number(selectedCourseId),
        chapterId: quizDraft.chapterId ? Number(quizDraft.chapterId) : undefined,
        title,
        description: quizDraft.description.trim(),
        duration: Number(quizDraft.duration || 45),
        passScore: Number(quizDraft.passScore || 70),
        maxAttempts: Number(quizDraft.maxAttempts || 0),
        questionQuotas: {
          multipleChoice: Number(quizDraft.multipleChoiceCount || 0),
          trueFalse: Number(quizDraft.trueFalseCount || 0),
          shortAnswer: Number(quizDraft.shortAnswerCount || 0),
          essay: Number(quizDraft.essayCount || 0),
        },
      });
      resetQuizDraft();
      await loadQuizzes();
      // Bỏ qua cảnh báo eslint dòng này
      alert('Đã tạo quiz mới.');
    } catch (err) {
      // Bỏ qua cảnh báo eslint dòng này
      alert(err?.response?.data?.message || 'Không thể tạo quiz.');
    }
  };

  const handlePublishQuiz = async (quizId) => {
    try {
      await httpClient.post(`/quiz-manager/${quizId}/publish`);
      await loadQuizzes();
      // Bỏ qua cảnh báo eslint dòng này
      alert('Đã xuất bản quiz.');
    } catch (err) {
      // Bỏ qua cảnh báo eslint dòng này
      alert(err?.response?.data?.message || 'Không thể xuất bản quiz.');
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

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <>
            


          <QuestionFormModal
            key={editingId ? `edit-${editingId}` : 'create-question'}
            isOpen={isModalOpen}
            draft={draft}
            onDraftChange={setDraft}
            onConfirm={addOrUpdateQuestion}
            onCancel={resetDraft}
            renderTypeSpecificForm={renderTypeSpecificForm}
            mode={editingId ? 'edit' : 'create'}
          />

        <section className="instructor-question-bank-card">
          <div className="instructor-question-bank-list-header">
            <div>
              <h2 className="instructor-question-bank-card-title">Danh sách câu hỏi ({filteredQuestions.length}/{questionCount})</h2>
              
            </div>
            <button
              className="instructor-question-bank-btn instructor-question-bank-btn-success"
              type="button"
              onClick={() => {
                setEditingId(null);
                setDraft(createEmptyDraft());
                setIsModalOpen(true);
              }}
            >
              Thêm Câu hỏi mới
            </button>
          </div>

          <div className="instructor-question-bank-stats-grid">
            <article className="instructor-question-bank-stat-card primary"><strong>{questionCount}</strong><span>Tổng câu hỏi</span></article>
            <article className="instructor-question-bank-stat-card success"><strong>{publishedCount}</strong><span>Đã xuất bản</span></article>
            <article className="instructor-question-bank-stat-card neutral"><strong>{Object.keys(typeSummary).length}</strong><span>Loại câu hỏi</span></article>
          </div>

          <div className="instructor-question-bank-filter-panel">

              <div className="instructor-question-bank-filter-grid">
                <label className="instructor-question-bank-form-group no-margin">
                  <span className="instructor-question-bank-form-label">Chương</span>
                  <select className="instructor-question-bank-form-control" value={selectedChapterId} onChange={(event) => setSelectedChapterId(event.target.value)}>
                    <option value="">Tất cả chương</option>
                    {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
                  </select>
                </label>
                <label className="instructor-question-bank-form-group no-margin">
                  <span className="instructor-question-bank-form-label">Bài giảng</span>
                  <select className="instructor-question-bank-form-control" value={selectedLessonId} onChange={(event) => setSelectedLessonId(event.target.value)} disabled={!lessons.length}>
                    <option value="">Tất cả bài giảng</option>
                    {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
                  </select>
                </label>
                <label className="instructor-question-bank-form-group no-margin">
                  <span className="instructor-question-bank-form-label">Phần bài giảng</span>
                  <select className="instructor-question-bank-form-control" value={selectedSegmentId} onChange={(event) => setSelectedSegmentId(event.target.value)} disabled={!segments.length}>
                    <option value="">Tất cả phần</option>
                    {segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.title}</option>)}
                  </select>
                </label>
                <label className="instructor-question-bank-form-group no-margin">
                  <span className="instructor-question-bank-form-label">Loại câu hỏi</span>
                  <select className="instructor-question-bank-form-control" value={selectedTypeFilter} onChange={(event) => setSelectedTypeFilter(event.target.value)}>
                    <option value="">Tất cả loại</option>
                    {QUESTION_TYPES.map((type) => (
                      <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>
                    ))}
                  </select>
                </label>
              </div>
          </div>

          {isLoading ? <p>Đang tải dữ liệu từ CSDL...</p> : null}

          <div className="instructor-question-bank-question-list">
            {filteredQuestions.map((question, index) => {
              const metadata = parseJson(question.metadata, {});
              const type = question.type || 'MULTIPLE_CHOICE';
              let answerPreview = 'Chưa thiết lập';

              if (type === 'MULTIPLE_CHOICE') {
                answerPreview = `Đáp án đúng: ${(metadata.correctIndices || []).map((item) => String.fromCharCode(65 + Number(item))).join(', ')}`;
              } else if (type === 'TRUE_FALSE') {
                answerPreview = `Đáp án đúng: ${metadata.correctAnswer ? 'Đúng' : 'Sai'}`;
              } else if (type === 'SHORT_ANSWER') {
                answerPreview = `Chấp nhận: ${(metadata.acceptedAnswers || []).join(' | ')}`;
              } else if (type === 'ESSAY') {
                answerPreview = `Mục đánh giá: ${(metadata.rubric || []).length}`;
              }

              const previewBlocks = normalizeQuestionPreviewBlocks(question);

              return (
                <article className="question-bank-card-item" key={question.id}>
                  <div className="question-bank-card-head">
                    <div className="instructor-question-bank-q-content">
                      <div className="question-bank-card-title-row">
                        <span className="question-bank-type-badge">{QUESTION_TYPE_LABELS[type]}</span>
                        <h4>{index + 1}. {question.content || question.questionText || 'Không có nội dung'}</h4>
                      </div>
                      {previewBlocks.length ? (
                        <div style={{ marginTop: 8, maxWidth: '100%' }}>
                          <RichContentRenderer blocks={previewBlocks} />
                        </div>
                      ) : null}
                      <p className="question-bank-card-preview">{answerPreview}</p>
                      <p className="question-bank-card-preview secondary">Khóa học: {courses.find((course) => String(course.id) === String(question.courseId))?.title || '—'} · Chương: {chapters.find((chapter) => String(chapter.id) === String(question.chapterId))?.title || '—'}</p>
                    </div>

                    <div className="question-bank-card-actions">
                      <button
                        className="btn-prev-item"
                        type="button"
                        onClick={() => setExpandedQuestionId((prev) => (prev === question.id ? null : question.id))}
                      >
                        {expandedQuestionId === question.id ? 'Thu gọn' : 'Xem chi tiết'}
                      </button>
                      <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={() => startEditQuestion(question.id)} type="button">Sửa</button>
                      <button className="instructor-question-bank-btn instructor-question-bank-btn-danger" onClick={() => deleteQuestion(question.id)} type="button">Xóa</button>
                    </div>
                  </div>

                  {expandedQuestionId === question.id ? (
  <div className="question-bank-card-body">
    {(() => {
      const getBlocks = (value) => {
        if (Array.isArray(value)) return value;

        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
            if (Array.isArray(parsed?.contentBlocks)) return parsed.contentBlocks;
            if (Array.isArray(parsed?.blocks)) return parsed.blocks;
          } catch (_error) {
            return value.trim() ? [{ type: 'text', text: value.trim() }] : [];
          }

          return value.trim() ? [{ type: 'text', text: value.trim() }] : [];
        }

        if (value && typeof value === 'object') {
          if (Array.isArray(value.contentBlocks)) return value.contentBlocks;
          if (Array.isArray(value.blocks)) return value.blocks;
          if (Array.isArray(value.richContent?.blocks)) return value.richContent.blocks;
          if (value.text) return [{ type: 'text', text: String(value.text) }];
        }

        return [];
      };

      const blocksToText = (blocks) => {
        if (!Array.isArray(blocks)) return '';

        return blocks
          .map((block) => {
            if (!block) return '';
            if (block.type === 'text') return block.text || '';
            if (block.type === 'image') return block.alt || block.url || '[Ảnh]';
            if (block.type === 'video') return block.title || block.url || '[Video]';
            return block.text || block.content || '';
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizeIndex = (value) => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;

        if (typeof value === 'string') {
          const text = value.trim().toUpperCase();

          if (/^[A-Z]$/.test(text)) {
            return text.charCodeAt(0) - 65;
          }

          const numberValue = Number(text);
          if (Number.isFinite(numberValue)) return numberValue;
        }

        return null;
      };

      const correctIndices = (
        Array.isArray(metadata.correctIndices)
          ? metadata.correctIndices
          : Array.isArray(question.correctIndices)
            ? question.correctIndices
            : metadata.correctIndex != null
              ? [metadata.correctIndex]
              : question.correctIndex != null
                ? [question.correctIndex]
                : metadata.answerIndex != null
                  ? [metadata.answerIndex]
                  : question.answerIndex != null
                    ? [question.answerIndex]
                    : []
      )
        .map((item) => normalizeIndex(item))
        .filter((item) => Number.isFinite(item) && item >= 0);

      const rawOptions = Array.isArray(metadata.options)
        ? metadata.options
        : Array.isArray(question.options)
          ? question.options
          : [];

      const rawOptionsRich = Array.isArray(metadata.optionsRich)
        ? metadata.optionsRich
        : Array.isArray(question.optionsRich)
          ? question.optionsRich
          : [];

      const optionLength = Math.max(rawOptions.length, rawOptionsRich.length);

      const options = Array.from({ length: optionLength }).map((_, index) => {
        const richSource = rawOptionsRich[index];
        const rawSource = rawOptions[index];

        const blocks = getBlocks(
          richSource?.contentBlocks
          || richSource?.blocks
          || richSource?.richContent?.blocks
          || richSource
        );

        const text = blocksToText(blocks) || String(rawSource?.text || rawSource || '').trim();

        return {
          index,
          label: String.fromCharCode(65 + index),
          blocks,
          text,
          isCorrect: correctIndices.includes(index),
        };
      });

      if (type === 'MULTIPLE_CHOICE') {
        return (
          <div className="question-detail-answer-section">
            <h4>✅ Danh sách đáp án</h4>

            {options.length > 0 ? (
              <div className="question-detail-options">
                {options.map((option) => (
                  <div
                    key={`option-${question.id}-${option.index}`}
                    className={`question-detail-option ${option.isCorrect ? 'is-correct' : ''}`}
                  >
                    <div className="question-detail-option-label">
                      {option.label}
                    </div>

                    <div className="question-detail-option-content">
                      {option.blocks.length > 0 ? (
                        <RichContentRenderer blocks={option.blocks} />
                      ) : (
                        <p>{option.text || `Đáp án ${option.label}`}</p>
                      )}
                    </div>

                    {option.isCorrect ? (
                      <span className="question-detail-correct-badge">
                        Đáp án đúng
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="question-detail-empty">Chưa có danh sách đáp án.</p>
            )}

            <p className="question-detail-correct-text">
              <strong>Đáp án đúng:</strong>{' '}
              {correctIndices.length
                ? correctIndices.map((index) => String.fromCharCode(65 + index)).join(', ')
                : 'Chưa chọn'}
            </p>

            {metadata.explanation ? (
              <p className="question-detail-correct-text">
                <strong>Giải thích:</strong> {metadata.explanation}
              </p>
            ) : null}
          </div>
        );
      }

      if (type === 'TRUE_FALSE') {
        const correctAnswer =
          typeof metadata.correctAnswer === 'boolean'
            ? metadata.correctAnswer
            : typeof question.correctAnswer === 'boolean'
              ? question.correctAnswer
              : true;

        return (
          <div className="question-detail-answer-section">
            <h4>✅ Đáp án Đúng/Sai</h4>
            <p><strong>Đáp án đúng:</strong> {correctAnswer ? 'Đúng' : 'Sai'}</p>
            {metadata.explanation ? <p><strong>Giải thích:</strong> {metadata.explanation}</p> : null}
          </div>
        );
      }

      if (type === 'SHORT_ANSWER') {
        const acceptedAnswers = Array.isArray(metadata.acceptedAnswers)
          ? metadata.acceptedAnswers
          : Array.isArray(question.acceptedAnswers)
            ? question.acceptedAnswers
            : [];

        return (
          <div className="question-detail-answer-section">
            <h4>✅ Đáp án chấp nhận</h4>
            {acceptedAnswers.length ? (
              <div className="question-detail-short-answers">
                {acceptedAnswers.map((answer, index) => (
                  <span key={`answer-${question.id}-${index}`}>
                    {String(answer)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="question-detail-empty">Chưa có đáp án chấp nhận.</p>
            )}
            {metadata.explanation ? <p><strong>Giải thích:</strong> {metadata.explanation}</p> : null}
          </div>
        );
      }

      if (type === 'ESSAY') {
        const rubric = Array.isArray(metadata.rubric)
          ? metadata.rubric
          : Array.isArray(question.rubric)
            ? question.rubric
            : [];

        return (
          <div className="question-detail-answer-section">
            <h4>✅ Hướng dẫn chấm tự luận</h4>
            <p><strong>Hướng dẫn:</strong> {metadata.instructions || question.instructions || 'Chưa có'}</p>

            {rubric.length ? (
              <div className="question-detail-rubric-list">
                {rubric.map((item, index) => (
                  <div key={`rubric-${question.id}-${index}`} className="question-detail-rubric-item">
                    <strong>{item.name || `Tiêu chí ${index + 1}`}</strong>
                    <span>{Number(item.weight || 0)}%</span>
                    <p>{item.description || 'Chưa có mô tả'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="question-detail-empty">Chưa có rubric.</p>
            )}
          </div>
        );
      }

      if (type === 'CLOZE') {
        const innerQuestions = metadata.inner_questions && typeof metadata.inner_questions === 'object'
          ? Object.entries(metadata.inner_questions)
          : [];

        return (
          <div className="question-detail-answer-section">
            <h4>✅ Câu hỏi nhỏ trong bài đọc</h4>

            {innerQuestions.length ? (
              <div className="question-detail-inner-list">
                {innerQuestions.map(([key, item], index) => (
                  <div key={key || index} className="question-detail-inner-item">
                    <h5>{index + 1}. {item?.content || item?.questionText || key}</h5>
                    <p><strong>Loại:</strong> {item?.type || 'Chưa có'}</p>
                    <p><strong>Đáp án:</strong> {item?.correctAnswer ?? item?.correct ?? item?.acceptedAnswers?.join?.(', ') ?? 'Chưa có'}</p>
                    {item?.explanation ? <p><strong>Giải thích:</strong> {item.explanation}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="question-detail-empty">Chưa có câu hỏi nhỏ.</p>
            )}
          </div>
        );
      }

      return null;
    })()}
  </div>
) : null}
                </article>
              );
            })}
            {!filteredQuestions.length && !isLoading ? <p className="instructor-question-bank-empty-state">Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.</p> : null}
          </div>
        </section>
          </>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <>
            

            <section className="instructor-question-bank-card highlighted">
              <h2 className="instructor-question-bank-card-title">Tạo bài kiểm tra mới</h2>
          

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-chapter">Chương</label>
            <select
              className="instructor-question-bank-form-control"
              id="quiz-chapter"
              value={quizDraft.chapterId || ''}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, chapterId: event.target.value }))}
            >
              <option value="">-- Chọn chương --</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
              ))}
            </select>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-title">Tên quiz</label>
            <input
              className="instructor-question-bank-form-control"
              id="quiz-title"
              value={quizDraft.title}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label">Preset quota nhanh</label>
            <div className="instructor-question-bank-options-list" style={{ gap: 8, flexWrap: 'wrap' }}>
              {QUIZ_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="instructor-question-bank-btn instructor-question-bank-btn-primary"
                  type="button"
                  onClick={() => applyQuizPreset(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              className="instructor-question-bank-btn instructor-question-bank-btn-success"
              style={{ marginTop: 10, width: 'fit-content' }}
              type="button"
              onClick={saveQuizQuotaDefaults}
            >
              Lưu preset mặc định của tôi
            </button>
            <button
              className="instructor-question-bank-btn instructor-question-bank-btn-primary"
              style={{ marginTop: 10, marginLeft: 8, width: 'fit-content' }}
              type="button"
              onClick={clearQuizQuotaDefaults}
            >
              Xóa preset mặc định
            </button>
          </div>

          <div className="instructor-question-bank-form-group">
            <label className="instructor-question-bank-form-label" htmlFor="quiz-description">Mô tả</label>
            <textarea
              className="instructor-question-bank-form-control"
              id="quiz-description"
              value={quizDraft.description}
              onChange={(event) => setQuizDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div className="instructor-question-bank-options-list" style={{ gap: '12px' }}>
            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-duration">Thời gian (phút)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-duration"
                type="number"
                value={quizDraft.duration}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, duration: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-pass-score">Điểm đạt (%)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-pass-score"
                type="number"
                value={quizDraft.passScore}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, passScore: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-max-attempts">Số lần làm (0 = vô hạn)</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-max-attempts"
                type="number"
                min="0"
                value={quizDraft.maxAttempts}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, maxAttempts: event.target.value }))}
              />
            </div>
          </div>

          <div className="instructor-question-bank-options-list" style={{ gap: '12px', marginTop: 12 }}>
            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-mc-count">Số câu trắc nghiệm</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-mc-count"
                min="0"
                type="number"
                value={quizDraft.multipleChoiceCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, multipleChoiceCount: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-tf-count">Số câu đúng/sai</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-tf-count"
                min="0"
                type="number"
                value={quizDraft.trueFalseCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, trueFalseCount: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-sa-count">Số câu trả lời ngắn</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-sa-count"
                min="0"
                type="number"
                value={quizDraft.shortAnswerCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, shortAnswerCount: event.target.value }))}
              />
            </div>

            <div className="instructor-question-bank-form-group" style={{ flex: 1 }}>
              <label className="instructor-question-bank-form-label" htmlFor="quiz-essay-count">Số câu tự luận</label>
              <input
                className="instructor-question-bank-form-control"
                id="quiz-essay-count"
                min="0"
                type="number"
                value={quizDraft.essayCount}
                onChange={(event) => setQuizDraft((prev) => ({ ...prev, essayCount: event.target.value }))}
              />
            </div>
          </div>

          <p style={{ marginTop: 8, marginBottom: 0, color: '#6b7280' }}>
            Tổng số câu quiz sẽ lấy tự động: {quizQuestionTotal}.
          </p>

          <div className="instructor-question-bank-actions">
            <button className="instructor-question-bank-btn instructor-question-bank-btn-success" onClick={handleCreateQuiz} type="button">
              Tạo quiz
            </button>
            <button className="instructor-question-bank-btn instructor-question-bank-btn-primary" onClick={resetQuizDraft} type="button">
              Làm mới
            </button>
          </div>
        </section>

            <section className="instructor-question-bank-card">
          <h2 className="instructor-question-bank-card-title">Danh sách bài kiểm tra của tôi</h2>
          <div className="instructor-question-bank-question-list">
            {quizzes.map((quiz) => (
              <article className="instructor-question-bank-q-item" key={quiz.id}>
                <div className="instructor-question-bank-q-content">
                  <h4>{quiz.title}</h4>
                  <span className="instructor-question-bank-q-correct">
                    Khóa học: {quiz.course?.title || quiz.courseTitle || 'N/A'} · Trạng thái: {quiz.isPublished ? 'Đã xuất bản' : 'Nháp'}
                  </span>
                </div>

                <div className="instructor-question-bank-q-actions">
                  {!quiz.isPublished ? (
                    <button className="instructor-question-bank-btn-icon edit" onClick={() => handlePublishQuiz(quiz.id)} title="Xuất bản" type="button">
                      Xuất bản
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!quizzes.length && !isLoadingQuizzes ? <p>Chưa có quiz nào.</p> : null}
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}

export default ManHinhQuanLyNganHangCauhoi;
