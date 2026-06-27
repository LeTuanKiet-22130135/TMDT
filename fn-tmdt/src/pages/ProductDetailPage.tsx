import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Check, Loader2, MessageSquare, Pencil } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import { client } from '../apollo';
import {
  PRODUCT_DETAIL_QUERY,
  IS_FOLLOWING_QUERY,
  FOLLOW_MUTATION,
  UNFOLLOW_MUTATION,
  MY_FOLLOWED_AUTHORS_QUERY,
  IS_LIKED_QUERY,
  LIKE_PRODUCT_MUTATION,
  UNLIKE_PRODUCT_MUTATION,
  MY_LIKED_PRODUCTS_QUERY,
} from '../graphql/product';
import { GET_PRODUCT_REVIEWS, ADD_REVIEW_MUTATION } from '../graphql/review';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { Badge } from '../components/ui/Badge';
import { CommentsModal } from '../components/ui/CommentsModal';
import { useCart } from '../contexts/CartContext';
import { resolveMediaUrl } from '../lib/media';
import { usePurchasedProductIds } from '../hooks/usePurchasedProductIds';
import { useUserProfile } from '../contexts/UserProfileContext';
import { trackEvent } from '../services/redService';

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
  mainFileUrl: string | null;
  store: {
    id: string;
    name: string;
    owner: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl: string | null;
      shortlink: string;
    };
  };
}

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, openCart, items, addedProductId } = useCart();
  const purchasedIds = usePurchasedProductIds();
  const { profile } = useUserProfile();

  const { data, loading, error } = useQuery<{ product: ProductDetail | null }>(
    PRODUCT_DETAIL_QUERY,
    { client, variables: { productId: id }, skip: !id }
  );

  const product = data?.product;

  const token = localStorage.getItem('access_token');
  const ownerShortlink = product?.store.owner.shortlink ?? '';

  const { data: followData, refetch: refetchFollow } = useQuery<{ isFollowing: boolean }>(
    IS_FOLLOWING_QUERY,
    { variables: { shortlink: ownerShortlink }, skip: !token || !ownerShortlink, fetchPolicy: 'cache-and-network' }
  );
  const isFollowing = followData?.isFollowing ?? false;
  const [followLoading, setFollowLoading] = useState(false);

  const [followMutate] = useMutation(FOLLOW_MUTATION, {
    refetchQueries: [{ query: MY_FOLLOWED_AUTHORS_QUERY }],
  });
  const [unfollowMutate] = useMutation(UNFOLLOW_MUTATION, {
    refetchQueries: [{ query: MY_FOLLOWED_AUTHORS_QUERY }],
  });

  const { data: likedData, refetch: refetchLiked } = useQuery<{ isLiked: boolean }>(
    IS_LIKED_QUERY,
    { variables: { productId: id }, skip: !token || !id, fetchPolicy: 'cache-and-network' }
  );
  const isLiked = likedData?.isLiked ?? false;
  const [likeLoading, setLikeLoading] = useState(false);

  const [likeMutate] = useMutation(LIKE_PRODUCT_MUTATION, {
    refetchQueries: [{ query: MY_LIKED_PRODUCTS_QUERY }],
  });
  const [unlikeMutate] = useMutation(UNLIKE_PRODUCT_MUTATION, {
    refetchQueries: [{ query: MY_LIKED_PRODUCTS_QUERY }],
  });

  const handleLikeToggle = async () => {
    if (!token) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await unlikeMutate({ variables: { productId: id } });
      } else {
        await likeMutate({ variables: { productId: id } });
      }
      await refetchLiked();
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!token) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowMutate({ variables: { shortlink: ownerShortlink } });
      } else {
        await followMutate({ variables: { shortlink: ownerShortlink } });
        if (product) trackEvent(profile.id, product.id, 'follow');
      }
      await refetchFollow();
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (product?.id && profile.id) trackEvent(profile.id, product.id, 'view');
  }, [product?.id, profile.id]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  const { data: reviewsData, refetch: refetchReviews } = useQuery(GET_PRODUCT_REVIEWS, {
    variables: { productId: id, page: 1, limit: 10 },
    skip: !id,
    fetchPolicy: 'cache-and-network'
  });

  const [addReviewMutate, { loading: reviewLoading }] = useMutation(ADD_REVIEW_MUTATION, {
    onCompleted: () => {
      setNewReviewComment('');
      setNewReviewRating(5);
      refetchReviews();
    }
  });

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
  const isOwner = !!profile.id && profile.id === product.store.owner.id;

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
    trackEvent(profile.id, product.id, 'cart');
  };

  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !id) return;
    addReviewMutate({ variables: { productId: id, rating: newReviewRating, comment: newReviewComment } });
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

              {/* Comments / Discussions Trigger */}
              <div className="mt-8 border-t border-outline-variant/15 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <span>Thảo luận chung</span>
                  </h3>
                </div>

                <div className="bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl p-6 text-center">
                  <MessageSquare size={32} className="mx-auto mb-3 text-[#F65C88]/50" />
                  <p className="text-sm text-on-surface-variant mb-4">Chia sẻ suy nghĩ, hỏi đáp với nghệ sĩ và cộng đồng về tài nguyên này.</p>
                  <button
                    onClick={() => setIsCommentsOpen(true)}
                    className="px-6 py-2.5 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-2xl text-sm font-semibold shadow-md transition-colors inline-flex items-center gap-2"
                  >
                    Mở hộp thoại thảo luận
                  </button>
                </div>
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
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="font-bold text-on-surface">
                    {(reviewsData as any)?.productReviews?.averageRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="text-xs">({(reviewsData as any)?.productReviews?.totalItems || 0} đánh giá)</span>
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
                {!isOwner && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading || !token}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap disabled:opacity-50 ${
                      isFollowing
                        ? 'bg-transparent border border-[#F65C88] text-[#F65C88] hover:bg-[#FFF1F3]'
                        : 'bg-white text-[#040316] hover:bg-white/90'
                    }`}
                  >
                    {followLoading ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                )}
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
                  {isOwner ? (
                    <button
                      onClick={() => navigate(`/asset/${product.id}/edit`)}
                      className="w-full py-4 rounded-full font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] text-white hover:scale-[1.01] active:scale-100"
                    >
                      <Pencil size={18} />
                      <span>Chỉnh sửa sản phẩm</span>
                    </button>
                  ) : (
                    <>
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
                        onClick={handleLikeToggle}
                        disabled={likeLoading || !token}
                        className={`w-full py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                          isLiked
                            ? 'bg-[#FFF1F3] border border-[#F65C88] text-[#F65C88] hover:bg-[#FFE4EA]'
                            : 'bg-[#E9E5FF] hover:bg-[#E3Dffd] text-[#635BFF]'
                        }`}
                      >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                        <span>{isLiked ? 'Đã thích' : 'Thêm vào bộ sưu tập'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-8 pt-8 border-t border-outline-variant/10">
                <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
                  <span>Đánh giá từ người mua</span>
                  <Badge variant="secondary">{(reviewsData as any)?.productReviews?.totalItems || 0}</Badge>
                </h3>

                {alreadyPurchased && (
                  <form onSubmit={handlePostReview} className="bg-surface-container-low rounded-2xl p-5 mb-6">
                    <h4 className="text-sm font-semibold mb-3">Đánh giá của bạn</h4>
                    <div className="flex gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewReviewRating(star)}
                          className={`hover:scale-110 transition-transform ${newReviewRating >= star ? 'text-amber-500' : 'text-on-surface-variant/30'}`}
                        >
                          <Star size={20} fill={newReviewRating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về tài nguyên này..."
                      rows={3}
                      className="w-full bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:border-tertiary focus:outline-none mb-3"
                    />
                    <button
                      type="submit"
                      disabled={reviewLoading || !newReviewComment.trim()}
                      className="px-5 py-2 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </form>
                )}

                <div className="space-y-4">
                  {(reviewsData as any)?.productReviews?.items?.map((r: any) => (
                    <div key={r.id} className="p-4 bg-white border border-outline-variant/10 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={r.user.avatarUrl || "https://ui-avatars.com/api/?name=" + r.user.fullName} alt={r.user.fullName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="text-sm font-semibold">{r.user.fullName}</div>
                          <div className="flex text-amber-500 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < r.rating ? "currentColor" : "none"} color={i < r.rating ? "currentColor" : "#ccc"} />
                            ))}
                          </div>
                        </div>
                        <div className="ml-auto text-xs text-on-surface-variant/60">
                          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                  {(reviewsData as any)?.productReviews?.items?.length === 0 && (
                    <div className="text-sm text-on-surface-variant/60 text-center py-4">Chưa có đánh giá nào.</div>
                  )}
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
        productId={product.id}
      />
    </div>
  );
};

export default ProductDetailPage;
