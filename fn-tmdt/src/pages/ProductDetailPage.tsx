import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingBag, FolderPlus, Send, MessageSquare } from 'lucide-react';
import { useHomeData } from './Home/home.logic';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { Badge } from '../components/ui/Badge';
import { CommentsModal } from '../components/ui/CommentsModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { assets } = useHomeData();
  
  // Tìm asset tương ứng hoặc dùng mặc định nếu không tìm thấy
  const asset = assets.find((a) => a.id === id) || assets[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface text-on-surface">
        <div className="text-center">
          <p className="text-lg font-semibold">Không tìm thấy tài nguyên</p>
          <Link to="/" className="text-tertiary hover:underline mt-2 inline-block">Trở lại trang chủ</Link>
        </div>
      </div>
    );
  }

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
    console.log(`Artist follow state changed to: ${!isFollowing}`);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setCommentsList([newCommentText, ...commentsList]);
    setNewCommentText('');
    console.log('Comment posted successfully');
  };

  const formattedPrice = asset.price.toLocaleString('vi-VN');

  return (
    <div className="bg-surface font-body text-on-surface antialiased h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto w-full">
          
          {/* Breadcrumb hoặc đường dẫn quay về */}
          <div className="mb-6">
            <Link to="/" className="text-xs text-on-surface-variant hover:text-tertiary transition-colors">
              &larr; Quay lại danh sách khám phá
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* Cột trái: Slide ảnh (lg:span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Ảnh lớn và Indicator */}
              <div className="relative rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/10 aspect-square flex items-center justify-center">
                <img 
                  src={asset.images[activeImageIndex] || asset.imageUrl} 
                  alt={asset.imageAlt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-bold">
                  {activeImageIndex + 1} / {asset.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {asset.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-[#F65C88] scale-95' : 'border-transparent hover:border-[#F65C88]/40'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Phần Phản hồi dưới dạng cột trái rộng rãi */}
              <div className="mt-8 border-t border-outline-variant/15 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <span>Phản hồi</span>
                    <Badge variant="muted">{asset.reviewsCount + commentsList.length} Bình luận</Badge>
                  </h3>
                </div>

                {/* Form thêm bình luận */}
                <form onSubmit={handlePostComment} className="flex gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-[#FFC9D2] flex items-center justify-center font-bold text-[#F65C88] shrink-0">
                    ME
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Chia sẻ suy nghĩ của bạn về tài nguyên này..."
                      rows={3}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:border-tertiary focus:outline-none transition-colors placeholder:text-on-surface-variant/40 text-on-surface"
                    />
                    <button
                      type="submit"
                      className="self-end px-5 py-2 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                    >
                      <Send size={14} />
                      <span>Thêm bình luận</span>
                    </button>
                  </div>
                </form>

                {/* Bình luận của bạn (Nếu có đăng mới) */}
                {commentsList.map((comm, idx) => (
                  <div key={idx} className="bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl p-5 flex gap-4 mb-4 animate-in slide-in-from-top-3 duration-200">
                    <div className="w-10 h-10 rounded-full bg-[#FFC9D2] flex items-center justify-center font-bold text-[#F65C88] shrink-0">
                      ME
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Bạn</span>
                        <span className="text-xs text-on-surface-variant/60">Vừa xong</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                        {comm}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Bình luận tĩnh từ thiết kế */}
                <div className="space-y-6">
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

                  <div className="space-y-4 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/50">Bình luận nổi bật</p>
                    
                    {/* Sarah Jenkins */}
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
                      </div>
                    </div>

                    {/* Marcus Chen */}
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
                      </div>
                    </div>
                  </div>

                  {/* Nút Xem tất cả bình luận */}
                  <button 
                    onClick={() => setIsCommentsOpen(true)}
                    className="w-full py-3 border border-dashed border-outline-variant rounded-2xl text-xs font-semibold text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-all duration-200 mt-4 text-center"
                  >
                    Xem tất cả {asset.reviewsCount} bình luận &darr;
                  </button>
                </div>
              </div>

            </div>

            {/* Cột phải: Thông tin & Mua hàng (lg:span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
              
              {/* Tags */}
              <div className="flex gap-2">
                {asset.tags.map((t, idx) => (
                  <Badge key={idx} variant="secondary"># {t}</Badge>
                ))}
              </div>

              {/* Tiêu đề & Đánh giá */}
              <div>
                <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                  {asset.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-bold text-on-surface">{asset.rating}</span>
                  <span>•</span>
                  <span>{asset.reviewsCount} Đánh giá</span>
                </div>
              </div>

              {/* Thẻ tác giả */}
              <div className="bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl p-4 flex items-center justify-between gap-4">
                <Link
                  to={`/author/${asset.authorHandle.replace('@', '')}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={asset.authorAvatar}
                    alt={asset.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  />
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{asset.author}</h4>
                    <p className="text-xs text-on-surface-variant/75 mt-0.5">{asset.authorHandle} • {asset.authorFollowers}</p>
                  </div>
                </Link>
                <button
                  onClick={handleFollowClick}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isFollowing 
                      ? 'bg-transparent border border-[#F65C88] text-[#F65C88]' 
                      : 'bg-white text-black hover:bg-white/95'
                  }`}
                >
                  {isFollowing ? 'Đã Theo Dõi' : 'Follow Artist'}
                </button>
              </div>

              {/* Mô tả */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant/60 mb-2">Mô tả</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {asset.description}
                </p>
              </div>

              {/* Hộp mua hàng */}
              <div className="bg-[#F6F2FF] border border-outline-variant/10 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant/80">Standard License</h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-[#F65C88] tracking-tight">{formattedPrice} VND</span>
                    <span className="text-xs text-on-surface-variant/60">Pay as Go</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => alert(`Cảm ơn bạn đã mua! Tiến hành thanh toán ${formattedPrice} VND.`)}
                    className="w-full py-4 bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] hover:animate-gradient bg-[length:200%_auto] text-white rounded-full font-bold shadow-md hover:scale-[1.01] active:scale-100 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={18} />
                    <span>Mua ngay!</span>
                  </button>
                  <button 
                    onClick={() => alert('Đã thêm tài nguyên vào thư viện cá nhân.')}
                    className="w-full py-4 bg-[#E9E5FF] hover:bg-[#E3Dffd] text-[#635BFF] rounded-full font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <FolderPlus size={18} />
                    <span>Thêm vào thư viện</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
      <BottomNav />

      {/* Modal bình luận chi tiết */}
      <CommentsModal 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        reviewsCount={asset.reviewsCount}
      />
    </div>
  );
};
export default ProductDetailPage;
