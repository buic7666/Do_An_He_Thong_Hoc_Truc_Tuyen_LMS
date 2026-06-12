import './ManHinhTinTuc_Sk.css';
import { Link } from 'react-router-dom';

const newsList = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    date: '22 Tháng 3, 2026',
    title: 'Lộ trình học Flutter 2026: Từ người mới bắt đầu đến chuyên gia',
    description:
      'Khám phá những cập nhật mới nhất của Flutter trong năm 2026 và cách xây dựng dự án HousePal thực tế để ghi điểm với nhà tuyển dụng...',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    date: '20 Tháng 3, 2026',
    title: 'Tại sao JavaScript vẫn thống trị mảng Backend trong năm nay?',
    description:
      'Phân tích sức mạnh của Node.js và hệ sinh thái JavaScript chuyên sâu giúp xử lý hàng triệu giao dịch mỗi giây...',
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=600&q=80',
    date: '18 Tháng 3, 2026',
    title: 'Ứng dụng Reinforcement Learning vào Robot thông minh',
    description:
      'Học cách máy tính tự tối ưu hóa hành vi thông qua thử sai - một bước tiến mới trong kỷ nguyên trí tuệ nhân tạo...',
  },
];

const eventList = [
  {
    id: 1,
    date: '📅 25/03/2026 • 20:00',
    title: 'Livestream: Tư vấn lộ trình học Software Engineering cho sinh viên năm cuối',
  },
  {
    id: 2,
    date: '📅 28/03/2026 • 09:00',
    title: 'Workshop Online: Cấu hình hệ thống mạng doanh nghiệp thực chiến',
  },
  {
    id: 3,
    date: '📅 05/04/2026 • 14:00',
    title: 'Giao lưu cùng chuyên gia AI về chủ đề Reinforcement Learning',
  },
];

function ManHinhTinTuc_Sk() {
  return (
    <div className='guest-news-page'>
      <div className='guest-news-container'>
        <main className='guest-news-section'>
          <h2 className='guest-news-section-title'>Tin tức mới nhất</h2>

          <div className='guest-news-grid'>
            {newsList.map((news) => (
              <article key={news.id} className='guest-news-card'>
                <img src={news.image} alt='News' className='guest-news-thumb' />

                <div className='guest-news-body'>
                  <span className='guest-news-date'>{news.date}</span>
                  <Link to='/guest/course/1' className='guest-news-title'>
                    {news.title}
                  </Link>
                  <p className='guest-news-desc'>{news.description}</p>
                  <Link to='/guest/course/1' className='guest-read-more'>
                    Xem chi tiết →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className='guest-news-sidebar'>
          <h2 className='guest-sidebar-title'>Sự kiện sắp diễn ra</h2>

          <div className='guest-event-list'>
            {eventList.map((event) => (
              <article key={event.id} className='guest-event-card'>
                <div className='guest-event-date-box'>{event.date}</div>
                <Link to='/guest/news' className='guest-event-name'>
                  {event.title}
                </Link>
                <button type='button' className='guest-btn-notify'>
                  🔔 Nhận thông báo
                </button>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ManHinhTinTuc_Sk;
