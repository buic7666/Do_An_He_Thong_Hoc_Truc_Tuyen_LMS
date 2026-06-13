import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import httpClient from '../../api/httpClient';
import QuestionFormModal from '../../components/QuestionFormModal';
import ClozeQuestionForm from '../../components/ClozeQuestionForm';
import SelectQuestionsModal from '../../components/SelectQuestionsModal';
import RichContentEditor, { createEmptyRichBlocks, richContentToPlainText } from '../../components/RichContentEditor';
import RichContentRenderer from '../../components/RichContentRenderer';
import QuestionTypeFields from '../../components/QuestionTypeFields';
import QuizTaker from '../../components/QuizTaker';
import {
  fetchQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  updateLessonSegmentApi,
} from '../../api/teacherManagementApi';
import { useLocation } from 'react-router-dom';
import { uploadTeacherFileApi } from '../../api/teacherApi';
import './SegmentDetailView.css';
import '../../components/QuizTaker.css';

const isLikelyImageUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^(data:image\/[a-zA-Z0-9.+-]+;base64,)/i.test(raw)) return true;
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(raw)) return true;
  return /\/uploads\/images\//i.test(raw);
};

const normalizePreviewBlocks = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return [];

  if (isLikelyImageUrl(raw)) {
    return [{ type: 'image', url: raw, alt: '' }];
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace('www.', '').toLowerCase();
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      return [{ type: 'video', url: raw, title: 'YouTube video' }];
    }
  } catch (_error) {
    // not a URL
  }

  if (raw.includes('<') && raw.includes('>') && typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      const plainText = String(doc.body.textContent || '').replace(/\s+/g, ' ').trim();
      const images = Array.from(doc.querySelectorAll('img[src]'));
      const iframes = Array.from(doc.querySelectorAll('iframe[src]'));
      const blocks = [];
      if (plainText) blocks.push({ type: 'text', text: plainText });
      images.forEach((img) => {
        const src = String(img.getAttribute('src') || '').trim();
        if (src) blocks.push({ type: 'image', url: src, alt: String(img.getAttribute('alt') || '').trim() });
      });
      iframes.forEach((iframe) => {
        const src = String(iframe.getAttribute('src') || '').trim();
        if (src) blocks.push({ type: 'video', url: src, title: String(iframe.getAttribute('title') || 'YouTube video').trim() });
      });
      if (blocks.length) return blocks;
    } catch (_error) {}
  }

  return [{ type: 'text', text: raw }];
};

const SEGMENT_CONTENT_META = {
  text: { icon: '📝', title: 'Text', color: '#3498db' },
  document: { icon: '📎', title: 'Tài liệu', color: '#e74c3c' },
  question: { icon: '❓', title: 'Câu hỏi cố định', color: '#f39c12' },
  quiz: { icon: '🧪', title: 'Bài tập', color: '#9b59b6' },
  videoClip: { icon: '🎬', title: 'Video Clip', color: '#1abc9c' },
};

const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CLOZE'];

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CLOZE: 'Câu hỏi bài đọc',
};

const createEmptyQuestionDraft = () => ({
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

const normalizeContentBlocks = (value) => (Array.isArray(value) ? value : []);

const normalizeRichBlocksValue = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  const parsed = parseJson(value, null);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.contentBlocks)) {
      return parsed.contentBlocks;
    }

    if (Array.isArray(parsed.blocks)) {
      return parsed.blocks;
    }

    if (Array.isArray(parsed.richContent?.blocks)) {
      return parsed.richContent.blocks;
    }
  }

  if (typeof value === 'string') {
    return normalizePreviewBlocks(value);
  }

  return [];
};

const normalizeMetadata = (question) => {
  const metadata = parseJson(question?.metadata, {});
  return metadata && typeof metadata === 'object' ? metadata : {};
};

const getQuestionType = (question, metadata) => {
  const rawType = String(question?.type || metadata?.type || 'MULTIPLE_CHOICE').toUpperCase();
  return rawType === 'MULTICHOICE' ? 'MULTIPLE_CHOICE' : rawType;
};

const getQuestionTitle = (question, metadata) => (
  question?.content
  || question?.questionText
  || metadata?.questionText
  || metadata?.title
  || ''
);

const renderRichText = (value) => {
  const blocks = normalizeRichBlocksValue(value);
  return blocks.length > 0 ? <RichContentRenderer blocks={blocks} /> : null;
};

const renderInfoItem = (label, value) => (
  <div className="info-item">
    <span className="label">{label}</span>
    <span className="value">{value}</span>
  </div>
);

const formatInnerQuestionAnswer = (item) => {
  if (!item || typeof item !== 'object') {
    return 'Chưa có';
  }

  const normalizedType = String(item.type || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  const normalizeChoiceIndex = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim().toUpperCase();
      if (!trimmed) return null;

      if (/^[A-Z]$/.test(trimmed)) {
        return trimmed.charCodeAt(0) - 65;
      }

      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber)) {
        return asNumber;
      }
    }

    return null;
  };

  if (normalizedType === 'MULTIPLE_CHOICE' || normalizedType === 'MULTICHOICE') {
    const rawIndices = Array.isArray(item.correctIndices)
      ? item.correctIndices
      : Array.isArray(item.correct_answers)
        ? item.correct_answers
        : item.correctIndex != null
          ? [item.correctIndex]
          : item.answerIndex != null
            ? [item.answerIndex]
            : item.correctOptionIndex != null
              ? [item.correctOptionIndex]
              : [];

    const normalizedIndices = rawIndices
      .map((value) => normalizeChoiceIndex(value))
      .filter((value) => Number.isFinite(value));

    if (normalizedIndices.length) {
      return normalizedIndices.map((index) => String.fromCharCode(65 + index)).join(', ');
    }

    if (item.correct != null && String(item.correct).trim() !== '') {
      return String(item.correct).trim();
    }

    if (item.answer != null && String(item.answer).trim() !== '') {
      return String(item.answer).trim();
    }

    if (item.correctAnswer != null && String(item.correctAnswer).trim() !== '') {
      return String(item.correctAnswer).trim();
    }

    return 'Chưa có';
  }

  if (normalizedType === 'TRUE_FALSE') {
    if (typeof item.correctAnswer === 'boolean') {
      return item.correctAnswer ? 'Đúng' : 'Sai';
    }

    if (item.correct != null) {
      return item.correct === true || String(item.correct).toLowerCase() === 'true' ? 'Đúng' : 'Sai';
    }

    return 'Chưa có';
  }

  if (normalizedType === 'SHORT_ANSWER') {
    const acceptedAnswers = Array.isArray(item.acceptedAnswers) ? item.acceptedAnswers : [];
    if (acceptedAnswers.length) {
      return acceptedAnswers.join(' | ');
    }

    if (item.correct != null && String(item.correct).trim() !== '') {
      return String(item.correct).trim();
    }

    return 'Chưa có';
  }

  if (normalizedType === 'NUMERICAL') {
    const tolerance = Number.isFinite(Number(item.tolerance)) ? ` (±${item.tolerance})` : '';
    return item.correct != null && String(item.correct).trim() !== '' ? `${item.correct}${tolerance}` : 'Chưa có';
  }

  if (normalizedType === 'ESSAY') {
    return item.instructions || 'Chưa có';
  }

  return 'Chưa có';
};

const renderQuestionPayloadSummary = (question, metadata) => {
  const contentBlocks = normalizeRichBlocksValue(metadata.contentBlocks || question.contentBlocks);
  const contentPlain = (Array.isArray(contentBlocks) && contentBlocks.length) ? richContentToPlainText(contentBlocks) : String(metadata.text_template || question.content || '').trim();

  return (
    <div className="detail-section">
      <h3>📝 Câu Hỏi</h3>
      <div className="question-content">
        {contentBlocks.length > 0 ? (
          <RichContentRenderer blocks={contentBlocks} />
        ) : (
          <p>{metadata.text_template || question.content || 'Chưa có nội dung'}</p>
        )}
      </div>
    </div>
  );
};

const QuestionDetailModal = ({ question, onClose }) => {
  if (!question) {
    return null;
  }

  const metadata = normalizeMetadata(question);
  const questionType = getQuestionType(question, metadata);
  const options = Array.isArray(metadata.options)
    ? metadata.options
    : Array.isArray(question.options)
      ? question.options
      : [];
  const optionsRichSource = Array.isArray(question.optionsRich) && question.optionsRich.length
    ? question.optionsRich
    : (Array.isArray(metadata.optionsRich) && metadata.optionsRich.length ? metadata.optionsRich : []);
  const combinedOptions = (() => {
    const maxLen = Math.max(options.length, optionsRichSource.length);
    const out = [];
    for (let i = 0; i < maxLen; i += 1) {
      if (i < optionsRichSource.length) out.push({ rich: optionsRichSource[i], raw: options[i] });
      else out.push({ rich: null, raw: options[i] });
    }
    return out;
  })();
  const correctIndices = Array.isArray(metadata.correctIndices)
    ? metadata.correctIndices.map((index) => Number(index)).filter((index) => Number.isFinite(index))
    : Array.isArray(question.correctIndices)
      ? question.correctIndices.map((index) => Number(index)).filter((index) => Number.isFinite(index))
      : typeof metadata.correctIndex === 'number'
        ? [metadata.correctIndex]
        : typeof question.correctIndex === 'number'
          ? [question.correctIndex]
          : [];
  const acceptedAnswers = Array.isArray(metadata.acceptedAnswers)
    ? metadata.acceptedAnswers
    : Array.isArray(question.acceptedAnswers)
      ? question.acceptedAnswers
      : [];
  const rubric = Array.isArray(metadata.rubric) ? metadata.rubric : [];
  const innerQuestions = metadata.inner_questions && typeof metadata.inner_questions === 'object'
    ? Object.entries(metadata.inner_questions)
    : [];
  const contentBlocks = normalizeRichBlocksValue(metadata.contentBlocks || question.contentBlocks);
  const questionTitle = getQuestionTitle(question, metadata);

  return (
    <div className="question-detail-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="question-detail-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Chi Tiết Câu Hỏi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="inline-detail-panel__header">
          <h2>Chi Tiết Câu Hỏi</h2>
          <button type="button" className="question-detail-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="inline-detail-panel__body">
            {questionType !== 'CLOZE' ? renderQuestionPayloadSummary(question, metadata) : null}

            {questionType === 'MULTIPLE_CHOICE' && options.length > 0 ? (
              <div className="detail-section">
                <h3>✅ Các Lựa Chọn</h3>
                {correctIndices.length ? (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Đáp án đúng: </strong>
                    <span>{correctIndices.map((index) => String.fromCharCode(65 + index)).join(', ')}</span>
                  </div>
                ) : null}
                <div className="options-list">
                  {combinedOptions.map((opt, index) => (
                    <div key={`option-${index}`} className={`option-item ${correctIndices.includes(index) ? 'correct' : ''}`}>
                      <span className="option-index">{String.fromCharCode(65 + index)}</span>
                      <div className="option-text-wrapper">
                        {(() => {
                          const source = opt.rich ?? opt.raw;
                          const optionBlocks = normalizeRichBlocksValue(source?.contentBlocks || source?.blocks || source?.richContent?.blocks || source?.text || source);

                          if (optionBlocks.length > 0) {
                            return <RichContentRenderer blocks={optionBlocks} />;
                          }

                          if (source?.text) {
                            return <p>{source.text}</p>;
                          }

                          return <p>{String(source || '')}</p>;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {questionType === 'TRUE_FALSE' ? (
              <div className="detail-section">
                <h3>✅ Đáp Án Đúng/Sai</h3>
                <div className="metadata-info">
                  {renderInfoItem('Đáp án đúng', metadata.correctAnswer === true || question.correctAnswer === true ? 'Đúng' : 'Sai')}
                </div>
              </div>
            ) : null}

            {questionType === 'SHORT_ANSWER' ? (
              <div className="detail-section">
                <h3>✏️ Trả Lời Ngắn</h3>
                <div className="metadata-info">
                  {renderInfoItem('Câu trả lời chấp nhận', acceptedAnswers.length ? acceptedAnswers.join(' | ') : 'Chưa có')}
                  {renderInfoItem('Phân biệt hoa/thường', metadata.caseSensitive ? 'Có' : 'Không')}
                  {renderInfoItem('Khớp mềm', metadata.fuzzyMatch === false ? 'Không' : 'Có')}
                </div>
              </div>
            ) : null}

            {questionType === 'ESSAY' ? (
              <div className="detail-section">
                <h3>🧾 Tự Luận</h3>
                <div className="metadata-info">
                  {renderInfoItem('Hướng dẫn', metadata.instructions || question.instructions || 'Chưa có')}
                  {renderInfoItem('Số từ tối thiểu', String(metadata.wordLimit?.min ?? question.wordLimitMin ?? 'Chưa có'))}
                  {renderInfoItem('Số từ tối đa', String(metadata.wordLimit?.max ?? question.wordLimitMax ?? 'Chưa có'))}
                  {renderInfoItem('Mô hình AI', metadata.aiModel || question.aiModel || 'Chưa có')}
                </div>
                {renderRichText(metadata.instructionsBlocks || question.instructionsBlocks) ? (
                  <div style={{ marginTop: 12 }}>
                    <h4 style={{ marginBottom: 8 }}>Hướng dẫn dạng rich text</h4>
                    <div className="question-content">
                      {renderRichText(metadata.instructionsBlocks || question.instructionsBlocks)}
                    </div>
                  </div>
                ) : null}
                {rubric.length ? (
                  <div style={{ marginTop: 12 }}>
                    <h4 style={{ marginBottom: 8 }}>Rubric</h4>
                    <div className="options-list">
                      {rubric.map((item, index) => (
                        <div key={`rubric-${index}`} className="option-item">
                          <span className="option-index">{index + 1}</span>
                          <div className="option-text-wrapper">
                            <p><strong>{item.name}</strong> - {item.weight}%</p>
                            <p>{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {questionType === 'CLOZE' ? (
              <div className="detail-section">
                <h3>📚 Câu Hỏi Bài Đọc</h3>
                <div className="metadata-info">
                  {renderInfoItem('Số câu hỏi nhỏ', String(innerQuestions.length))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ marginBottom: 8 }}>Nội dung đọc</h4>
                  <div className="question-content">
                    {renderRichText(contentBlocks) || <p>{metadata.text_template || question.content || 'Chưa có nội dung đọc'}</p>}
                  </div>
                </div>
                {innerQuestions.length ? (
                  <div style={{ marginTop: 12 }}>
                    <h4 style={{ marginBottom: 8 }}>Câu hỏi nhỏ</h4>
                    <div className="options-list">
                      {innerQuestions.map(([key, item], index) => (
                        <div key={key || index} className="option-item">
                          <span className="option-index">{index + 1}</span>
                          <div className="option-text-wrapper">
                            <p><strong>{key || `q${index + 1}`}</strong> - {QUESTION_TYPE_LABELS[String(item?.type || '').toUpperCase()] || String(item?.type || '').replace('_', ' ')}</p>
                                        {(() => {
                                          const innerBlocks = normalizeRichBlocksValue(item?.contentBlocks || item?.blocks || item?.richContent?.blocks || item?.content || item?.questionText || item);
                                          if (innerBlocks.length) {
                                            return (
                                              <div style={{ marginTop: 8 }}>
                                                <RichContentRenderer blocks={innerBlocks} />
                                              </div>
                                            );
                                          }

                                          return <p>{item?.content || item?.questionText || 'Chưa có nội dung'}</p>;
                                        })()}
                            <div style={{ marginTop: 8 }}>
                              {(String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'MULTIPLE_CHOICE' || String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'MULTICHOICE') ? <p><strong>Đáp án đúng:</strong> {formatInnerQuestionAnswer(item)}</p> : null}
                              {(String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'MULTIPLE_CHOICE' || String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'MULTICHOICE') ? (
                                <div>
                                  <strong>Lựa chọn:</strong>
                                  <div style={{ marginTop: 8 }}>
                                    {(Array.isArray(item?.options) ? item.options : []).map((option, oi) => {
                                      const optionBlocks = normalizeRichBlocksValue(option?.contentBlocks || option?.blocks || option?.richContent?.blocks || option?.text || option);

                                      if (optionBlocks.length) {
                                        return <div key={`opt-${oi}`} style={{ marginBottom: 8 }}><RichContentRenderer blocks={optionBlocks} /></div>;
                                      }

                                      return <div key={`opt-${oi}`} style={{ marginBottom: 8 }}>{String(option ?? '')}</div>;
                                    })}
                                  </div>
                                </div>
                              ) : null}
                              {String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'TRUE_FALSE' ? <p><strong>Đáp án đúng:</strong> {formatInnerQuestionAnswer(item)}</p> : null}
                              {String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'SHORT_ANSWER' ? <p><strong>Đáp án chấp nhận:</strong> {formatInnerQuestionAnswer(item)}</p> : null}
                              {String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'NUMERICAL' ? <p><strong>Đáp án số:</strong> {formatInnerQuestionAnswer(item)}</p> : null}
                              {String(item?.type || '').toUpperCase().replace(/[\s-]+/g, '_') === 'ESSAY' ? <p><strong>Hướng dẫn:</strong> {formatInnerQuestionAnswer(item)}</p> : null}
                              {item?.explanation ? <p><strong>Giải thích:</strong> {item.explanation}</p> : null}
                              {item?.points != null ? <p><strong>Điểm:</strong> {item.points}</p> : null}
                              {item?.isPublished != null ? <p><strong>Công khai:</strong> {item.isPublished ? 'Có' : 'Không'}</p> : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {metadata.explanation ? (
              <div className="detail-section">
                <h3>💡 Giải Thích</h3>
                <div className="explanation-box">{metadata.explanation}</div>
              </div>
            ) : null}
        </div>

        <div className="inline-detail-panel__footer">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const createEmptyContentItem = (type = 'text', orderIndex = 1) => ({
  type,
  title: type === 'question' ? 'Câu hỏi cố định' : '',
  content: '',
  contentBlocks: type === 'text' ? [createEmptyRichBlocks()[0]] : [],
  resourceUrl: '',
  quizId: null,
  questionIds: [],
  questionTitles: [],
  randomize: false,
  randomCount: 0,
  startTime: '',
  endTime: '',
  orderIndex,
});

const separateQuestionContentItem = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item, index) => normalizeContentItemForForm(item, index))
    : [];

  const questionItem = normalizedItems.find((item) => item.type === 'question') || createEmptyContentItem('question', normalizedItems.length + 1);
  const visibleItems = normalizedItems.filter((item) => item.type !== 'question');

  return {
    contentItems: [
      { ...questionItem, title: 'Câu hỏi cố định', orderIndex: 1 },
      ...visibleItems.map((item, index) => ({ ...item, orderIndex: index + 2 })),
    ],
    fixedQuestionItem: { ...questionItem, title: 'Câu hỏi cố định', orderIndex: 1 },
  };
};

const mergeQuestionContentItem = (contentItems = [], fixedQuestionItem = null) => {
  const normalizedContentItems = Array.isArray(contentItems)
    ? contentItems.map((item, index) => ({ ...item, orderIndex: index + 1 }))
    : [];

  const normalizedQuestionItem = fixedQuestionItem && fixedQuestionItem.type === 'question'
    ? { ...fixedQuestionItem, title: 'Câu hỏi cố định' }
    : createEmptyContentItem('question', normalizedContentItems.length + 1);

  const restItems = normalizedContentItems.filter((item) => item.type !== 'question');

  return [
    { ...normalizedQuestionItem, orderIndex: 1 },
    ...restItems.map((item, index) => ({ ...item, orderIndex: index + 2 })),
  ];
};

const normalizeContentItemForForm = (item, index) => ({
  type: item?.type || 'text',
  title: item?.title ?? '',
  content: item?.content ?? '',
  contentBlocks: Array.isArray(item?.contentBlocks) && item.contentBlocks.length
    ? item.contentBlocks
    : (typeof item?.content === 'string' && item.content.trim() ? [{ type: 'text', text: item.content }] : createEmptyRichBlocks()),
  resourceUrl: item?.resourceUrl ?? '',
  quizId: Number.isInteger(Number(item?.quizId)) && Number(item.quizId) > 0 ? Number(item.quizId) : null,
  questionIds: Array.isArray(item?.questionIds) ? item.questionIds : [],
  questionTitles: Array.isArray(item?.questionTitles) ? item.questionTitles : [],
  randomize: Boolean(item?.randomize),
  randomCount: Number(item?.randomCount || 0),
  startTime: item?.startTime ?? '',
  endTime: item?.endTime ?? '',
  orderIndex: Number.isInteger(Number(item?.orderIndex)) && Number(item.orderIndex) > 0
    ? Number(item.orderIndex)
    : index + 1,
});

const normalizeContentItemForPayload = (item, index) => ({
  type: item?.type || 'text',
  title: item?.type === 'question'
    ? 'Câu hỏi'
    : (typeof item?.title === 'string' ? item.title.trim() : String(item?.title ?? '').trim()),
  content: typeof item?.content === 'string' && item.content.trim()
    ? item.content.trim()
    : richContentToPlainText(Array.isArray(item?.contentBlocks) && item.contentBlocks.length ? item.contentBlocks : createEmptyRichBlocks()),
  contentBlocks: Array.isArray(item?.contentBlocks) && item.contentBlocks.length
    ? item.contentBlocks
    : (item?.type === 'text' ? [{ type: 'text', text: String(item?.content || '').trim() }] : []),
  resourceUrl: typeof item?.resourceUrl === 'string' ? item.resourceUrl.trim() : '',
  ...(Number.isInteger(Number(item?.quizId)) && Number(item.quizId) > 0 ? { quizId: Number(item.quizId) } : {}),
  questionIds: Array.isArray(item?.questionIds) ? item.questionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [],
  questionTitles: Array.isArray(item?.questionTitles) ? item.questionTitles.map((title) => String(title || '').trim()).filter(Boolean) : [],
  randomize: Boolean(item?.randomize),
  randomCount: Number(item?.randomCount || 0),
  ...(item?.startTime === '' || item?.startTime == null
    ? {}
    : { startTime: Number(item.startTime) }),
  ...(item?.endTime === '' || item?.endTime == null
    ? {}
    : { endTime: Number(item.endTime) }),
  orderIndex: index + 1,
});

function SegmentDetailView() {
  const { courseId, chapterId, lessonId, segmentId } = useParams();
  const navigate = useNavigate();
  const autoSaveTimerRef = useRef(null);
  const shouldSkipFirstAutoSaveRef = useRef(true);
  const saveInFlightRef = useRef(false);

  // State
  const [segment, setSegment] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [contentItems, setContentItems] = useState([]);
  const [fixedQuestionItem, setFixedQuestionItem] = useState(createEmptyContentItem('question', 1));
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState(createEmptyQuestionDraft());
  const [questionEditingId, setQuestionEditingId] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [viewQuestion, setViewQuestion] = useState(null);
  const viewQuestionPanelRef = useRef(null);
  const [selectQuestionsModal, setSelectQuestionsModal] = useState({ open: false, itemIndex: null });
  const [quizPreview, setQuizPreview] = useState({ open: false, quizId: null, title: '' });
  const location = useLocation();

  const loadQuestions = async () => {
    if (!courseId || !chapterId || !lessonId || !segmentId) {
      setQuestions([]);
      return [];
    }

    setQuestionLoading(true);
    setQuestionError('');

    try {
      const items = await fetchQuestionsApi({
        courseId: Number(courseId),
        chapterId: Number(chapterId),
        lectureId: Number(lessonId),
        segmentId: Number(segmentId),
      });

      const normalizedItems = Array.isArray(items) ? items : [];
      setQuestions(normalizedItems);
      return normalizedItems;
    } catch (err) {
      setQuestionError(err?.response?.data?.message || 'Không thể tải danh sách câu hỏi.');
      setQuestions([]);
      return [];
    } finally {
      setQuestionLoading(false);
    }
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load lesson details
        const lessonRes = await httpClient.get(`/lessons/${lessonId}`);
        setLesson(lessonRes.data?.data || {});

        // Load chapter
        const chapterRes = await httpClient.get(`/chapters/${chapterId}`);
        setChapter(chapterRes.data?.data || {});

        // Load course
        const courseRes = await httpClient.get(`/courses/${courseId}`);
        setCourse(courseRes.data?.data || {});

        // Load segment
        const segmentRes = await httpClient.get(`/lessons/${lessonId}/segments/${segmentId}`);
        const segmentData = segmentRes.data?.data || {};
        setSegment(segmentData);
        const splitItems = separateQuestionContentItem(segmentData.contentItems || []);
        setContentItems(splitItems.contentItems);
        setFixedQuestionItem(splitItems.fixedQuestionItem);
        setCurrentItemIndex(0);
        shouldSkipFirstAutoSaveRef.current = true;
        const loadedQuestions = await loadQuestions();

        // If the URL requested to open a specific question, try to open it
        try {
          const params = new URLSearchParams(location.search || '');
          const openQ = params.get('openQuestionId');
          if (openQ) {
            const qid = Number(openQ);
            if (qid && Number.isFinite(qid)) {
              // wait until questions are set, then find or fetch
              // find in loaded questions
              const found = loadedQuestions.find((q) => Number(q.id) === qid);
              if (found) {
                setViewQuestion(found);
              } else {
                // fetch single question from API
                try {
                  const res = await httpClient.get(`/questions/${qid}`);
                  const qdata = res?.data?.data || res?.data || null;
                  if (qdata) setViewQuestion(qdata);
                } catch (e) {
                  // ignore fetch error
                }
              }
            }
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err?.response?.data?.message || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, chapterId, lessonId, segmentId]);

  useEffect(() => {
    if (!segment || loading) {
      return undefined;
    }

    if (shouldSkipFirstAutoSaveRef.current) {
      shouldSkipFirstAutoSaveRef.current = false;
      return undefined;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const persistChanges = async () => {
        if (saveInFlightRef.current) {
          // Another save is running; skip this autosave
          return;
        }
        try {
          const fixedContentItems = mergeQuestionContentItem(contentItems, fixedQuestionItem);
          const payload = {
            title: segment.title,
            orderIndex: segment.orderIndex,
            contentItems: fixedContentItems.map((item, index) => normalizeContentItemForPayload(item, index)),
          };

          saveInFlightRef.current = true;
          await updateLessonSegmentApi(segmentId, payload);
          setSaveStatus('Đã đồng bộ tự động');
          setTimeout(() => setSaveStatus(''), 1800);
        } catch (err) {
          console.error('Auto save error:', err);
          setSaveStatus(err?.response?.data?.message || 'Không thể đồng bộ tự động');
        } finally {
          saveInFlightRef.current = false;
        }
      };

      void persistChanges();
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [contentItems, loading, segment, segmentId]);

  // Handle thêm content item
  const handleAddContentItem = (type = 'text') => {
    const newItem = createEmptyContentItem(type, contentItems.length + 1);
    setContentItems([...contentItems, newItem]);
    if (type === 'quiz') {
      setTimeout(() => {
        setSelectQuestionsModal({ open: true, itemIndex: contentItems.length });
      }, 0);
    }
  };

  // Handle cập nhật content item
  const handleUpdateContentItem = (index, field, value) => {
    setContentItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle xóa content item
  const handleDeleteContentItem = (index) => {
    if (contentItems[index]?.type === 'question') {
      alert('Phần câu hỏi là cố định và không thể xóa.');
      return;
    }

    if (contentItems.length === 1) {
      alert('Phải có ít nhất một nội dung!');
      return;
    }
    setContentItems((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, orderIndex: idx + 1 }))
    );
    setCurrentItemIndex(Math.max(0, currentItemIndex - 1));
  };

  const handleAddQuestion = () => {
    setQuestionEditingId(null);
    setQuestionDraft(createEmptyQuestionDraft());
    setQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) {
      return;
    }

    try {
      await deleteQuestionApi(questionId);
      await loadQuestions();
      if (questionEditingId === questionId) {
        setQuestionEditingId(null);
        setQuestionDraft(createEmptyQuestionDraft());
        setQuestionModalOpen(false);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể xóa câu hỏi.');
    }
  };

  const normalizeQuestionTypeForEdit = (value) => {
    const type = String(value || 'MULTIPLE_CHOICE').toUpperCase();
    if (type === 'MULTICHOICE') return 'MULTIPLE_CHOICE';
    return QUESTION_TYPES.includes(type) ? type : 'MULTIPLE_CHOICE';
  };

  const normalizeBooleanForEdit = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return fallback;
  };

  const normalizeCorrectIndexForEdit = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim().toUpperCase();

      if (/^[A-Z]$/.test(trimmed)) {
        return trimmed.charCodeAt(0) - 65;
      }

      const numberValue = Number(trimmed);
      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }

    return null;
  };

  const buildQuestionDraftFromQuestion = (question) => {
    const emptyDraft = createEmptyQuestionDraft();
    const metadata = parseJson(question?.metadata, {});
    const type = normalizeQuestionTypeForEdit(question?.type || metadata?.type);

    const rawContentBlocks = normalizeRichBlocksValue(
      question?.contentBlocks
        || metadata?.contentBlocks
        || metadata?.blocks
        || metadata?.richContent?.blocks
        || [],
    );

    const textContent = String(
      type === 'CLOZE'
        ? metadata?.text_template || question?.content || question?.questionText || ''
        : question?.content || question?.questionText || metadata?.questionText || metadata?.title || '',
    ).trim();

    const contentBlocks = rawContentBlocks.length > 0
      ? rawContentBlocks
      : (textContent ? [{ type: 'text', text: textContent }] : createEmptyRichBlocks());

    const metadataOptions = Array.isArray(metadata?.options) ? metadata.options : [];
    const questionOptions = Array.isArray(question?.options) ? question.options : [];
    const rawOptions = metadataOptions.length ? metadataOptions : questionOptions;

    const metadataOptionsRich = Array.isArray(metadata?.optionsRich) ? metadata.optionsRich : [];
    const questionOptionsRich = Array.isArray(question?.optionsRich) ? question.optionsRich : [];
    const rawOptionsRich = metadataOptionsRich.length ? metadataOptionsRich : questionOptionsRich;

    const optionCount = Math.max(
      rawOptions.length,
      rawOptionsRich.length,
      type === 'MULTIPLE_CHOICE' ? 4 : 0,
    );

    const optionsRich = Array.from({ length: optionCount }).map((_, index) => {
      const richBlocks = normalizeRichBlocksValue(rawOptionsRich[index]);

      if (richBlocks.length > 0) {
        return richBlocks;
      }

      return [{ type: 'text', text: String(rawOptions[index] || '') }];
    });

    const options = optionsRich.map((blocks, index) => (
      richContentToPlainText(blocks) || String(rawOptions[index] || '').trim()
    ));

    const rawCorrectIndices = Array.isArray(metadata?.correctIndices)
      ? metadata.correctIndices
      : Array.isArray(question?.correctIndices)
        ? question.correctIndices
        : metadata?.correctIndex != null
          ? [metadata.correctIndex]
          : question?.correctIndex != null
            ? [question.correctIndex]
            : metadata?.answerIndex != null
              ? [metadata.answerIndex]
              : [0];

    const correctIndices = rawCorrectIndices
      .map((item) => normalizeCorrectIndexForEdit(item))
      .filter((item) => Number.isFinite(item) && item >= 0 && item < Math.max(optionCount, 1));

    const acceptedAnswers = Array.isArray(metadata?.acceptedAnswers)
      ? metadata.acceptedAnswers
      : Array.isArray(question?.acceptedAnswers)
        ? question.acceptedAnswers
        : Array.isArray(metadata?.answers)
          ? metadata.answers
          : [];

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

      isPublished: Boolean(question?.isPublished),

      options: options.length ? options : emptyDraft.options,
      optionsRich: optionsRich.length ? optionsRich : emptyDraft.optionsRich,
      correctIndices: correctIndices.length ? correctIndices : [0],
      allowMultipleCorrect: Boolean(metadata?.allowMultipleCorrect || question?.allowMultipleCorrect),

      explanation: String(metadata?.explanation || question?.explanation || ''),

      correctAnswer: normalizeBooleanForEdit(
        metadata?.correctAnswer ?? question?.correctAnswer,
        true,
      ),

      acceptedAnswersText: acceptedAnswers.map((item) => String(item || '').trim()).filter(Boolean).join('\n'),
      caseSensitive: normalizeBooleanForEdit(metadata?.caseSensitive ?? question?.caseSensitive, false),
      fuzzyMatch: normalizeBooleanForEdit(metadata?.fuzzyMatch ?? question?.fuzzyMatch, true),

      instructions: String(metadata?.instructions || question?.instructions || ''),
      rubric:
        Array.isArray(metadata?.rubric) && metadata.rubric.length
          ? metadata.rubric
          : Array.isArray(question?.rubric) && question.rubric.length
            ? question.rubric
            : emptyDraft.rubric,

      wordLimitMin: Number(wordLimit?.min ?? metadata?.wordLimitMin ?? question?.wordLimitMin ?? 100),
      wordLimitMax: Number(wordLimit?.max ?? metadata?.wordLimitMax ?? question?.wordLimitMax ?? 400),

      aiModel: metadata?.aiModel || question?.aiModel || 'gpt-3.5-turbo',
      gradingMethod: metadata?.gradingMethod || question?.gradingMethod || 'ai',
    };
  };

  const startEditQuestion = (questionId) => {
    const question = questions.find((item) => Number(item.id) === Number(questionId));

    if (!question) {
      alert('Không tìm thấy câu hỏi cần sửa.');
      return;
    }

    setViewQuestion(null);
    setQuestionEditingId(question.id);
    setQuestionDraft(buildQuestionDraftFromQuestion(question));
    setQuestionModalOpen(true);
  };

  const buildQuestionPayload = () => {
    const content = questionDraft.content.trim();

    if (!content) {
      throw new Error('Vui lòng nhập nội dung câu hỏi.');
    }

    const base = {
      type: questionDraft.type,
      content,
      contentBlocks: Array.isArray(questionDraft.contentBlocks) ? questionDraft.contentBlocks : createEmptyRichBlocks(),
      courseId: Number(courseId),
      chapterId: Number(chapterId),
      lectureId: Number(lessonId),
      segmentId: Number(segmentId),
      isPublished: questionDraft.isPublished,
    };

    if (questionDraft.type === 'MULTIPLE_CHOICE') {
      const pairs = (Array.isArray(questionDraft.optionsRich) ? questionDraft.optionsRich : questionDraft.options.map((item) => ([{ type: 'text', text: String(item || '') }])) )
          .map((blocks, index) => {
            const normalized = normalizeRichBlocksValue(blocks);
            const text = richContentToPlainText(normalized) || String(questionDraft.options?.[index] || '').trim();
            return { rawIndex: index, blocks: normalized, value: text };
          })
          .filter((item) => (Array.isArray(item.blocks) && item.blocks.length) || String(item.value || '').trim() !== '');

        const options = pairs.map((item) => item.value || '');
      let correctIndices = [];
      if (questionDraft.allowMultipleCorrect) {
        correctIndices = pairs
          .map((item, index) => ({ index, isCorrect: (questionDraft.correctIndices || []).includes(item.rawIndex) }))
          .filter((item) => item.isCorrect)
          .map((item) => item.index);
      } else {
        const selectedCorrectIndex = questionDraft.correctIndices[0];
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
        optionsRich: questionDraft.optionsRich,
        correctIndices,
        explanation: questionDraft.explanation.trim() || undefined,
      };
    }

    if (questionDraft.type === 'TRUE_FALSE') {
      return {
        ...base,
        correctAnswer: questionDraft.correctAnswer,
        explanation: questionDraft.explanation.trim() || undefined,
      };
    }

    if (questionDraft.type === 'SHORT_ANSWER') {
      const acceptedAnswers = questionDraft.acceptedAnswersText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!acceptedAnswers.length) {
        throw new Error('Câu trả lời ngắn cần ít nhất 1 đáp án chấp nhận.');
      }

      return {
        ...base,
        acceptedAnswers,
        caseSensitive: questionDraft.caseSensitive,
        fuzzyMatch: questionDraft.fuzzyMatch,
        explanation: questionDraft.explanation.trim() || undefined,
      };
    }

    if (questionDraft.type === 'CLOZE') {
      const metadata = questionDraft.metadata && typeof questionDraft.metadata === 'object'
        ? questionDraft.metadata
        : { text_template: questionDraft.content, inner_questions: {} };

      if (!String(metadata.text_template || '').trim()) {
        throw new Error('Câu hỏi bài đọc cần có text_template hợp lệ.');
      }

      return {
        ...base,
        metadata,
        content: String(metadata.text_template || questionDraft.content),
      };
    }

    const rubric = questionDraft.rubric
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
  instructions: questionDraft.instructions.trim(),
  rubric,
  wordLimit: {
    min: Number(questionDraft.wordLimitMin),
    max: Number(questionDraft.wordLimitMax),
  },
  aiModel: questionDraft.aiModel,
  gradingMethod: questionDraft.gradingMethod || 'ai',
};
  };

  const buildNormalQuestionPayloadFromInner = (innerQuestion, parentQuestionId, orderIndex) => {
    const normalizedInnerType = innerQuestion.type === 'MULTICHOICE'
      ? 'MULTIPLE_CHOICE'
      : innerQuestion.type;

    const base = {
      type: normalizedInnerType,
      content: String(innerQuestion.content || '').trim() || String(questionDraft.content || '').trim(),
      contentBlocks: Array.isArray(innerQuestion.contentBlocks) ? innerQuestion.contentBlocks : createEmptyRichBlocks(),
      courseId: Number(courseId),
      chapterId: Number(chapterId),
      lectureId: Number(lessonId),
      segmentId: Number(segmentId),
      parentQuestionId,
      orderIndex,
      isPublished: Boolean(innerQuestion.isPublished),
    };

    if (normalizedInnerType === 'MULTIPLE_CHOICE') {
      const optionsRich = Array.isArray(innerQuestion.optionsRich) ? innerQuestion.optionsRich : [];
      const options = optionsRich.length
        ? (optionsRich.map((blocks, index) => {
            const normalized = normalizeRichBlocksValue(blocks);
            const text = richContentToPlainText(normalized) || String(innerQuestion.options?.[index] || '').trim();
            return { blocks: normalized, value: text };
          }).filter((it) => (Array.isArray(it.blocks) && it.blocks.length) || String(it.value || '').trim() !== '').map((it) => it.value || ''))
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
};
    }

    return base;
  };

  const handleSaveQuestion = async () => {
    try {
      const payload = buildQuestionPayload();

      if (questionEditingId) {
        await updateQuestionApi(questionEditingId, payload);
      } else {
        await createQuestionApi(payload);
      }

      setQuestionModalOpen(false);
      setQuestionEditingId(null);
      setQuestionDraft(createEmptyQuestionDraft());
      await loadQuestions();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Không thể lưu câu hỏi.');
    }
  };

  const addOption = () => {
    setQuestionDraft((prev) => ({
      ...prev,
      options: [...(prev.options || []), ''],
      optionsRich: [...(prev.optionsRich || []), createEmptyRichBlocks()],
    }));
  };

  const removeOption = (index) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đáp án này?')) return;
    setQuestionDraft((prev) => {
      const nextOptions = [...(prev.options || [])];
      const nextRich = [...(prev.optionsRich || [])];
      if (nextOptions.length <= 2) return prev; // keep at least 2
      nextOptions.splice(index, 1);
      nextRich.splice(index, 1);

      // adjust correctIndices
      const nextCorrect = (prev.correctIndices || []).map((i) => (i > index ? i - 1 : i)).filter((i) => i >= 0 && i < nextOptions.length);
      if (!nextCorrect.length && nextOptions.length) nextCorrect.push(0);

      return { ...prev, options: nextOptions, optionsRich: nextRich, correctIndices: nextCorrect };
    });
  };

  const toggleCorrectIndex = (index) => {
    setQuestionDraft((prev) => {
      if (prev.allowMultipleCorrect) {
        const next = new Set(prev.correctIndices || []);
        if (next.has(index)) next.delete(index); else next.add(index);
        const arr = Array.from(next).sort((a, b) => a - b);
        return { ...prev, correctIndices: arr.length ? arr : [0] };
      }
      return { ...prev, correctIndices: [index] };
    });
  };

  const renderQuestionTypeSpecificForm = () => (
    <QuestionTypeFields draft={questionDraft} setDraft={setQuestionDraft} />
  );

  // Handle upload file
  const handleUploadFile = async (index) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
        setUploadMessage('');

        try {
          const response = await uploadTeacherFileApi(file);
          const fileUrl = response.data?.data?.fileUrl || '';

          handleUpdateContentItem(index, 'resourceUrl', fileUrl);
          setUploadMessage('✅ Upload thành công');
          setTimeout(() => setUploadMessage(''), 2000);
        } catch (uploadErr) {
          setUploadMessage('❌ Upload thất bại');
          console.error('Upload error:', uploadErr);
        } finally {
          setUploadingIndex(null);
        }
      };
      input.click();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage('❌ Lỗi');
    }
  };

  const buildSegmentSaveData = () => ({
    title: segment?.title,
    orderIndex: segment?.orderIndex,
    contentItems: mergeQuestionContentItem(contentItems, fixedQuestionItem).map((item, idx) => normalizeContentItemForPayload(item, idx)),
  });

  const persistSegmentChanges = async ({ successMessage = '✅ Lưu thành công!', shouldNavigate = true } = {}) => {
    if (!segment) return;

    try {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      // If another save is currently in-flight, wait briefly for it to finish
      const waitForSave = async (timeoutMs = 10000) => {
        const start = Date.now();
        while (saveInFlightRef.current) {
          if (Date.now() - start > timeoutMs) break;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 100));
        }
      };

      await waitForSave(10000);

      setIsSaving(true);
      saveInFlightRef.current = true;

      await updateLessonSegmentApi(segmentId, buildSegmentSaveData());

      alert(successMessage);

      if (shouldNavigate) {
        navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi lưu');
      console.error('Save error:', err);
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handleSaveQuizItem = async () => {
    const quizItem = contentItems[currentItemIndex];

    if (!quizItem || quizItem.type !== 'quiz') {
      alert('Vui lòng chọn đúng nội dung bài tập để lưu.');
      return;
    }

    if (quizItem.randomize) {
      if (Number(quizItem.randomCount || 0) < 1 && (!Array.isArray(quizItem.questionIds) || quizItem.questionIds.length === 0)) {
        alert('Hãy nhập số câu random hợp lệ trước khi lưu bài tập.');
        return;
      }
    } else if (!Array.isArray(quizItem.questionIds) || quizItem.questionIds.length === 0) {
      alert('Hãy chọn ít nhất một câu hỏi trước khi lưu bài tập.');
      return;
    }

    await persistSegmentChanges({
      successMessage: '✅ Đã lưu bài tập thành công!',
      shouldNavigate: false,
    });
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    await persistSegmentChanges({
      successMessage: '✅ Lưu thành công!',
      shouldNavigate: true,
    });
  };

  // Back button
  const handleGoBack = () => {
    navigate(`/teacher/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  };

  const handleOpenQuestionManager = () => {
    // Navigate to the course-level question bank with filters for this chapter/lesson/segment
    const qs = new URLSearchParams();
    if (chapterId) qs.set('chapterId', String(chapterId));
    if (lessonId) qs.set('lectureId', String(lessonId));
    if (segmentId) qs.set('segmentId', String(segmentId));
    navigate(`/teacher/courses/${courseId}/question-bank?${qs.toString()}`);
  };

  // Navigation giữa các items
  const currentItem = contentItems[currentItemIndex];
  const fixedQuestionContentItem = contentItems.find((item) => item.type === 'question') || fixedQuestionItem;
  const visibleContentItems = contentItems.filter((item) => item.type !== 'question');
  const currentVisibleIndex = currentItem?.type === 'question' ? -1 : Math.max(0, currentItemIndex - 1);
  const meta = SEGMENT_CONTENT_META[currentItem?.type] || SEGMENT_CONTENT_META.text;
  const isCurrentQuizReadyToSave = currentItem?.type === 'quiz' && (
    (Array.isArray(currentItem.questionIds) && currentItem.questionIds.length > 0)
    || Number(currentItem.randomCount || 0) > 0
  );

  const handleOpenQuizPreview = () => {
    if (!currentItem?.quizId) return;
    setQuizPreview({
      open: true,
      quizId: Number(currentItem.quizId),
      title: currentItem.title || 'Xem trước bài tập',
    });
  };

  const handleCloseQuizPreview = () => {
    setQuizPreview({ open: false, quizId: null, title: '' });
  };

  return (
    <div className="container-segment-detail">
      <TeacherSidebar />
      <div className="content-segment-detail">
        {/* Breadcrumb */}
        <div className="segment-detail-breadcrumb">
          <button onClick={handleGoBack} className="btn-breadcrumb">
            ← Quay lại
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text">{course?.title}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text">{chapter?.title}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text">{lesson?.title}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-text-active">Phần {segment?.orderIndex}: {segment?.title}</span>
        </div>

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="segment-detail-container">
            {/* Left Panel - Content List */}
            <div className="segment-detail-left">
              {fixedQuestionContentItem ? (
                <div
                  className={`content-list-item ${currentItem?.type === 'question' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentItemIndex(0);
                    setViewQuestion(null);
                  }}
                >
                  <div className="list-item-number">1</div>
                  <div className="list-item-content">
                    <div className="list-item-type">❓ Quản lý câu hỏi</div>
                    <div className="list-item-title">Quản lý câu hỏi</div>
                  </div>
                </div>
              ) : null}

              <div className="content-list-header">
                <h3>Nội dung ({visibleContentItems.length})</h3>
                <div className="add-content-dropdown">
                  <select
                    className="add-content-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddContentItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">+ Thêm nội dung</option>
                    <option value="text">📝 Text</option>
                    <option value="document">📎 Tài liệu</option>
                    <option value="quiz">🧪 Bài tập</option>
                    <option value="videoClip">🎬 Video Clip</option>
                  </select>
                </div>
              </div>

              <div className="content-list">
                {visibleContentItems.map((item, index) => {
                  const actualIndex = index + 1;
                  const itemMeta = SEGMENT_CONTENT_META[item.type] || SEGMENT_CONTENT_META.text;
                  return (
                    <div
                      key={actualIndex}
                      className={`content-list-item ${actualIndex === currentItemIndex ? 'active' : ''}`}
                      onClick={() => setCurrentItemIndex(actualIndex)}
                    >
                      <div className="list-item-number">{actualIndex}</div>
                      <div className="list-item-content">
                        <div className="list-item-type">{itemMeta.icon} {itemMeta.title}</div>
                        <div className="list-item-title">{item.title || 'Chưa đặt tên'}</div>
                      </div>
                      {visibleContentItems.length > 1 && (
                        <button
                          className="btn-delete-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContentItem(actualIndex);
                          }}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Content Editor */}
            <div className="segment-detail-right">
              {currentItem ? (
                <div className="content-editor">
                  <div className="editor-header">
                    <div className="editor-title">
                      <span className="editor-type-badge">{meta.icon} {meta.title}</span>
                      <h2>
                        {currentItem?.type === 'question'
                          ? 'Câu hỏi cố định của phần học'
                          : `Nội dung ${currentVisibleIndex + 1} của ${visibleContentItems.length}`}
                      </h2>
                    </div>
                  </div>

                  <div className="editor-form">
                    {currentItem.type === 'question' ? (
                      <div className="form-group" style={{ padding: 16, background: '#f8fafc', border: '1px dashed #d1d5db', borderRadius: 8 }}>
                        <label style={{ fontWeight: 600 }}>Câu hỏi cố định của phần học</label>
                        <p style={{ margin: '8px 0 12px', color: '#6b7280' }}>Đây là phần câu hỏi cố định của segment. Nội dung câu hỏi được quản lý riêng bên dưới và không thể xóa khỏi phần học này.</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="button" className="btn-save-all" onClick={handleAddQuestion}>
                            Thêm câu hỏi
                          </button>
                        </div>
                      </div>
                    ) : currentItem.type === 'quiz' ? (
                      <div className="form-group" style={{ padding: 16, background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: 12 }}>
                        <label style={{ fontWeight: 700, color: '#4c1d95' }}>Thiết lập bài tập từ ngân hàng câu hỏi</label>
                        <p style={{ margin: '8px 0 12px', color: '#6b7280', lineHeight: 1.5 }}>
                          Bài tập này sẽ lấy câu hỏi từ ngân hàng của đúng phần học đang mở. Bạn có thể chọn từng câu hoặc random số câu.
                        </p>

                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label style={{ fontWeight: 700, color: '#374151' }}>Tên bài tập</label>
                          <input
                            type="text"
                            value={currentItem.title || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'title', e.target.value)}
                            placeholder="Ví dụ: Bài tập phần 1"
                            className="form-input"
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#4c1d95' }}>Ngân hàng câu hỏi</div>
                            <div style={{ marginTop: 4, color: '#5b21b6', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <strong>
                                {Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length
                                  ? `${currentItem.questionTitles.length} câu đã chọn`
                                  : Array.isArray(currentItem.questionIds) && currentItem.questionIds.length
                                    ? `${currentItem.questionIds.length} câu đã chọn`
                                    : 'Chưa chọn câu nào'}
                              </strong>
                              {Number(currentItem.randomCount || 0) > 0 ? (
                                <span style={{ color: '#7c3aed' }}>
                                  Random thêm {Number(currentItem.randomCount || 0)} câu
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={() => setSelectQuestionsModal({ open: true, itemIndex: currentItemIndex })}
                            style={{ background: '#7c3aed' }}
                          >
                            📚 Chọn từ Ngân hàng Câu hỏi
                          </button>
                        </div>

                        <div style={{ marginTop: 14, padding: 12, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#374151' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(currentItem.randomize)}
                              onChange={(event) => {
                                handleUpdateContentItem(currentItemIndex, 'randomize', event.target.checked);
                                if (!event.target.checked) {
                                  handleUpdateContentItem(currentItemIndex, 'randomCount', 0);
                                }
                              }}
                            />
                            Random câu hỏi
                          </label>
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#6b7280' }}>Số câu:</span>
                            <input
                              type="number"
                              min="1"
                              disabled={!currentItem.randomize}
                              value={currentItem.randomCount || ''}
                              onChange={(e) => handleUpdateContentItem(currentItemIndex, 'randomCount', e.target.value)}
                              className="form-input"
                              style={{ width: 120 }}
                            />
                          </div>
                          {Number(currentItem.randomCount || 0) > ((Array.isArray(currentItem.questionIds) && currentItem.questionIds.length) || (Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length) || 0) ? (
                            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', fontSize: 13, fontWeight: 600 }}>
                              Số câu random đang lớn hơn số câu đã chọn. Hãy cân nhắc giảm số random hoặc thêm thêm câu đã chọn để bài tập cân bằng hơn.
                            </div>
                          ) : null}
                        </div>

                        {(Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length) || (Array.isArray(currentItem.questionIds) && currentItem.questionIds.length) ? (
                          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#111827' }}>Câu hỏi đã chọn</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {(Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length ? currentItem.questionTitles : currentItem.questionIds).map((questionValue, questionIndex) => {
                                const previewBlocks = Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length ? normalizePreviewBlocks(questionValue) : [];
                                return (
                                  <span key={`${questionValue}-${questionIndex}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, padding: '6px 10px', borderRadius: 999, background: '#ede9fe', color: '#5b21b6', fontWeight: 700, fontSize: 13, maxWidth: '100%', overflow: 'hidden' }}>
                                    {Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length && previewBlocks.some((block) => block.type === 'image' || block.type === 'video') ? (
                                      <RichContentRenderer blocks={previewBlocks} />
                                    ) : (
                                      Array.isArray(currentItem.questionTitles) && currentItem.questionTitles.length ? questionValue : `Câu #${questionValue}`
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {Number(currentItem.randomCount || 0) > 0 ? (
                          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#6b21a8' }}>Câu hỏi random thêm</div>
                            <div style={{ color: '#7c3aed', fontWeight: 700 }}>
                              Sẽ lấy ngẫu nhiên {Number(currentItem.randomCount || 0)} câu từ bộ lọc hiện tại.
                            </div>
                          </div>
                        ) : null}

                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={handleOpenQuizPreview}
                            disabled={!currentItem?.quizId}
                            style={{
                              background: '#2563eb',
                              opacity: currentItem?.quizId ? 1 : 0.6,
                            }}
                          >
                            👁️ Xem trước bài tập
                          </button>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={handleSaveQuizItem}
                            disabled={!isCurrentQuizReadyToSave || isSaving}
                            style={{
                              background: isCurrentQuizReadyToSave ? '#7c3aed' : '#c4b5fd',
                              opacity: isCurrentQuizReadyToSave && !isSaving ? 1 : 0.7,
                              cursor: isCurrentQuizReadyToSave && !isSaving ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isSaving ? 'Đang lưu...' : '💾 Lưu bài tập'}
                          </button>
                        </div>

                        {quizPreview.open && quizPreview.quizId ? (
                          <div
                            style={{
                              position: 'fixed',
                              inset: 0,
                              zIndex: 2000,
                              background: 'rgba(15, 23, 42, 0.72)',
                              display: 'flex',
                              alignItems: 'stretch',
                              justifyContent: 'stretch',
                            }}
                          >
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                background: '#f8fafc',
                                overflow: 'hidden',
                              }}
                            >
                              <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                                <button
                                  type="button"
                                  onClick={handleCloseQuizPreview}
                                  style={{
                                    border: 'none',
                                    background: '#111827',
                                    color: 'white',
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                                  }}
                                >
                                  Đóng
                                </button>
                              </div>
                              <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                                <QuizTaker
                                  quizId={quizPreview.quizId}
                                  previewMode
                                  onBack={handleCloseQuizPreview}
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>Tiêu đề *</label>
                          <input
                            type="text"
                            value={currentItem.title}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'title', e.target.value)}
                            placeholder="Nhập tiêu đề"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Nội dung *</label>
                          <RichContentEditor
                            title=""
                            helperText="Dùng thanh công cụ để thêm chữ, ảnh, video, liên kết và định dạng HTML như ở phần câu hỏi."
                            value={Array.isArray(currentItem.contentBlocks) && currentItem.contentBlocks.length
                              ? currentItem.contentBlocks
                              : (currentItem.content ? [{ type: 'text', text: currentItem.content }] : createEmptyRichBlocks())}
                            onChange={(nextBlocks) => {
                              const htmlText = (nextBlocks || [])
                                .filter((block) => block?.type === 'text')
                                .map((block) => String(block?.text || ''))
                                .join('')
                                .trim();

                              handleUpdateContentItem(currentItemIndex, 'contentBlocks', nextBlocks);
                              handleUpdateContentItem(currentItemIndex, 'content', htmlText || richContentToPlainText(nextBlocks));
                            }}
                          />
                        </div>
                      </>
                    )}

                    {(currentItem.type === 'document' || currentItem.type === 'videoClip') && (
                      <div className="form-group">
                        <label>
                          URL Tài Nguyên {currentItem.type === 'videoClip' ? '(YouTube)' : ''}
                        </label>
                        <div className="resource-input-group">
                          <input
                            type="text"
                            value={currentItem.resourceUrl || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'resourceUrl', e.target.value)}
                            placeholder={currentItem.type === 'videoClip' ? 'https://youtube.com/...' : 'https://...'}
                            className="form-input"
                          />
                          <button
                            className="btn-upload"
                            onClick={() => handleUploadFile(currentItemIndex)}
                            disabled={uploadingIndex === currentItemIndex}
                          >
                            {uploadingIndex === currentItemIndex ? '⏳ Uploading...' : '📤 Upload'}
                          </button>
                        </div>
                        {uploadMessage && (
                          <div className="upload-message">{uploadMessage}</div>
                        )}
                      </div>
                    )}

                    {currentItem.type === 'videoClip' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Bắt đầu (giây)</label>
                          <input
                            type="number"
                            min="0"
                            value={currentItem.startTime || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'startTime', e.target.value)}
                            placeholder="0"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Kết thúc (giây)</label>
                          <input
                            type="number"
                            min="1"
                            value={currentItem.endTime || ''}
                            onChange={(e) => handleUpdateContentItem(currentItemIndex, 'endTime', e.target.value)}
                            placeholder="30"
                            className="form-input"
                          />
                        </div>
                      </div>
                    )}

                    {currentItem.type === 'question' && (
                      <div className="question-bank-inline">
                        <div className="question-bank-inline-header">
                          <div>
                            <h3>Câu hỏi của phần này</h3>
                            <p>Quản lý câu hỏi thuộc đúng khóa học, bài giảng và phần bài giảng đang mở.</p>
                          </div>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={handleAddQuestion}
                          >
                            + Thêm câu hỏi
                          </button>
                        </div>

                        {questionError ? <div className="error-message" style={{ marginTop: 12 }}>{questionError}</div> : null}
                        {questionLoading ? <p style={{ marginTop: 12 }}>Đang tải câu hỏi...</p> : null}

                        {!questionLoading && !questions.length ? (
                          <div className="question-bank-list" style={{ marginTop: 16 }}>
                            <p>Chưa có câu hỏi nào cho nội dung này.</p>
                          </div>
                        ) : (
                          <div className="question-bank-list" style={{ marginTop: 16 }}>
                            {questions.map((question, index) => {
                              const metadata = parseJson(question.metadata, {});
                              const type = question.type || 'MULTIPLE_CHOICE';
                              const isExpanded = expandedQuestionId === question.id;
                              const questionBlocks = normalizeRichBlocksValue(question.contentBlocks || metadata.contentBlocks || metadata.blocks || metadata.richContent?.blocks || question.content || question.questionText);

                              let answerPreview = 'Chưa thiết lập';
                              if (type === 'MULTIPLE_CHOICE') {
                                answerPreview = `Đáp án đúng: ${(metadata.correctIndices || []).map((answerIndex) => String.fromCharCode(65 + Number(answerIndex))).join(', ')}`;
                              } else if (type === 'TRUE_FALSE') {
                                answerPreview = `Đáp án đúng: ${metadata.correctAnswer ? 'Đúng' : 'Sai'}`;
                              } else if (type === 'SHORT_ANSWER') {
                                answerPreview = `Chấp nhận: ${(metadata.acceptedAnswers || []).join(' | ')}`;
                              } else if (type === 'ESSAY') {
                                answerPreview = `Mục đánh giá: ${(metadata.rubric || []).length}`;
                              }

                              return (
                                <article key={question.id} className="question-bank-card-item">
                                  <div className="question-bank-card-head">
                                    <div>
                                      <div className="question-bank-card-title-row">
                                        <span className="question-bank-type-badge">{QUESTION_TYPE_LABELS[type] || type}</span>
                                        <h4>{index + 1}. {question.content || question.questionText || 'Không có nội dung'}</h4>
                                      </div>
                                      {questionBlocks.length > 0 ? (
                                        <div style={{ marginTop: 8, maxWidth: '100%' }}>
                                          <RichContentRenderer blocks={questionBlocks} />
                                        </div>
                                      ) : null}
                                      <p className="question-bank-card-preview">{answerPreview}</p>
                                    </div>
                                    <div className="question-bank-card-actions">
  <button
    type="button"
    className="btn-prev-item"
    onClick={() => {
      setViewQuestion(question);
    }}
  >
    Xem chi tiết
  </button>

  <button
    type="button"
    className="btn-save-all"
    onClick={() => startEditQuestion(question.id)}
  >
    Sửa
  </button>

  <button
    type="button"
    className="btn-delete-item"
    onClick={() => handleDeleteQuestion(question.id)}
  >
    Xóa
  </button>
</div>
                                  </div>

                                  {isExpanded ? (
                                    <div className="question-bank-card-body">
                                      {metadata.explanation ? <p><strong>Giải thích:</strong> {metadata.explanation}</p> : null}
                                      {type === 'SHORT_ANSWER' ? (
                                        <p><strong>Đáp án chấp nhận:</strong> {(metadata.acceptedAnswers || []).join(' | ')}</p>
                                      ) : null}
                                      {type === 'ESSAY' ? (
                                        <p><strong>Rubric:</strong> {(metadata.rubric || []).map((item) => item.name).join(', ') || 'Chưa có'}</p>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {viewQuestion && Number(viewQuestion.id) === Number(question.id) ? (
                                    <div ref={viewQuestionPanelRef} style={{ marginTop: 16 }}>
                                      <QuestionDetailModal
                                        question={viewQuestion}
                                        onClose={() => setViewQuestion(null)}
                                      />
                                    </div>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <QuestionFormModal
                    isOpen={questionModalOpen}
                    draft={questionDraft}
                    onDraftChange={setQuestionDraft}
                    onConfirm={handleSaveQuestion}
                    onCancel={() => {
                      setQuestionModalOpen(false);
                      setQuestionEditingId(null);
                      setQuestionDraft(createEmptyQuestionDraft());
                    }}
                    renderTypeSpecificForm={renderQuestionTypeSpecificForm}
                    chapterId={chapterId}
                    lectureId={lessonId}
                    segmentId={segmentId}
                    chapterTitle={chapter?.title}
                    lectureTitle={lesson?.title}
                    segmentTitle={segment?.title}
                    mode={questionEditingId ? 'edit' : 'create'}
                  />

                  <SelectQuestionsModal
                    isOpen={selectQuestionsModal.open}
                    filters={{
                      courseId: Number(courseId),
                      chapterId: Number(chapterId),
                      lectureId: Number(lessonId),
                      segmentId: Number(segmentId),
                    }}
                    initial={selectQuestionsModal.itemIndex != null ? (contentItems[selectQuestionsModal.itemIndex]?.questionIds || []) : []}
                    initialRandomCount={selectQuestionsModal.itemIndex != null ? Number(contentItems[selectQuestionsModal.itemIndex]?.randomCount || 0) : 0}
                    onClose={() => setSelectQuestionsModal({ open: false, itemIndex: null })}
                    onConfirm={(data) => {
                      const idx = selectQuestionsModal.itemIndex;
                      if (idx == null) return;

                      setContentItems((prev) =>
                        prev.map((item, i) => {
                          if (i !== idx) return item;

                          const selectedIds = Array.isArray(data.questionIds) ? data.questionIds : [];
                          const randCount = Number(data.randomCount || 0);
                          const hasRandom = randCount > 0;

                          return {
                            ...item,
                            questionIds: selectedIds,
                            questionTitles: Array.isArray(data.questionTitles) ? data.questionTitles : selectedIds.map((id) => `Câu #${id}`),
                            randomize: hasRandom,
                            randomCount: hasRandom ? randCount : 0,
                          };
                        })
                      );
                      setSelectQuestionsModal({ open: false, itemIndex: null });
                    }}
                  />

                  {/* Navigation giữa items */}
                  <div className="editor-navigation">
                    <button
                      className="btn-prev-item"
                      onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                      disabled={currentItemIndex === 0}
                    >
                      ← Trước
                    </button>
                    <div className="item-counter">
                      {currentItemIndex + 1} / {contentItems.length}
                    </div>
                    <button
                      className="btn-next-item"
                      onClick={() => setCurrentItemIndex(Math.min(contentItems.length - 1, currentItemIndex + 1))}
                      disabled={currentItemIndex === contentItems.length - 1}
                    >
                      Tiếp →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-content">Chưa có nội dung</div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="segment-detail-footer">
          <div className="segment-save-status">
            {saveStatus || 'Mọi thay đổi sẽ được đồng bộ xuống backend để học sinh xem.'}
          </div>
          <button
            className="btn-cancel"
            onClick={handleGoBack}
            disabled={isSaving}
          >
            Hủy
          </button>
          <button
            className="btn-save-all"
            onClick={handleSaveChanges}
            disabled={isSaving || loading}
          >
            {isSaving ? '⏳ Đang lưu...' : '💾 Lưu Tất Cả'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SegmentDetailView;
