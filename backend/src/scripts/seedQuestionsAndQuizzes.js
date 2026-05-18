const {
  Question,
  Quiz,
  QuizQuestion,
  User,
  Course,
} = require('../models');
const { sequelize } = require('../config/database');

/**
 * Seed script for questions and quizzes
 * Run this script to populate the database with sample questions and quizzes
 * Usage: node src/scripts/seedQuestionsAndQuizzes.js
 */

const flutterQuestions = [
  {
    questionText: 'Trong Flutter, cách tốt nhất để render một danh sách dài mà không gây tràn bộ nhớ là gì?',
    options: ['Sử dụng Column', 'Sử dụng ListView.builder', 'Sử dụng Stack', 'Sử dụng SingleChildScrollView'],
    correctIndex: 1,
    explanation: 'ListView.builder tạo các widget một cách lazy-loaded, chỉ tạo khi hiển thị và recycle khi cuộn ra khỏi viewport.',
    difficulty: 'medium',
  },
  {
    questionText: 'Thư viện nào được sử dụng để quản lý state trong Flutter?',
    options: ['Provider', 'Riverpod', 'GetX', 'Tất cả các câu trên'],
    correctIndex: 3,
    explanation: 'Có nhiều thư viện state management trong Flutter, tùy theo nhu cầu dự án có thể chọn Provider, Riverpod, GetX, Bloc, v.v.',
    difficulty: 'easy',
  },
  {
    questionText: 'Hot Reload trong Flutter hoạt động như thế nào?',
    options: [
      'Khởi động lại ứng dụng từ đầu',
      'Giữ lại trạng thái ứng dụng và inject code mới',
      'Xóa tất cả state và load code mới',
      'Chỉ có thể làm việc với hot restart',
    ],
    correctIndex: 1,
    explanation: 'Hot Reload giữ lại state của ứng dụng khi inject code mới, giúp phát triển nhanh hơn so với hot restart.',
    difficulty: 'medium',
  },
  {
    questionText: 'Widget nào là root widget trong ứng dụng Flutter cơ bản?',
    options: ['Scaffold', 'MaterialApp hoặc CupertinoApp', 'Column', 'Center'],
    correctIndex: 1,
    explanation: 'MaterialApp (Android style) hoặc CupertinoApp (iOS style) phải là root widget để cung cấp MaterialTheme và routing.',
    difficulty: 'easy',
  },
  {
    questionText: 'FutureBuilder trong Flutter dùng để làm gì?',
    options: [
      'Xây dựng UI từ kết quả của một Future',
      'Kiểm tra loại dữ liệu',
      'Tạo danh sách vô hạn',
      'Quản lý theme của ứng dụng',
    ],
    correctIndex: 0,
    explanation: 'FutureBuilder giúp bạn xây dựng UI dựa trên trạng thái của một Future (loading, success, error).',
    difficulty: 'medium',
  },
  {
    questionText: 'Sự khác biệt chính giữa StatelessWidget và StatefulWidget là gì?',
    options: [
      'Không có sự khác biệt',
      'StatelessWidget không thay đổi state, StatefulWidget có thể thay đổi state',
      'StatefulWidget chạy nhanh hơn',
      'StatelessWidget chỉ dùng cho UI tĩnh',
    ],
    correctIndex: 1,
    explanation: 'StatelessWidget là bất biến, không có state nội bộ. StatefulWidget có setState() để cập nhật giao diện khi state thay đổi.',
    difficulty: 'easy',
  },
  {
    questionText: 'Để lưu dữ liệu cục bộ trong Flutter, thư viện nào được sử dụng phổ biến nhất?',
    options: ['SQLite với sqflite', 'Hive', 'SharedPreferences', 'Tất cả các câu trên'],
    correctIndex: 3,
    explanation: 'Tùy vào loại dữ liệu: SharedPreferences cho key-value đơn giản, SQLite/Hive cho dữ liệu phức tạp hơn.',
    difficulty: 'medium',
  },
  {
    questionText: 'Vòng đời (lifecycle) của StatefulWidget có bao nhiêu giai đoạn chính?',
    options: ['2 giai đoạn', '3 giai đoạn', '4 giai đoạn', '5 giai đoạn'],
    correctIndex: 2,
    explanation: 'Ba giai đoạn chính: initState() → build() → dispose(). Có thể coi setState() là part của vòng đời.',
    difficulty: 'hard',
  },
];

const nodeJsQuestions = [
  {
    questionText: 'Thư viện nào phổ biến nhất để mã hóa mật khẩu trong Node.js?',
    options: ['jsonwebtoken', 'passport', 'bcrypt', 'crypto'],
    correctIndex: 2,
    explanation: 'bcrypt là thư viện chuyên biệt để mã hóa mật khẩu với salt, an toàn hơn crypto module cơ bản.',
    difficulty: 'medium',
  },
  {
    questionText: 'npm là viết tắt của gì?',
    options: ['Node Package Manager', 'Node Project Module', 'Node Package Module', 'Network Package Manager'],
    correctIndex: 0,
    explanation: 'npm (Node Package Manager) là trình quản lý gói cho Node.js.',
    difficulty: 'easy',
  },
  {
    questionText: 'Express.js là framework gì?',
    options: ['Frontend framework', 'Backend web framework', 'Database framework', 'Mobile framework'],
    correctIndex: 1,
    explanation: 'Express.js là một framework backend nhẹ cho Node.js để xây dựng web server và API.',
    difficulty: 'easy',
  },
  {
    questionText: 'Callback hell (hay Pyramid of Doom) có thể tránh bằng cách nào?',
    options: ['Sử dụng Promise', 'Sử dụng async/await', 'Sử dụng callback lồng nhau cẩn thận', 'A và B'],
    correctIndex: 3,
    explanation: 'Cả Promise và async/await đều giúp tránh callback hell bằng cách làm code dễ đọc hơn.',
    difficulty: 'medium',
  },
  {
    questionText: 'Sự khác biệt giữa require() và import?',
    options: [
      'Không có sự khác biệt',
      'require() là CommonJS, import là ES6 modules',
      'import nhanh hơn require()',
      'require() là asynchronous',
    ],
    correctIndex: 1,
    explanation: 'require() theo CommonJS specification, import/export là ES6 modules. Node.js hỗ trợ cả hai với điều kiện khác nhau.',
    difficulty: 'medium',
  },
  {
    questionText: 'Buffer trong Node.js dùng để làm gì?',
    options: [
      'Lưu trữ dữ liệu text',
      'Xử lý dữ liệu nhị phân (binary data)',
      'Quản lý bộ nhớ',
      'Tạo server',
    ],
    correctIndex: 1,
    explanation: 'Buffer là object được dùng để xử lý dữ liệu nhị phân trong Node.js, đặc biệt quan trọng khi làm việc với file và stream.',
    difficulty: 'medium',
  },
  {
    questionText: 'Middleware trong Express là gì?',
    options: [
      'Một function xử lý request/response',
      'Một database layer',
      'Một authentication method',
      'Một file type',
    ],
    correctIndex: 0,
    explanation: 'Middleware là function có quyền truy cập request, response, next function. Có thể modify request/response hoặc kết thúc request-response cycle.',
    difficulty: 'medium',
  },
  {
    questionText: 'Event emitter trong Node.js hoạt động dựa trên mô hình nào?',
    options: ['Synchronous', 'Asynchronous', 'Publish-Subscribe', 'Cả B và C'],
    correctIndex: 3,
    explanation: 'EventEmitter dựa trên mô hình Publish-Subscribe (Observer pattern) và xử lý asynchronous bằng callback.',
    difficulty: 'hard',
  },
];

const reactQuestions = [
  {
    questionText: 'React Hook nào được sử dụng để quản lý state trong functional component?',
    options: ['useContext', 'useState', 'useReducer', 'Cả B và C'],
    correctIndex: 3,
    explanation: 'useState là cơ bản nhất, useReducer cho logic phức tạp, cả hai đều dùng để quản lý state.',
    difficulty: 'easy',
  },
  {
    questionText: 'useEffect hook được chạy khi nào?',
    options: [
      'Chỉ sau lần render đầu tiên',
      'Sau mỗi lần render',
      'Tùy vào dependency array',
      'Chỉ khi component unmount',
    ],
    correctIndex: 2,
    explanation: 'Hành vi của useEffect phụ thuộc vào dependency array: không có → mỗi render, rỗng → chỉ mount, [deps] → khi deps thay đổi.',
    difficulty: 'medium',
  },
];

const seedQuestionsAndQuizzes = async () => {
  try {
    console.log('🌱 Bắt đầu seed questions và quizzes...\n');

    // Lấy teacher/admin user (giả sử ID = 2)
    const teacher = await User.findOne({ where: { id: 2 } });
    if (!teacher) {
      console.warn('⚠️  Không tìm thấy user ID 2. Vui lòng tạo user trước.');
      return;
    }

    // Lấy course 18 (Flutter course từ seed trước)
    const flutterCourse = await Course.findOne({ where: { id: 18 } });
    if (!flutterCourse) {
      console.warn('⚠️  Không tìm thấy course 18 (Flutter). Tạo course mới trước.');
      return;
    }

    // ===== SEED FLUTTER QUESTIONS =====
    console.log('📝 Seeding Flutter questions...');
    const flutterQuestionIds = [];

    for (const q of flutterQuestions) {
      const existingQuestion = await Question.findOne({
        where: { questionText: q.questionText },
      });

      if (!existingQuestion) {
        const question = await Question.create({
          questionText: q.questionText,
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          createdBy: teacher.id,
        });
        flutterQuestionIds.push(question.id);
        console.log(`  ✅ Tạo question: "${q.questionText.substring(0, 50)}..."`);
      } else {
        flutterQuestionIds.push(existingQuestion.id);
        console.log(`  ⏭️  Question đã tồn tại: "${q.questionText.substring(0, 50)}..."`);
      }
    }

    // ===== CREATE FLUTTER QUIZ =====
    console.log('\n🎯 Tạo Flutter Quiz...');
    let flutterQuiz = await Quiz.findOne({
      where: { courseId: flutterCourse.id, title: 'Kiểm tra Flutter Cơ Bản' },
    });

    if (!flutterQuiz) {
      flutterQuiz = await Quiz.create({
        courseId: flutterCourse.id,
        title: 'Kiểm tra Flutter Cơ Bản',
        description: 'Bài kiểm tra 8 câu về các khái niệm cơ bản của Flutter',
        duration: 30,
        passScore: 70,
        maxAttempts: 3,
        isPublished: true,
        createdBy: teacher.id,
      });
      console.log(`  ✅ Tạo quiz: "${flutterQuiz.title}"`);
    } else {
      console.log(`  ⏭️  Quiz đã tồn tại: "${flutterQuiz.title}"`);
    }

    // ===== ADD QUESTIONS TO FLUTTER QUIZ =====
    console.log('\n📌 Thêm questions vào Flutter Quiz...');
    for (let i = 0; i < flutterQuestionIds.length; i++) {
      const existingQuizQuestion = await QuizQuestion.findOne({
        where: {
          quizId: flutterQuiz.id,
          questionId: flutterQuestionIds[i],
        },
      });

      if (!existingQuizQuestion) {
        await QuizQuestion.create({
          quizId: flutterQuiz.id,
          questionId: flutterQuestionIds[i],
          order: i + 1,
          points: 1,
        });
        console.log(`  ✅ Thêm question ${i + 1} vào quiz`);
      } else {
        console.log(`  ⏭️  Question ${i + 1} đã có trong quiz`);
      }
    }

    // ===== SEED NODE.JS QUESTIONS =====
    console.log('\n📝 Seeding Node.js questions...');
    const nodeJsQuestionIds = [];

    for (const q of nodeJsQuestions) {
      const existingQuestion = await Question.findOne({
        where: { questionText: q.questionText },
      });

      if (!existingQuestion) {
        const question = await Question.create({
          questionText: q.questionText,
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          createdBy: teacher.id,
        });
        nodeJsQuestionIds.push(question.id);
        console.log(`  ✅ Tạo question: "${q.questionText.substring(0, 50)}..."`);
      } else {
        nodeJsQuestionIds.push(existingQuestion.id);
        console.log(`  ⏭️  Question đã tồn tại: "${q.questionText.substring(0, 50)}..."`);
      }
    }

    // ===== CREATE NODE.JS QUIZ =====
    console.log('\n🎯 Tạo Node.js Quiz...');
    const nodeCourse = await Course.findOne({ where: { id: 13 } });
    
    if (nodeCourse) {
      let nodeJsQuiz = await Quiz.findOne({
        where: { courseId: nodeCourse.id, title: 'Kiểm tra Node.js & Backend' },
      });

      if (!nodeJsQuiz) {
        nodeJsQuiz = await Quiz.create({
          courseId: nodeCourse.id,
          title: 'Kiểm tra Node.js & Backend',
          description: 'Bài kiểm tra 8 câu về Node.js, Express và JavaScript asynchronous',
          duration: 45,
          passScore: 70,
          maxAttempts: 3,
          isPublished: true,
          createdBy: teacher.id,
        });
        console.log(`  ✅ Tạo quiz: "${nodeJsQuiz.title}"`);
      } else {
        console.log(`  ⏭️  Quiz đã tồn tại: "${nodeJsQuiz.title}"`);
      }

      // Add questions to Node.js quiz
      console.log('\n📌 Thêm questions vào Node.js Quiz...');
      for (let i = 0; i < nodeJsQuestionIds.length; i++) {
        const existingQuizQuestion = await QuizQuestion.findOne({
          where: {
            quizId: nodeJsQuiz.id,
            questionId: nodeJsQuestionIds[i],
          },
        });

        if (!existingQuizQuestion) {
          await QuizQuestion.create({
            quizId: nodeJsQuiz.id,
            questionId: nodeJsQuestionIds[i],
            order: i + 1,
            points: 1,
          });
          console.log(`  ✅ Thêm question ${i + 1} vào quiz`);
        } else {
          console.log(`  ⏭️  Question ${i + 1} đã có trong quiz`);
        }
      }
    } else {
      console.warn('⚠️  Không tìm thấy course 13. Bỏ qua Node.js quiz.');
    }

    // ===== CREATE REACT QUIZ =====
    console.log('\n📝 Seeding React questions...');
    const reactQuestionIds = [];

    for (const q of reactQuestions) {
      const existingQuestion = await Question.findOne({
        where: { questionText: q.questionText },
      });

      if (!existingQuestion) {
        const question = await Question.create({
          questionText: q.questionText,
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          createdBy: teacher.id,
        });
        reactQuestionIds.push(question.id);
        console.log(`  ✅ Tạo question: "${q.questionText.substring(0, 50)}..."`);
      } else {
        reactQuestionIds.push(existingQuestion.id);
        console.log(`  ⏭️  Question đã tồn tại: "${q.questionText.substring(0, 50)}..."`);
      }
    }

    console.log('\n✨ ========== SEED HOÀN THÀNH ==========');
    console.log(`📊 Tổng questions được tạo: ${flutterQuestionIds.length + nodeJsQuestionIds.length + reactQuestionIds.length}`);
    console.log(`📝 Quiz được tạo: 2 (Flutter, Node.js)`);
    console.log('✨ ====================================\n');
  } catch (error) {
    console.error('❌ Lỗi seed:', error);
  }
};

// Export để dùng trong npm script
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();

      await seedQuestionsAndQuizzes();

      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seed failed:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = { seedQuestionsAndQuizzes };
