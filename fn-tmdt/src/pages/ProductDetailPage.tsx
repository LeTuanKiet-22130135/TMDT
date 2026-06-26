import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, FolderPlus, Send, Check, Loader2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { client } from '../apollo';
import { PRODUCT_DETAIL_QUERY } from '../graphql/product';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { Badge } from '../components/ui/Badge';
import { CommentsModal } from '../components/ui/CommentsModal';
import { useCart } from '../contexts/CartContext';
import { resolveMediaUrl } from '../lib/media';
import { usePurchasedProductIds } from '../hooks/usePurchasedProductIds';

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  userTags: string[];
  aiTags: string[];
  licenseType: string;
  softwareTags: string[];
  formatTags: string[];
  store: {
    id: string;
    name: string;
    owner: {
      username: string;
      fullName: string;
      avatarUrl: string | null;
      shortlink: string;
    };
  };
}

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem, openCart, items, addedProductId } = useCart();
  const purchasedIds = usePurchasedProductIds();

  const { data, loading, error } = useQuery<{ product: ProductDetail | null }>(
    PRODUCT_DETAIL_QUERY,
    { client, variables: { productId: id }, skip: !id }
  );

  const product = data?.product;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [addedAnim, setAddedAnim] = useState(false);

  const isJustAdded = product ? addedProductId === product.id : false;

  useEffect(() => {
    if (isJustAdded) {
      setAddedAnim(true);
      const t = setTimeout(() => setAddedAnim(false), 600);
      return () => clearTimeout(t);
    }
  }, [isJustAdded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent text-on-surface">
        <Loader2 size={32} className="animate-spin text-[#F65C88]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent text-on-surface">
        <div className="text-center">
          <p className="text-lg font-semibold">Không tìm thấy tài nguyên</p>
          <Link to="/" className="text-tertiary hover:underline mt-2 inline-block">Trở lại trang chủ</Link>
        </div>
      </div>
    );
  }

  const alreadyInCart = items.some((i) => i.productId === product.id);
  const alreadyPurchased = purchasedIds.has(product.id);

  const handleAddToCart = () => {
    if (alreadyPurchased) return;
    if (alreadyInCart) { openCart(); return; }
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: resolveMediaUrl(product.imageUrls[0]),
      storeName: product.store.name,
    });
  };

  const handleFollowClick = () => setIsFollowing((v) => !v);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setCommentsList([newCommentText, ...commentsList]);
    setNewCommentText('');
  };

  const allTags = [...product.userTags, ...product.aiTags].slice(0, 5);
  const formattedPrice = product.price.toLocaleString('vi-VN');
  const owner = product.store.owner;

  return (
    <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto w-full">

          <div className="mb-6">
            <Link to="/" className="text-xs text-on-surface-variant hover:text-tertiary transition-colors">
              &larr; Quay lại danh sách khám phá
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

            {/* Cột trái: slide ảnh + comments */}
            <div className="lg:col-span-7 flex flex-col gap-4">

              <div className="relative rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/10 aspect-square flex items-center justify-center">
                <img
                  src={resolveMediaUrl(product.imageUrls[activeImageIndex])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.imageUrls.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-bold">
                    {activeImageIndex + 1} / {product.imageUrls.length}
                  </div>
                )}
              </div>

              {product.imageUrls.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.imageUrls.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#F65C88] scale-95'
                          : 'border-transparent hover:border-[#F65C88]/40'
                      }`}
                    >
                      <img src={resolveMediaUrl(imgUrl)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Comments */}
              <div className="mt-8 border-t border-outline-variant/15 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <span>Phản hồi</span>
                    <Badge variant="muted">{commentsList.length} Bình luận</Badge>
                  </h3>
                </div>

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

                {commentsList.map((comm, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl p-5 flex gap-4 mb-4 animate-in slide-in-from-top-3 duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FFC9D2] flex items-center justify-center font-bold text-[#F65C88] shrink-0">
                      ME
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Bạn</span>
                        <span className="text-xs text-on-surface-variant/60">Vừa xong</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{comm}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setIsCommentsOpen(true)}
                  className="w-full py-3 border border-dashed border-outline-variant rounded-2xl text-xs font-semibold text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-all duration-200 mt-4 text-center"
                >
                  Xem tất cả bình luận &darr;
                </button>
              </div>
            </div>

            {/* Cột phải: info + mua */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t, idx) => (
                    <Badge key={idx} variant="secondary"># {t}</Badge>
                  ))}
                </div>
              )}

              <div>
                <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-bold text-on-surface">5.0</span>
                  <span>•</span>
                  <span>Mới</span>
                </div>
              </div>

              {/* Author */}
              <div className="bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl p-4 flex items-center justify-between gap-4">
                <Link
                  to={`/author/${owner.shortlink}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {owner.avatarUrl ? (
                    <img
                      src={owner.avatarUrl}
                      alt={owner.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FFC9D2] flex items-center justify-center font-bold text-[#F65C88] border-2 border-white text-sm">
                      {owner.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{owner.fullName}</h4>
                    <p className="text-xs text-on-surface-variant/75 mt-0.5">@{owner.shortlink} • {product.store.name}</p>
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
                  {isFollowing ? 'Đã Theo Dõi' : 'Follow'}
                </button>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant/60 mb-2">Mô tả</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{product.description}</p>
              </div>

              {/* Formats */}
              {(product.softwareTags.length > 0 || product.formatTags.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {product.softwareTags.map((t, i) => (
                    <span key={i} className="text-xs bg-surface-container-low border border-outline-variant/20 rounded-lg px-2.5 py-1 text-on-surface-variant font-medium">
                      {t}
                    </span>
                  ))}
                  {product.formatTags.map((t, i) => (
                    <span key={i} className="text-xs bg-surface-container-low border border-outline-variant/20 rounded-lg px-2.5 py-1 text-on-surface-variant font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Purchase box */}
              <div className="bg-[#F6F2FF] border border-outline-variant/10 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant/80">{product.licenseType} License</h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-[#F65C88] tracking-tight tabular-nums">
                      {formattedPrice} VND
                    </span>
                    <span className="text-xs text-on-surface-variant/60">Pay as Go</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Add to cart with animation */}
                  <button
                    onClick={handleAddToCart}
                    disabled={alreadyPurchased}
                    className={`relative w-full py-4 rounded-full font-bold shadow-md transition-all flex items-center justify-center gap-2 overflow-hidden
                      ${alreadyPurchased
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : addedAnim
                          ? 'bg-green-500 scale-[0.97] text-white'
                          : alreadyInCart
                            ? 'bg-[#E9E5FF] text-[#635BFF] hover:bg-[#E3Dffd]'
                            : 'bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] text-white hover:scale-[1.01] active:scale-100'
                      }`}
                  >
                    {!alreadyPurchased && addedAnim && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-30" />
                    )}
                    {alreadyPurchased ? (
                      <>
                        <Check size={18} />
                        <span>Đã mua</span>
                      </>
                    ) : addedAnim ? (
                      <>
                        <Check size={18} className="animate-bounce" />
                        <span>Đã thêm!</span>
                      </>
                    ) : alreadyInCart ? (
                      <>
                        <Check size={18} />
                        <span>Đã có trong giỏ — Xem giỏ hàng</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        <span>Thêm vào giỏ</span>
                      </>
                    )}
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

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        reviewsCount={commentsList.length}
      />
    </div>
  );
};

export default ProductDetailPage;
