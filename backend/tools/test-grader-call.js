const { callExternalGrader } = require('../src/services/graderService');

(async () => {
  try {
    const payload = {
      requestId: 'test-1',
      student: { id: 123, name: 'Test Student', attemptId: 999 },
      question: { id: 456, content: 'Viết một đoạn văn về ảnh hưởng của công nghệ.' },
      answer: { text: 'Công nghệ đã thay đổi cuộc sống của chúng ta rất nhiều. Nó giúp...' },
      rubric: { maxScore: 100, criteria: [{ name: 'Relevance', weight: 0.5 }, { name: 'Clarity', weight: 0.5 }] },
      mode: 'sync',
    };

    const res = await callExternalGrader(payload);
    console.log('External grader response:', res);
  } catch (err) {
    console.error('Error calling external grader:', err.message || err);
  }
})();
