import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, LayoutGrid, Users, Settings, HelpCircle, Activity } from 'lucide-react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { MY_FOLLOWED_AUTHORS_QUERY } from '../../graphql/product';
import { resolveMediaUrl } from '../../lib/media';

interface FollowedAuthor {
  id: string;
  shortlink: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isGold: boolean;
  productCount: number;
}

const STATUS_HINTS_NORMAL = [
  'Có gì đó trông lạ? Xem trạng thái hệ thống.',
  'Tải chậm hay lỗi kỳ lạ? Kiểm tra hệ thống đi.',
  'Không thấy nội dung? Hệ thống có thể đang nghỉ.',
  'Shiro cũng không chắc mọi thứ ổn. Xem thử đi.',
  'Đang bị lỗi? Biết đâu hệ thống đang bảo trì.',
  'Nếu thứ gì đó không đúng — kiểm tra ngay nha.',
  'Trang trắng tinh? Server chắc đi ngủ rồi.',
  'Lỗi 500 à? Server đang khóc một mình.',
  'Ảnh không load? Không phải wifi đâu, hệ thống đấy.',
  'Shiro thấy hơi lạ. Mày thấy không?',
  'Hmm... mọi thứ có vẻ... bình thường? Hay không?',
  'Nếu bạn đang nhìn chằm chằm vào màn hình trống — xem này.',
  'Backend đang ngủ hay đang làm việc? Chỉ có một cách biết.',
  'Đôi khi máy chủ cũng cần nghỉ ngơi. Xem nó có ổn không.',
  'AI đang mơ hay đang xử lý? Kiểm tra trạng thái đi.',
  'Cacao AI bị lag? Hay là bạn lag?',
  'Mọi thứ im lặng đáng ngờ. Nhấn vào đây xem sao.',
  'Server: 🤔 | Bạn: 😤 | Giải pháp: →',
  'Không phải lỗi của bạn. Có thể. Xem thử đi.',
  'Hệ thống đôi khi cũng drama. Click để xem drama hôm nay.',
];

const STATUS_HINTS_DOWN = [
  '🚨 Phát hiện sự cố hệ thống. Xem chi tiết.',
  '⚠️ Có dịch vụ đang gặp vấn đề. Kiểm tra ngay.',
  'Shiro đang lo lắng. Hệ thống có gì đó không ổn.',
  'Đèn đỏ bật rồi. Nhấn vào đây xem ai đang ngã.',
  'Cái gì đó vừa ngã. Chưa biết cái gì.',
  'Server đang giơ cờ trắng. Xem trạng thái đi.',
  'Không phải mạng bạn đâu — backend đang drama đó.',
  'Hệ thống đang kêu cứu nhỏ. Bạn có nghe không?',
  'Lỗi không tự sửa đâu. Ai đó phải xem.',
  'Something is on fire 🔥 — không phải theo nghĩa bóng.',
  'Trạng thái hệ thống: đang thở dốc.',
  'Ít nhất 1 dịch vụ vắng mặt không rõ lý do.',
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const systemHealth = useSystemStatus();
  const isDown = systemHealth === 'down' || systemHealth === 'degraded';
  const statusHint = useMemo(() => {
    const pool = isDown ? STATUS_HINTS_DOWN : STATUS_HINTS_NORMAL;
    return pool[Math.floor(Math.random() * pool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDown]);
  const { t } = useTranslation();
  const token = localStorage.getItem('access_token');

  const { data } = useQuery<{ myFollowedAuthors: FollowedAuthor[] }>(
    MY_FOLLOWED_AUTHORS_QUERY,
    { skip: !token, fetchPolicy: 'cache-and-network' }
  );

  const followedAuthors = data?.myFollowedAuthors ?? [];

  return (
    <aside className="hidden md:flex flex-col h-full overflow-y-auto bg-surface-container-low w-64 p-4 gap-2 font-label text-sm shadow-[32px_0_32px_-12px_rgba(26,25,47,0.06)] border-r border-outline-variant/15 shrink-0">
      <div className="px-4 py-6 mb-4">
        <h2 className="text-xl font-black text-tertiary font-headline">Khám phá</h2>
        <p className="text-xs text-on-surface-variant opacity-70">Tài nguyên chọn lọc</p>
      </div>
      <nav className="flex flex-col gap-1">
        <Link
          className={`flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-300 ${currentPath === '/'
            ? 'bg-surface-container-lowest text-tertiary shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-bright'
            }`}
          to="/"
        >
          <Home size={20} fill={currentPath === '/' ? 'currentColor' : 'none'} />
          <span>Trang chủ</span>
        </Link>
        <Link
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all"
          to="/"
        >
          <TrendingUp size={20} />
          <span>Thịnh hành</span>
        </Link>
        <Link
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all"
          to="/"
        >
          <LayoutGrid size={20} />
          <span>Bộ sưu tập</span>
        </Link>
        <Link
          className={`flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-300 ${currentPath === '/following'
            ? 'bg-surface-container-lowest text-tertiary shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-bright'
          }`}
          to="/following"
        >
          <Users size={20} fill={currentPath === '/following' ? 'currentColor' : 'none'} />
          <span>Đang theo dõi</span>
        </Link>
      </nav>

      {/* Followed authors */}
      <div className="mt-8 px-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-4">
          Tác giả đã theo dõi
        </p>
        {!token ? (
          <p className="text-xs text-on-surface-variant/40">Đăng nhập để xem</p>
        ) : followedAuthors.length === 0 ? (
          <p className="text-xs text-on-surface-variant/40">Chưa theo dõi ai</p>
        ) : (
          <div className="flex flex-col gap-3">
            {followedAuthors.map((author) => {
              const avatar = author.avatarUrl
                ? resolveMediaUrl(author.avatarUrl)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(author.fullName)}&background=ffafb1&color=db2e50`;

              return (
                <button
                  key={author.id}
                  onClick={() => navigate(`/author/${author.shortlink}`)}
                  className="flex items-center gap-3 hover:opacity-75 transition-opacity text-left w-full"
                >
                  <div className="relative w-8 h-8 shrink-0">
                    <img
                      className="w-8 h-8 rounded-full object-cover"
                      src={avatar}
                      alt={author.fullName}
                    />
                    {author.isVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F65C88] rounded-full border-2 border-white flex items-center justify-center text-[6px] text-white font-bold">✓</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-on-surface truncate">{author.fullName}</p>
                    <p className="text-[10px] text-on-surface-variant/60">{author.productCount} bài đăng</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/10 pt-4">
        <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" href="#">
          <Settings size={20} />
          <span>Cài đặt</span>
        </a>
        <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" href="#">
          <HelpCircle size={20} />
          <span>Trợ giúp</span>
        </a>
      </div>
      <div className="flex flex-col gap-1 border-t border-outline-variant/10 pt-4">
        <div className="flex items-center gap-3 text-on-surface-variant px-4 py-2 text-xs">
          {t('footer.copyrightShort', { year: new Date().getFullYear() })}
        </div>
        <Link
          to="/status"
          className="flex items-start gap-2 px-4 py-2 rounded-xl hover:bg-surface-bright transition-all group"
        >
          <div className="relative mt-0.5 shrink-0">
            <Activity size={12} className={`${isDown ? 'text-rose-500' : 'text-[#F65C88] opacity-60 group-hover:opacity-100'} transition-opacity`} />
            {isDown && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] leading-relaxed transition-colors ${isDown ? 'text-rose-500 font-medium' : 'text-on-surface-variant/40 group-hover:text-[#F65C88]'}`}>
            {statusHint}
          </span>
        </Link>
      </div>
    </aside>
  );
};
