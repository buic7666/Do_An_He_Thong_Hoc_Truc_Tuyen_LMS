const fs = require('fs');

// Read the backup file which was encoded in utf16le by PowerShell
let content = fs.readFileSync('frontend/src/screens/GiangVien/ManHinhQuanLyNganHangCauhoi_backup.jsx', 'utf16le');

// Remove duplicate bankDetail definitions
const start = content.indexOf('const bankDetailParseJson');
const end = content.indexOf('const bankEditFirstNonEmptyArray');
if (start !== -1 && end !== -1) {
    content = content.substring(0, start) + content.substring(end);
}

// Add imports
const importsToAdd = `
import QuestionBankTab from '../../components/TeacherQuestionBank/QuestionBankTab';
import QuizManagerTab from '../../components/TeacherQuizManager/QuizManagerTab';
import { bankDetailParseJson, bankDetailNormalizeType, bankDetailNormalizeBlocks, bankDetailBlocksToText, bankDetailNormalizeIndex, bankDetailGetCorrectIndices, bankDetailGetOptions } from '../../components/TeacherQuestionBank/QuestionDetailPanel';
`;

content = content.replace("import './ManHinhQuanLyNganHangCauhoi.css';", "import './ManHinhQuanLyNganHangCauhoi.css';" + importsToAdd);

// Find the start of the return statement
const mainStart = content.indexOf('<main className="instructor-question-bank-main-content"');
const mainEnd = content.lastIndexOf('</main>') + 7;

const newMainContent = `
      <main className="instructor-question-bank-main-content" style={embedded ? { marginLeft: 0, padding: 0 } : undefined}>
        <header className="instructor-question-bank-page-header">
          <h1 className="instructor-question-bank-page-title">Quản lý Ngân hàng Câu hỏi</h1>
          {isCourseScopedView && !embedded ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="instructor-question-bank-btn instructor-question-bank-btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => navigate(\`/teacher/courses/\${selectedCourseId}/chapters\`)}
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
`;

content = content.substring(0, mainStart) + newMainContent + content.substring(mainEnd);

// Also remove QuestionFullAnswerDetail
const detailFuncStart = content.indexOf('const QuestionFullAnswerDetail');
if (detailFuncStart !== -1) {
  const mainFuncStart = content.indexOf('function ManHinhQuanLyNganHangCauhoi');
  if (mainFuncStart !== -1) {
    content = content.substring(0, detailFuncStart) + content.substring(mainFuncStart);
  }
}

// Write it as UTF-8
fs.writeFileSync('frontend/src/screens/GiangVien/ManHinhQuanLyNganHangCauhoi.jsx', content, 'utf-8');
console.log('Successfully recovered and refactored from backup');
