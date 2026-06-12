import { useMemo, useState } from 'react';

import './quanlyPhanHoi.css';
import AdminSidebar from '../../components/AdminSidebar';

const ticketsSeed = [
  {
    id: 1024,
    user: 'Bui Van Dong',
    timeAgo: '10 phút trước',
    subject: 'Lỗi không tải được video bài giảng số 5',
    priority: 'Cao',
    priorityType: 'high',
    issue: 'Lỗi Video Player bài giảng Flutter',
    messages: [
      {
        id: 1,
        sender: 'user',
        text: 'Chào Admin, mình đang học khóa Flutter HousePal nhưng đến bài 5 thì video không load được, cứ quay vòng tròn mãi. Các bài trước vẫn xem bình thường ạ.',
      },
      {
        id: 2,
        sender: 'admin',
        text: 'Chào bạn Đông, rất xin lỗi vì trải nghiệm không tốt này. Bạn vui lòng cho mình biết bạn đang sử dụng trình duyệt gì và đã thử xóa cache chưa ạ?',
      },
      {
        id: 3,
        sender: 'user',
        text: 'Mình dùng Chrome bản mới nhất, đã xóa cache rồi nhưng vẫn bị lỗi trên. Nhờ Admin kiểm tra lại giúp mình với.',
      },
    ],
  },
  {
    id: 1023,
    user: 'Le Minh Ngoc',
    timeAgo: '1 giờ trước',
    subject: 'Yêu cầu hoàn tiền khóa học Flutter',
    priority: 'Trung bình',
    priorityType: 'medium',
    issue: 'Yêu cầu hoàn tiền khóa học',
    messages: [
      { id: 1, sender: 'user', text: 'Em đã đăng ký khóa Flutter nhưng lịch học thay đổi nên không theo kịp, em muốn được hoàn tiền.' },
      { id: 2, sender: 'admin', text: 'Bạn vui lòng cho bên mình mã giao dịch và lý do chi tiết để bên mình kiểm tra hồ sơ hoàn tiền.' },
    ],
  },
  {
    id: 1022,
    user: 'Tran Quang Huy',
    timeAgo: '5 giờ trước',
    subject: 'Quên mật khẩu đăng nhập hệ thống',
    priority: 'Thấp',
    priorityType: 'low',
    issue: 'Không đăng nhập được vì quên mật khẩu',
    messages: [
      { id: 1, sender: 'user', text: 'Mình quên mật khẩu và không nhận được email reset, nhờ hỗ trợ giúp.' },
      { id: 2, sender: 'admin', text: 'Bạn kiểm tra thư mục spam và xác nhận đúng email đăng ký. Nếu vẫn lỗi, bên mình sẽ reset thủ công.' },
    ],
  },
];

function QuanLyPhanHoi() {
  const [selectedTicketId, setSelectedTicketId] = useState(1024);
  const [reply, setReply] = useState('');

  const selectedTicket = useMemo(
    () => ticketsSeed.find((ticket) => ticket.id === selectedTicketId) ?? ticketsSeed[0],
    [selectedTicketId],
  );

  const handleSendReply = () => {
    const text = reply.trim();
    if (!text) {
      // eslint-disable-next-line no-alert
      alert('Vui lòng nhập nội dung phản hồi trước khi gửi.');
      return;
    }

    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Đã gửi phản hồi đến ${selectedTicket.user}: ${text}`);
    setReply('');
  };

  const handleCloseTicket = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Đã đóng Ticket #${selectedTicket.id}`);
  };

  return (
    <div className="admin-support-page">
      <AdminSidebar />

      <main className="admin-support-main-content">
        <section className="admin-support-ticket-sidebar">
          <div className="admin-support-ticket-header">
            <h2>Yêu cầu hỗ trợ ({ticketsSeed.length})</h2>
          </div>

          <div className="admin-support-ticket-list">
            {ticketsSeed.map((ticket) => (
              <article
                className={`admin-support-ticket-item ${ticket.id === selectedTicketId ? 'active' : ''}`}
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedTicketId(ticket.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="admin-support-ticket-info-top">
                  <span className="admin-support-ticket-user">{ticket.user}</span>
                  <span className="admin-support-ticket-time">{ticket.timeAgo}</span>
                </div>
                <div className="admin-support-ticket-subject">{ticket.subject}</div>
                <span className={`admin-support-badge admin-support-priority-${ticket.priorityType}`}>{ticket.priority}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-support-chat-view">
          <header className="admin-support-chat-header">
            <div className="admin-support-chat-user-info">
              <h3>
                Ticket #{selectedTicket.id} - {selectedTicket.user}
              </h3>
              <p>Vấn đề: {selectedTicket.issue}</p>
            </div>
            <button className="admin-support-btn admin-support-btn-success" onClick={handleCloseTicket} type="button">
              Đóng Ticket
            </button>
          </header>

          <div className="admin-support-chat-messages">
            {selectedTicket.messages.map((message) => (
              <div
                className={`admin-support-message ${message.sender === 'admin' ? 'admin-support-msg-admin' : 'admin-support-msg-user'}`}
                key={`${selectedTicket.id}-${message.id}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <footer className="admin-support-chat-footer">
            <input
              className="admin-support-chat-input"
              onChange={(event) => setReply(event.target.value)}
              placeholder="Nhập tin nhắn phản hồi cho người dùng..."
              type="text"
              value={reply}
            />
            <button className="admin-support-btn admin-support-btn-primary" onClick={handleSendReply} type="button">
              Gửi đi
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default QuanLyPhanHoi;
