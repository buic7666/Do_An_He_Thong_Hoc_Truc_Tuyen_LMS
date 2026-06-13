import React from 'react';
import QuizCreateForm from './QuizCreateForm';
import QuizDetailModal from './QuizDetailModal';
import QuizList from './QuizList';

const QuizManagerTab = ({
  quizDraft,
  setQuizDraft,
  chapters,
  questions,
  editingQuizId,
  quizSelectedQuestionCount,
  quizRandomQuestionCount,
  quizQuestionTotal,
  selectQuizQuestionsModalOpen,
  setSelectQuizQuestionsModalOpen,
  selectedCourseId,
  truncateQuizText,
  handleCreateQuiz,
  resetQuizDraft,
  selectedQuizDetail,
  setSelectedQuizDetail,
  getQuizChapterTitle,
  quizAddQuestionId,
  setQuizAddQuestionId,
  availableQuestionsForQuiz,
  getQuestionTextForQuiz,
  handleAddQuestionToQuiz,
  isLoadingQuizDetail,
  handleRemoveQuestionFromQuiz,
  QUESTION_TYPE_LABELS,
  isLoadingQuizzes,
  visibleQuizzes,
  formatQuizDate,
  loadQuizDetail,
  handleStartEditQuiz,
  handlePublishQuiz,
  handleDeleteQuiz
}) => {
  return (
    <>
      <QuizCreateForm
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
      />

      {selectedQuizDetail ? (
        <QuizDetailModal
          selectedQuizDetail={selectedQuizDetail}
          setSelectedQuizDetail={setSelectedQuizDetail}
          getQuizChapterTitle={getQuizChapterTitle}
          quizAddQuestionId={quizAddQuestionId}
          setQuizAddQuestionId={setQuizAddQuestionId}
          availableQuestionsForQuiz={availableQuestionsForQuiz}
          getQuestionTextForQuiz={getQuestionTextForQuiz}
          truncateQuizText={truncateQuizText}
          handleAddQuestionToQuiz={handleAddQuestionToQuiz}
          isLoadingQuizDetail={isLoadingQuizDetail}
          handleRemoveQuestionFromQuiz={handleRemoveQuestionFromQuiz}
          QUESTION_TYPE_LABELS={QUESTION_TYPE_LABELS}
        />
      ) : null}

      <QuizList
        isLoadingQuizzes={isLoadingQuizzes}
        visibleQuizzes={visibleQuizzes}
        getQuizChapterTitle={getQuizChapterTitle}
        formatQuizDate={formatQuizDate}
        loadQuizDetail={loadQuizDetail}
        handleStartEditQuiz={handleStartEditQuiz}
        handlePublishQuiz={handlePublishQuiz}
        handleDeleteQuiz={handleDeleteQuiz}
      />
    </>
  );
};

export default QuizManagerTab;
