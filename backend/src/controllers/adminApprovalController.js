const { Course, Lesson, Quiz, User } = require('../models'); // Chú ý: Hãy import đúng đường dẫn Models của bạn
const sendEmail = require('../utils/sendEmail');

// 1. Lấy danh sách đang chờ phê duyệt
exports.getPendingApprovals = async (req, res) => {
  try {
    // Lấy các khóa học đang chờ duyệt
    const pendingCourses = await Course.findAll({
      where: { approvalStatus: 'PENDING' },
      order: [['createdAt', 'DESC']]
    });

    // Lấy các bài học đang chờ duyệt
    const pendingLessons = await Lesson.findAll({
      where: { approvalStatus: 'PENDING' },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        courses: pendingCourses,
        lessons: pendingLessons
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chờ duyệt:", error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu' });
  }
};

// 2. Cập nhật trạng thái phê duyệt (Dùng chung cho cả Course và Lesson)
exports.updateApprovalStatus = async (req, res) => {
  try {
    const { type, id } = req.params; // type: 'course' hoặc 'lesson'
    const { status } = req.body;     // status: 'APPROVED' hoặc 'REJECTED'

    // 1. Kiểm tra tính hợp lệ của trạng thái đầu vào
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    // Ép kiểu ID về dạng Number để tránh xung đột dữ liệu giữa các bảng quan hệ
    const targetId = Number(id);

    // 2. TRƯỜNG HỢP: PHÊ DUYỆT KHÓA HỌC
    if (type === 'course') {
      const course = await Course.findByPk(targetId);
      if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

      // Ghi trực tiếp xuống DB bằng targetId sạch
      await Course.update({
        approvalStatus: status.toUpperCase(),
        status: status.toLowerCase(),
        isPublished: status.toUpperCase() === 'APPROVED'
      }, { where: { id: targetId } });

      // NẾU LÀ APPROVED -> Đồng bộ tự động duyệt TẤT CẢ CÁC BÀI HỌC nằm trong khóa học đó
      if (status.toUpperCase() === 'APPROVED') {
        await Lesson.update({
          approvalStatus: 'APPROVED',
          status: 'approved',
          isPublished: true
        }, { where: { courseId: targetId } });

        await Quiz.update(
          { isPublished: true },
          { where: { courseId: targetId, lessonId: null } },
        );
      }

      // Tự động gửi email thông báo cho Giảng viên nếu khóa học bị từ chối (REJECTED)
      if (status.toUpperCase() === 'REJECTED') {
        await Quiz.update(
          { isPublished: false },
          { where: { courseId: targetId } },
        );

        const instructorId = course.instructorId || course.teacherId || course.createdBy;
        if (instructorId) {
          const instructor = await User.findByPk(instructorId);
          if (instructor && instructor.email) {
            const subject = `Thông báo: Khóa học "${course.title}" đã bị từ chối`;
            const text = `Chào ${instructor.name || 'giảng viên'},\n\nRất tiếc, khóa học "${course.title}" của bạn không được ban quản trị phê duyệt.\nVui lòng kiểm tra lại nội dung hoặc liên hệ Admin để chỉnh sửa và biết thêm chi tiết.\n\nTrân trọng,\nĐội ngũ Admin.`;

            // Chạy bất đồng bộ, không dùng await để tránh việc API phải đợi mail gửi xong mới phản hồi
            sendEmail({ to: instructor.email, subject, text });
          }
        }
      }

    // 3. TRƯỜNG HỢP: PHÊ DUYỆT BÀI HỌC CỤ THỂ
    } else if (type === 'lesson') {
      const lesson = await Lesson.findByPk(targetId);
      if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });

      // SỬA LỖI CHÍ MẠNG: Dùng targetId ép kiểu Number sạch để ghi nhận thay đổi xuống DB
      await Lesson.update({
        approvalStatus: status.toUpperCase(),
        status: status.toLowerCase(),
        isPublished: status.toUpperCase() === 'APPROVED'
      }, { where: { id: targetId } });

    } else {
      return res.status(400).json({ success: false, message: 'Loại nội dung không hợp lệ' });
    }

    return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái phê duyệt xuống CSDL thành công.' });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái phê duyệt:", error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
  }
};

// === CÁC CHỨC NĂNG QUẢN LÝ KHÓA HỌC MỞ RỘNG ===

// 3. Lấy danh sách tất cả khóa học (có filter theo trạng thái)
exports.getCourses = async (req, res) => {
  try {
    const { status } = req.query; // Lọc theo 'PENDING', 'APPROVED', 'REJECTED'
    const whereClause = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      whereClause.approvalStatus = status;
    }

    const courses = await Course.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    // Lấy thông tin giảng viên thủ công để tránh lỗi SequelizeEagerLoadingError
    // do sai tên định nghĩa association (alias) trong model.
    const result = [];
    for (const course of courses) {
      const courseData = course.toJSON ? course.toJSON() : course;
      const ownerId = courseData.instructorId || courseData.teacherId || courseData.createdBy;
      if (ownerId) {
        try {
          const user = await User.findByPk(ownerId, { attributes: ['id', 'name', 'email'] });
          if (user) {
            courseData.instructor = user.toJSON ? user.toJSON() : user;
          }
        } catch (e) {} // Bỏ qua nếu lỗi truy vấn User
      }
      result.push(courseData);
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khóa học:", error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu' });
  }
};

// 4. Sửa thông tin chi tiết một khóa học (do Admin thực hiện)
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, categoryId } = req.body;

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    // Cập nhật các trường được cung cấp
    course.title = title ?? course.title;
    course.description = description ?? course.description;
    course.price = price ?? course.price;
    course.categoryId = categoryId ?? course.categoryId;

    await course.save();

    return res.status(200).json({ success: true, message: 'Cập nhật khóa học thành công', data: course });
  } catch (error) {
    console.error("Lỗi khi cập nhật khóa học:", error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
  }
};

// 5. Xóa một khóa học (do Admin thực hiện)
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    // Lưu ý: Thao tác này sẽ xóa vĩnh viễn khóa học.
    // Trong một ứng dụng thực tế, bạn có thể cần xử lý các dữ liệu liên quan như bài học, chương, ghi danh...
    await course.destroy();

    return res.status(200).json({ success: true, message: 'Xóa khóa học thành công' });
  } catch (error) {
    console.error("Lỗi khi xóa khóa học:", error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
  }
};

// 6. Lấy danh sách bài học đầy đủ (không bị ẩn trường) cho giáo viên
exports.getFullLessonsForTeacher = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.findAll({
      where: { courseId: courseId },
      raw: true // Bỏ qua Sequelize instance, trả về dữ liệu thô để tránh cache
    });
    return res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài học:", error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu bài học' });
  }
};
