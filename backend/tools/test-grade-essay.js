const { gradeEssay } = require('../src/services/gradingService');

(async () => {
  try {
    const studentAnswer = { text: 'Đây là một bài viết thử nghiệm để kiểm tra độ dài và điểm số.' };
    const metadata = { grader: 'external', rubric: { maxScore: 100, criteria: [{ name: 'Relevance', weight: 0.5 }, { name: 'Clarity', weight: 0.5 }] } };
    const questionContent = 'Viết về ảnh hưởng của công nghệ tới giáo dục.';

    const res = await gradeEssay(studentAnswer, metadata, questionContent);
    console.log('gradeEssay result:', res);
  } catch (err) {
    console.error('gradeEssay error:', err);
  }
})();
