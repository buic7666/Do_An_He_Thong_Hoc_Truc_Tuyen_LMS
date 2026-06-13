import React from 'react';
import RichContentRenderer from '../RichContentRenderer';

export const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CLOZE: 'Câu hỏi bài đọc',
};

export const bankDetailParseJson = (value, fallback = {}) => {
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

export const bankDetailNormalizeType = (value) => {
  const type = String(value || 'MULTIPLE_CHOICE').toUpperCase();
  return type === 'MULTICHOICE' ? 'MULTIPLE_CHOICE' : type;
};

export const bankDetailNormalizeBlocks = (value) => {
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

export const bankDetailBlocksToText = (blocks) => {
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

export const bankDetailNormalizeIndex = (value) => {
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

export const bankDetailGetCorrectIndices = (question, metadata) => {
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

export const bankDetailGetOptions = (question, metadata) => {
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

const QuestionDetailPanel = ({ question }) => {
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
  <div className="question-detail-sub-block">
    <p>
      <strong>Đáp án đúng:</strong>{' '}
      {item?.correctAnswer === false ? 'Sai' : 'Đúng'}
    </p>
  </div>
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
  <div className="question-detail-sub-block">
    <p>
      <strong>Hướng dẫn chấm:</strong>{' '}
      {item?.instructions || 'Chưa có'}
    </p>

    {Array.isArray(item?.rubric) && item.rubric.length ? (
      <div className="question-detail-rubric-list">
        {item.rubric.map((rubricItem, rubricIndex) => (
          <div key={`inner-rubric-${key}-${rubricIndex}`} className="question-detail-rubric-item">
            <strong>{rubricItem.name || `Tiêu chí ${rubricIndex + 1}`}</strong>
            <span>{Number(rubricItem.weight || 0)}%</span>
            <p>{rubricItem.description || 'Chưa có mô tả'}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="question-detail-empty">Chưa có rubric.</p>
    )}
  </div>
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

export default QuestionDetailPanel;
