import React from 'react';
import { X, Image as ImageIcon, Smile, ThumbsUp, MessageSquare } from 'lucide-react';
import { Badge } from './Badge';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewsCount: number;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, reviewsCount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Lớp nền tối mờ */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Thân Modal */}
      <div className="relative bg-[#FBFBFE] text-[#040316] w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-outline-variant/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Tiêu đề & Nút đóng */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight font-headline">Phản hồi</h2>
            <Badge variant="secondary">{reviewsCount} Bình luận</Badge>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-bright rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nội dung cuộn */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* YOUR ACTIVITY */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/50 mb-3">Bình luận của bạn</h3>
            <div className="bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FFC9D2] flex items-center justify-center font-bold text-[#F65C88] shrink-0">
                ME
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Bạn</span>
                  <span className="text-xs text-on-surface-variant/60">2 giờ trước</span>
                </div>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Độ phân giải của tệp này thật sự kinh ngạc. Tôi dự định sử dụng nó cho phần hero của trang landing page dự án mới của chúng tôi. Các chuyển động mềm mại tạo cảm giác rất cao cấp!
                </p>
              </div>
            </div>
          </div>

          {/* FEATURED COMMENTS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/50 mb-3">Bình luận nổi bật</h3>
            <div className="space-y-4">
              {/* Comment 1 */}
              <div className="p-4 rounded-xl hover:bg-surface-container-low transition-colors flex gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" 
                  alt="Sarah Jenkins" 
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Sarah Jenkins</span>
                    <Badge variant="default" className="text-[9px] px-1.5 py-0.5">Pro</Badge>
                    <span className="text-xs text-on-surface-variant/60 ml-auto">1 ngày trước</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    Ánh sáng trong các tệp EXR được thiết kế vô cùng điêu luyện. Nó thực sự giúp tiết kiệm rất nhiều thời gian trong khâu hậu kỳ. Khuyên dùng cho bất kỳ dự án thiết kế kiến trúc nào.
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant/60">
                    <button className="flex items-center gap-1.5 hover:text-tertiary transition-colors">
                      <ThumbsUp size={14} />
                      <span>12</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-tertiary transition-colors">
                      <MessageSquare size={14} />
                      <span>Trả lời</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment 2 */}
              <div className="p-4 rounded-xl hover:bg-surface-container-low transition-colors flex gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" 
                  alt="Marcus Chen" 
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Marcus Chen</span>
                    <span className="text-xs text-on-surface-variant/60 ml-auto">3 ngày trước</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    Hình khối rất đẹp. Tôi rất muốn thấy phiên bản màu trung tính hơn như xám than hoặc cát. Thiết kế rất tốt, luôn ủng hộ bạn Julian!
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant/60">
                    <button className="flex items-center gap-1.5 hover:text-tertiary transition-colors">
                      <ThumbsUp size={14} />
                      <span>8</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-tertiary transition-colors">
                      <MessageSquare size={14} />
                      <span>Trả lời</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment 3 (Bổ sung để đa dạng) */}
              <div className="p-4 rounded-xl hover:bg-surface-container-low transition-colors flex gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" 
                  alt="Elena" 
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Elena Rostova</span>
                    <span className="text-xs text-on-surface-variant/60 ml-auto">5 ngày trước</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    Các tệp được sắp xếp rất khoa học và dễ tùy chỉnh. Tôi thích cách bạn chia các layer!
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant/60">
                    <button className="flex items-center gap-1.5 hover:text-tertiary transition-colors">
                      <ThumbsUp size={14} />
                      <span>3</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-tertiary transition-colors">
                      <MessageSquare size={14} />
                      <span>Trả lời</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh nhập bình luận dưới cùng */}
        <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-high shrink-0">
            <img
              alt="Hồ sơ người dùng"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgjenSZvmWQAHLKLu_fM4v9SZRZ5DPygvM4mF4-TlaoifBbIrtbx7MeVFpDB2CgAiBf6Olwz4ICP4Plwu_0wfr6r-N-ww-oFnsUeOMkWFCZ156VXAI6-zoqaMlPVQ1cxNZRWipMYMI9hvlB-aSrTz6cDJdt8v8cD9ZCeRcDBa5cSyGFLiMuffdtl8AbMa4HtDhvfdC3NwkAjOw2DAoum7ndBfvubfjy3t0mN2xPJZoRVeP1VS6yiFtETW8eVGimEItoeJTxP4ONZFz"
            />
          </div>
          <div className="flex-1 relative flex items-center bg-white rounded-2xl border border-outline-variant/20 px-4 py-2.5 focus-within:border-tertiary transition-colors">
            <input 
              type="text" 
              placeholder="Viết phản hồi tới nghệ sĩ và cộng đồng..."
              className="w-full bg-transparent border-none outline-none text-sm focus:ring-0 placeholder:text-on-surface-variant/40 text-on-surface pr-16"
            />
            <div className="absolute right-3 flex items-center gap-2 text-on-surface-variant/60">
              <button className="hover:text-tertiary transition-colors">
                <ImageIcon size={18} />
              </button>
              <button className="hover:text-tertiary transition-colors">
                <Smile size={18} />
              </button>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-2xl text-sm font-semibold shadow-md shrink-0 transition-colors">
            Gửi phản hồi
          </button>
        </div>

      </div>
    </div>
  );
};
