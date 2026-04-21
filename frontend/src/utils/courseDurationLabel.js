export function getCourseDurationLabel(course) {
  const title = String(course?.title || '').toLowerCase();
  const lessonsCount = Number(course?.lessonsCount || course?.stats?.totalLessons || 0);

  if (/ngan|ngắn|short|5-10|5 đến 10|5 phut|5 phút|6 phut|6 phút|8 phut|8 phút/.test(title)) {
    return 'Ngắn';
  }

  if (/trung binh|trung bình|medium|10-30|15 phut|15 phút|20 phut|20 phút/.test(title)) {
    return 'Trung bình';
  }

  if (/dai|dài|long|30-60|30 phut|30 phút|45 phut|45 phút|60 phut|60 phút/.test(title)) {
    return 'Dài';
  }

  if (lessonsCount <= 5) {
    return 'Ngắn';
  }

  if (lessonsCount <= 8) {
    return 'Trung bình';
  }

  return 'Dài';
}