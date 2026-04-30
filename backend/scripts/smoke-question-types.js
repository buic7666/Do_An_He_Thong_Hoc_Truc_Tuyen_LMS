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

const run = async () => {
  const login = await requestJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'teacher@lms.local',
      password: 'password123',
    }),
  });

  const token = login?.data?.token;
  if (!token) {
    throw new Error('Login did not return token');
  }

  const headers = { Authorization: `Bearer ${token}` };
  const courseId = 18;

  const payloads = [
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
      content: 'Node.js la runtime JavaScript chay tren server.',
      correctAnswer: true,
      explanation: 'Dung',
      difficulty: 'EASY',
      courseId,
      isPublished: false,
    },
    {
      type: 'SHORT_ANSWER',
      content: 'Viet day du chu viet tat API la gi?',
      acceptedAnswers: ['Application Programming Interface'],
      caseSensitive: false,
      fuzzyMatch: true,
      difficulty: 'MEDIUM',
      courseId,
      isPublished: false,
    },
    {
      type: 'ESSAY',
      content: 'Phan tich uu va nhuoc diem cua hoc truc tuyen.',
      instructions: 'Viet toi thieu 120 tu.',
      rubric: [
        {
          name: 'Noi dung',
          weight: 40,
          description: 'Dung trong tam, co luan diem ro rang.',
        },
        {
          name: 'Lap luan',
          weight: 30,
          description: 'Lap luan mach lac, co dan chung hop ly.',
        },
        {
          name: 'Ngon ngu',
          weight: 30,
          description: 'Dien dat ro rang, dung chinh ta co ban.',
        },
      ],
      wordLimit: { min: 120, max: 400 },
      aiModel: 'gpt-3.5-turbo',
      difficulty: 'MEDIUM',
      courseId,
      isPublished: false,
    },
  ];

  const created = [];
  for (const payload of payloads) {
    const response = await requestJson(`${BASE_URL}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    created.push({ id: response.data.id, type: response.data.type });
  }

  console.log('SMOKE_OK');
  console.log(JSON.stringify(created));
};

run().catch((error) => {
  console.error('SMOKE_FAIL', error.message);
  process.exit(1);
});
