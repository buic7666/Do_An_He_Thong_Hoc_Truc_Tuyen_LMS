const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Course, Lesson, Enrollment } = require('../models');

const COURSE_VARIANTS = [
  {
    title: 'Khóa học flutter cơ bản',
    description: 'Khoa hoc mau de test video ngan, chuyen bai nhanh, resume va auto-save.',
    price: 129000,
    lessons: [
      {
        title: 'Bài 1 : Tại sao lại chọn lập trình mobie app với Flutter?',
        videoUrl: 'https://youtu.be/ZTbPz2i2Dms?si=3luJAGdrjUkZ1y13',
        content: 'Lý do thứ 1: Đa nền tảng - Flutter cho phép bạn phát triển ứng dụng cho cả iOS và Android từ một codebase duy nhất, giúp tiết kiệm thời gian và công sức.',
      },
      {
        title: 'Bài 2 - Những tài liệu, trang web quan trọng giúp bạn tự học Flutter',
        videoUrl: 'https://youtu.be/wiTg7KJlieY?si=r2mQmdPZLABv5Pbx',
        content: 'những tài liệu, trang web quan trọng giúp bạn tự học Flutter: Trang chủ Flutter (flutter.dev), Cộng đồng Flutter trên Stack Overflow, Các khóa học trực tuyến trên Udemy và Coursera, và các kênh YouTube như The Net Ninja và Academind.',
      },
      {
        title: 'Bài 3 - Cài đặt Flutter SDK & setup biến môi trường trên Windows',
        videoUrl: 'https://youtu.be/aRYsKJ-8ppE?si=iEXzf33KFuOsDdD5',
        content: 'cài đặt Flutter SDK & setup biến môi trường trên Windows: Tải Flutter SDK từ trang chủ, giải nén và thêm đường dẫn Flutter vào biến môi trường PATH để có thể sử dụng lệnh flutter từ bất kỳ đâu trong terminal.',
      },
      {
        title: 'Bài 4 - Cài đặt JDK + Android SDK + Tool code Android Studio',
        videoUrl: 'https://youtu.be/wWF59NlIidM?si=0GdV_vnfZaiYxyCA',
        content: 'Test sang bai moi va quay lai bai truoc.',
      },
      {
        title: 'Bài 5 - Agree to Android Licenses & Cài đặt máy ảo Android Emulator',
        videoUrl: 'https://youtu.be/jDz9X21X5xU?si=dBpKDl0jImX39SkP',
        content: 'Hoan thanh bo video ngan de test day du flow.',
      },
    ],
  },
  {
    title: '[SEED] Khoa hoc test video trung binh',
    description: 'Khoa hoc mau co video ngan + dai xen ke de test chuyen bai va resume lau hon.',
    price: 199000,
    lessons: [
      {
        title: 'Bai 1 - Node.js Crash Course',
        videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
        content: 'Mo dau voi video trung binh de test playback thuc te.',
      },
      {
        title: 'Bai 2 - Express Fundamentals',
        videoUrl: 'https://www.youtube.com/watch?v=L72fhGm1tfE',
        content: 'Quan sat resume khi di toi giua video.',
      },
      {
        title: 'Bai 3 - React Intro',
        videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
        content: 'Kiem tra chuyen bai trong luc xem video dai hon.',
      },
      {
        title: 'Bai 4 - React Hooks',
        videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
        content: 'Test lui lai bai cu va tiep tuc xem.',
      },
      {
        title: 'Bai 5 - JavaScript Async',
        videoUrl: 'https://www.youtube.com/watch?v=PoRJizFvM7s',
        content: 'Video trung binh de quan sat auto-save theo giay.',
      },
      {
        title: 'Bai 6 - SQL Basics',
        videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
        content: 'Hoan tat bo video trung binh.',
      },
      {
        title: 'Bai 7 - Docker for Beginners',
        videoUrl: 'https://www.youtube.com/watch?v=3c-iBn73dDE',
        content: 'Bai cuoi de test dong bo trang thai bai hoc.',
      },
    ],
  },
  {
    title: '[SEED] Khoa hoc test video dai 30-60p',
    description: 'Khoa hoc mau co video dai de test resume, giu session va xem lau.',
    price: 299000,
    lessons: [
      {
        title: 'Bai 1 - JavaScript Full Course',
        videoUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        content: 'Video dai de test xem lien tuc trong thoi gian dai.',
      },
      {
        title: 'Bai 2 - JavaScript Intermediate Concepts',
        videoUrl: 'https://www.youtube.com/watch?v=3PHXvlpOkf4',
        content: 'Kiem tra resume sau khi thoat va quay lai.',
      },
      {
        title: 'Bai 3 - Node.js Full Course',
        videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
        content: 'Video dai hon de test luu vi tri xem chinh xac.',
      },
      {
        title: 'Bai 4 - React for Beginners Full Course',
        videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
        content: 'Ket thuc voi video dai de test thanh progress.',
      },
    ],
  },
];

const ensureInstructor = async () => {
  const instructor = await User.findOne({
    where: {
      role: {
        [Op.in]: ['teacher', 'admin'],
      },
    },
    order: [['id', 'ASC']],
  });

  if (!instructor) {
    throw new Error('Khong tim thay tai khoan teacher/admin de tao khoa hoc seed.');
  }

  return instructor;
};

const ensureStudents = async () => {
  const preferredEmails = ['student1@lms.local', 'student2@lms.local', 'student.seed1@lms.local'];
  const preferredStudents = await User.findAll({
    where: {
      role: 'student',
      email: {
        [Op.in]: preferredEmails,
      },
    },
    order: [['id', 'ASC']],
  });

  if (preferredStudents.length > 0) {
    return preferredStudents;
  }

  return User.findAll({
    where: { role: 'student' },
    order: [['id', 'ASC']],
    limit: 2,
  });
};

const ensureCourse = async (instructorId, title, description, price) => {
  const [course] = await Course.findOrCreate({
    where: {
      title,
      instructorId,
    },
    defaults: {
      title,
      description,
      price,
      instructorId,
    },
  });

  return course;
};

const ensureLessons = async (courseId, lessons) => {
  let createdCount = 0;

  for (let index = 0; index < lessons.length; index += 1) {
    const template = lessons[index];
    const orderIndex = index + 1;

    const existing = await Lesson.findOne({
      where: {
        courseId,
        orderIndex,
      },
    });

    if (!existing) {
      await Lesson.create({
        courseId,
        title: template.title,
        videoUrl: template.videoUrl,
        content: template.content,
        orderIndex,
      });

      createdCount += 1;
      continue;
    }

    await existing.update({
      title: template.title,
      videoUrl: template.videoUrl,
      content: template.content,
    });
  }

  return {
    total: lessons.length,
    created: createdCount,
  };
};

const ensureEnrollments = async (students, courseId) => {
  let createdCount = 0;

  for (const student of students) {
    const [enrollment, created] = await Enrollment.findOrCreate({
      where: {
        userId: student.id,
        courseId,
      },
      defaults: {
        userId: student.id,
        courseId,
        status: 'active',
      },
    });

    if (!created && enrollment.status !== 'active') {
      await enrollment.update({ status: 'active' });
    }

    if (created) {
      createdCount += 1;
    }
  }

  return createdCount;
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const instructor = await ensureInstructor();
    const students = await ensureStudents();

    if (!students.length) {
      throw new Error('Khong tim thay tai khoan student de seed du lieu test.');
    }

    const results = [];

    for (const variant of COURSE_VARIANTS) {
      const course = await ensureCourse(instructor.id, variant.title, variant.description, variant.price);
      const lessonStats = await ensureLessons(course.id, variant.lessons);
      const enrollmentsCreated = await ensureEnrollments(students, course.id);

      results.push({
        courseId: course.id,
        title: course.title,
        lessons: lessonStats.total,
        enrollmentsCreated,
      });
    }

    // eslint-disable-next-line no-console
    console.log('Seed multi-video done:');
    for (const item of results) {
      // eslint-disable-next-line no-console
      console.log(
        `- ${item.title} | courseId=${item.courseId} | lessons=${item.lessons} | enrollments_created=${item.enrollmentsCreated}`,
      );

      // eslint-disable-next-line no-console
      console.log(`  Test URL: /learn?courseId=${item.courseId}&lessonId=1`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seed multi-video failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
};

run();