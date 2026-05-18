# Quiz Feature Integration Guide

## Overview
This guide explains how to integrate the quiz/test feature into your learning management system.

---

## Components Created

### 1. **QuizTaker** (`frontend/src/components/QuizTaker.jsx`)
The main component for students to take quizzes.

**Features:**
- Display quiz questions one by one
- Auto-save answers every 30 seconds
- Timer countdown with warning/danger states
- Question navigation with visual feedback
- Submit functionality
- Result display with score and pass/fail status

**Props:**
```javascript
<QuizTaker
  quizId={1}                          // ID of the quiz to take
  onBack={() => {}}                   // Callback when returning from quiz
  onSubmit={(result) => {}}           // Callback after quiz submission
/>
```

---

### 2. **QuizList** (`frontend/src/components/QuizList.jsx`)
Displays all available quizzes for a course.

**Features:**
- List all quizzes in a grid layout
- Show quiz metadata (duration, question count, pass score)
- Display student's best score if already taken
- Show pass/fail status with visual indicators
- Allow starting new attempts

**Props:**
```javascript
<QuizList
  courseId={18}                       // ID of the course
  onSelectQuiz={(quizId) => {}}       // Callback when student selects a quiz
/>
```

---

## Integration Steps

### Step 1: Import Components in Course Detail Page

**File:** `frontend/src/screens/Hocsinh/ManHinhChiTietKhoa.jsx` (or similar)

```javascript
import QuizList from '../../components/QuizList';
import QuizTaker from '../../components/QuizTaker';
```

---

### Step 2: Add State for Quiz Selection

```javascript
const [selectedQuizId, setSelectedQuizId] = useState(null);

// Add handlers
const handleQuizSelect = (quizId) => {
  setSelectedQuizId(quizId);
};

const handleQuizBack = () => {
  setSelectedQuizId(null);
};

const handleQuizSubmit = (result) => {
  console.log('Quiz submitted:', result);
  setSelectedQuizId(null);
  // Optional: Show success message or update course progress
};
```

---

### Step 3: Add Quiz Section to Course Page

```javascript
// In the course detail JSX, add a tab or section for quizzes:

{/* Lesson Tabs */}
<div className="course-tabs">
  <button 
    className={activeTab === 'lessons' ? 'active' : ''} 
    onClick={() => setActiveTab('lessons')}
  >
    📚 Bài Học
  </button>
  <button 
    className={activeTab === 'quizzes' ? 'active' : ''} 
    onClick={() => setActiveTab('quizzes')}
  >
    📝 Bài Kiểm Tra
  </button>
</div>

{/* Tab Content */}
{activeTab === 'lessons' && (
  <div className="lessons-section">
    {/* Your existing lessons content */}
  </div>
)}

{activeTab === 'quizzes' && (
  <div className="quizzes-section">
    {selectedQuizId ? (
      <QuizTaker
        quizId={selectedQuizId}
        onBack={handleQuizBack}
        onSubmit={handleQuizSubmit}
      />
    ) : (
      <QuizList
        courseId={courseId}
        onSelectQuiz={handleQuizSelect}
      />
    )}
  </div>
)}
```

---

### Step 4: Add Quiz Progress to Student Dashboard

**File:** `frontend/src/screens/Hocsinh/DashboardHocSinh.jsx`

```javascript
import axios from 'axios';

// Fetch quiz information for dashboard
const loadQuizProgress = async (courseId) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}/quizzes`);
    const quizzes = response.data.data;
    
    // For each quiz, get the student's best score
    const quizProgress = await Promise.all(
      quizzes.map(async (quiz) => {
        const scoreResponse = await axios.get(`/api/quizzes/${quiz.id}/score`);
        return {
          ...quiz,
          studentScore: scoreResponse.data.data?.totalScore,
          isPassed: scoreResponse.data.data?.isPassed,
        };
      })
    );
    
    return quizProgress;
  } catch (error) {
    console.error('Failed to load quiz progress:', error);
    return [];
  }
};

// Display in dashboard
const QuizProgressCard = ({ course, quizzes }) => (
  <div className="quiz-progress-card">
    <h3>📝 Bài Kiểm Tra</h3>
    <div className="quiz-stats">
      <div className="stat">
        <span className="label">Tổng bài kiểm tra:</span>
        <span className="value">{quizzes.length}</span>
      </div>
      <div className="stat">
        <span className="label">Đã hoàn thành:</span>
        <span className="value">
          {quizzes.filter(q => q.studentScore).length}
        </span>
      </div>
      <div className="stat">
        <span className="label">Đã đạt:</span>
        <span className="value">
          {quizzes.filter(q => q.isPassed).length}
        </span>
      </div>
    </div>
  </div>
);
```

---

## API Integration Reference

### Fetching Quizzes for a Course
```javascript
const getQuizzes = async (courseId) => {
  const response = await axios.get(`/api/courses/${courseId}/quizzes`);
  return response.data.data;
};
```

### Getting Quiz Details
```javascript
const getQuizDetail = async (quizId) => {
  const response = await axios.get(`/api/quizzes/${quizId}`);
  return response.data.data;
};
```

### Starting a Quiz
```javascript
const startQuiz = async (quizId) => {
  const response = await axios.post(`/api/quizzes/${quizId}/start`);
  return response.data.data;
};
```

### Submitting Answers
```javascript
const submitQuiz = async (quizId, answers) => {
  const response = await axios.post(`/api/quizzes/${quizId}/submit`, {
    answers: answers,
  });
  return response.data.data;
};
```

### Getting Student Score
```javascript
const getQuizScore = async (quizId) => {
  const response = await axios.get(`/api/quizzes/${quizId}/score`);
  return response.data.data;
};
```

---

## Styling Integration

The quiz components use CSS modules with these classes:

- `.quiz-list` - Quiz list container
- `.quiz-card` - Individual quiz card
- `.quiz-taker` - Quiz taking interface
- `.quiz-result` - Result display

You can customize the styling by:
1. Modifying the CSS files directly
2. Using CSS variables for theming
3. Overriding with your own global styles

---

## Testing the Feature

### 1. Verify Questions Were Seeded
```bash
npm run seed:quizzes
```

Expected output:
```
✨ ========== SEED HOÀN THÀNH ==========
📊 Tổng questions được tạo: 18
📝 Quiz được tạo: 2 (Flutter, Node.js)
```

### 2. Test Quiz APIs

Using curl or Postman:

**Get quizzes for course 18:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/courses/18/quizzes
```

**Get quiz details:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/quizzes/1
```

**Start quiz attempt:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/quizzes/1/start
```

### 3. Test Frontend Component

```javascript
// In your course detail page, verify:
1. QuizList loads and displays quizzes
2. Clicking a quiz opens QuizTaker
3. Questions display correctly
4. Timer counts down
5. Answers auto-save
6. Submit shows results
7. Score is recorded
```

---

## Database Schema

The quiz system uses these database tables:

### `questions` Table
- `id` - Primary key
- `question_text` - Question content
- `options_json` - JSON array of options
- `correct_index` - Index of correct answer
- `explanation` - Explanation for correct answer
- `difficulty` - 'easy', 'medium', 'hard'
- `created_by` - Teacher ID who created
- `created_at` / `updated_at`

### `quizzes` Table
- `id` - Primary key
- `course_id` - Linked course
- `lesson_id` - Optional: linked lesson
- `title` - Quiz title
- `description` - Quiz description
- `duration` - Time in minutes
- `pass_score` - Percentage needed to pass
- `max_attempts` - Max number of attempts
- `is_published` - Is quiz available to students
- `created_by` - Teacher ID
- `created_at` / `updated_at`

### `quiz_questions` Table
- `id` - Primary key
- `quiz_id` - Quiz foreign key
- `question_id` - Question foreign key
- `order` - Question order in quiz
- `points` - Points for this question
- `created_at` / `updated_at`

### `student_quiz_attempts` Table
- `id` - Primary key
- `quiz_id` - Quiz foreign key
- `student_id` - Student user ID
- `attempt_number` - Attempt number
- `started_at` - When student started
- `submitted_at` - When student submitted
- `total_score` - Score percentage (0-100)
- `is_passed` - Whether they passed
- `answers_json` - JSON of {questionId: selectedIndex}
- `created_at` / `updated_at`

---

## Features for Future Enhancement

### Teacher Side:
- [ ] Create/edit/delete quizzes in course dashboard
- [ ] Add questions to quiz via UI
- [ ] View student scores and analytics
- [ ] Export quiz results

### Student Side:
- [ ] Quiz history with attempt details
- [ ] Review answers after submission
- [ ] Detailed explanations for each question
- [ ] Practice mode (unlimited attempts)
- [ ] Question difficulty filter

### Analytics:
- [ ] Class-wide quiz statistics
- [ ] Question difficulty analysis
- [ ] Student performance trends
- [ ] Question effectiveness metrics

---

## Troubleshooting

### Quiz Not Loading
- Check if `Quiz` and `Question` models are properly defined
- Verify database migrations have run
- Check if quizzes are published (`is_published = true`)

### Answers Not Saving
- Verify auto-save intervals are correct (30 seconds)
- Check network requests in browser DevTools
- Ensure auth token is valid

### Scores Not Calculating
- Verify `correctIndex` matches option array length
- Check that student actually submitted quiz
- Verify `pass_score` configuration

---

## Sample Questions

The seed data includes questions for:
1. **Flutter** (8 questions) - Basic concepts, state management, widgets
2. **Node.js** (8 questions) - Express, async/await, middleware
3. **React** (2 questions) - Hooks, effects

You can view seeded questions in the database or API responses.

---

## Contact & Support

For issues or questions about the quiz feature:
1. Check the API documentation: [QUIZ_API.md](./QUIZ_API.md)
2. Review component JSDoc comments
3. Check console logs for detailed errors
4. Ensure all models are properly imported
