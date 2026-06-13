const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/TeacherQuizManager/QuizDetailModal.jsx', 'utf-8');
content = content.replace("import { QUESTION_TYPE_LABELS } from '../TeacherQuestionBank/QuestionBankTab';\n", "");
fs.writeFileSync('frontend/src/components/TeacherQuizManager/QuizDetailModal.jsx', content);
