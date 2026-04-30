/* eslint-disable no-console */
require('dotenv').config();

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
  }

  return data;
};

const login = async (email, password) => {
  const response = await requestJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response?.data?.token;
};

const createQuestion = async (token, payload) => {
  const response = await requestJson(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return response?.data;
};

const run = async () => {
  const teacherToken = await login('admin@lms.local', 'password123');
  const studentToken = await login('student1@lms.local', 'password123');

  if (!teacherToken || !studentToken) {
    throw new Error('Could not login teacher or student');
  }

  const courseId = 18;

  const questionPayloads = [
    {
      type: 'MULTIPLE_CHOICE',
      content: 'HTTP status code nao bieu thi thanh cong?',
      options: ['200', '404', '500', '302'],
      correctIndices: [0],
      explanation: '200 la thanh cong',
      difficulty: 'EASY',
      courseId,
      isPublished: true,
    },
    {
      type: 'TRUE_FALSE',
      content: 'Node.js la runtime JavaScript tren server.',
      correctAnswer: true,
      explanation: 'Dung',
      difficulty: 'EASY',
      courseId,
      isPublished: true,
    },
    {
      type: 'SHORT_ANSWER',
      content: 'Viet day du chu viet tat API la gi?',
      acceptedAnswers: ['Application Programming Interface'],
      caseSensitive: false,
      fuzzyMatch: true,
      difficulty: 'MEDIUM',
      courseId,
      isPublished: true,
    },
    {
      type: 'ESSAY',
      content: 'Phan tich uu va nhuoc diem cua hoc truc tuyen.',
      instructions: 'Viet toi thieu 100 tu.',
      rubric: [
        {
          name: 'Noi dung',
          weight: 40,
          description: 'Dung trong tam va co luan diem.',
        },
        {
          name: 'Lap luan',
          weight: 30,
          description: 'Co dan chung va mach lac.',
        },
        {
          name: 'Ngon ngu',
          weight: 30,
          description: 'Dien dat ro rang va de hieu.',
        },
      ],
      wordLimit: { min: 100, max: 400 },
      aiModel: 'gpt-3.5-turbo',
      difficulty: 'MEDIUM',
      courseId,
      isPublished: true,
    },
  ];

  const questions = [];
  for (const payload of questionPayloads) {
    // eslint-disable-next-line no-await-in-loop
    const question = await createQuestion(teacherToken, payload);
    questions.push(question);
  }

  const quizResponse = await requestJson(`${BASE_URL}/quiz-manager`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      courseId,
      title: `SMOKE QUIZ ${Date.now()}`,
      description: 'Quiz smoke test submit flow',
      duration: 30,
      passScore: 60,
      maxAttempts: 3,
    }),
  });

  const quizId = quizResponse?.data?.id;
  if (!quizId) {
    throw new Error('Quiz create did not return id');
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    // eslint-disable-next-line no-await-in-loop
    await requestJson(`${BASE_URL}/quiz-manager/${quizId}/questions/${question.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ order: index + 1, points: 1 }),
    });
  }

  await requestJson(`${BASE_URL}/quiz-manager/${quizId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });

  const start = await requestJson(`${BASE_URL}/quizzes/${quizId}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  const attemptId = start?.data?.id;
  if (!attemptId) {
    throw new Error('Start quiz did not return attempt id');
  }

  const answers = {};
  for (const q of questions) {
    if (q.type === 'MULTIPLE_CHOICE') {
      answers[String(q.id)] = { type: 'MULTIPLE_CHOICE', value: { indices: [0] } };
      continue;
    }

    if (q.type === 'TRUE_FALSE') {
      answers[String(q.id)] = { type: 'TRUE_FALSE', value: { value: true } };
      continue;
    }

    if (q.type === 'SHORT_ANSWER') {
      answers[String(q.id)] = {
        type: 'SHORT_ANSWER',
        value: { text: 'Application Programming Interface' },
      };
      continue;
    }

    if (q.type === 'ESSAY') {
      answers[String(q.id)] = {
        type: 'ESSAY',
        value: {
          text: 'Hoc truc tuyen co uu diem la linh hoat ve thoi gian va tiet kiem chi phi di lai. Nguoi hoc co the xem lai bai giang nhieu lan de cung co kien thuc. Tuy nhien, hoc truc tuyen cung co nhuoc diem la de mat tap trung neu khong co ky luat. Ngoai ra, viec tuong tac truc tiep voi giang vien va ban hoc co the bi han che. De hoc hieu qua can lap ke hoach, chu dong trao doi va ket hop thuc hanh.',
        },
      };
    }
  }

  const submit = await requestJson(`${BASE_URL}/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ answers }),
  });

  const details = await requestJson(`${BASE_URL}/quizzes/${quizId}/attempts/${attemptId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  console.log('SMOKE_SUBMIT_FLOW_OK');
  console.log(
    JSON.stringify({
      quizId,
      attemptId,
      submitScore: submit?.data?.totalScore,
      submitPassed: submit?.data?.isPassed,
      answerCount: Array.isArray(details?.data?.answers) ? details.data.answers.length : 0,
      answerTypes: Array.isArray(details?.data?.answers)
        ? details.data.answers.map((item) => item.answerType)
        : [],
      essayScore: Array.isArray(details?.data?.answers)
        ? details.data.answers.find((item) => item.answerType === 'ESSAY')?.score
        : null,
    }),
  );
};

run().catch((error) => {
  console.error('SMOKE_SUBMIT_FLOW_FAIL', error.message);
  process.exit(1);
});
