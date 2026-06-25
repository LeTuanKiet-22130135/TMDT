import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingBag, Calendar, Globe, X, Link2, ArrowLeft, CheckCircle2, Crown } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { Badge } from '../../components/ui/Badge';
import { useAuthorData } from './author.logic';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

const formatPrice = (v: number) =>
  v === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(v) + ' ₫';

export const AuthorPage: React.FC = () => {
  const { shortlink } = useParams<{ shortlink: string }>();
  const { profile, products, loading, bannerImage } = useAuthorData(shortlink ?? '');
  const [isFollowing, setIsFollowing] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FBFBFE]">
        <div className="w-8 h-8 border-2 border-[#F65C88]/30 border-t-[#F65C88] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FBFBFE] text-[#040316]">
        <div className="text-center">
          <p className="text-lg font-semibold">Không tìm thấy tác giả</p>
          <Link to="/" className="text-[#F65C88] hover:underline mt-2 inline-block">
            Trở lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const social = profile.socialLinks as Record<string, string>;
  const avatarSrc = profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=ffafb1&color=db2e50`;

  return (
    <div className="bg-[#FBFBFE] font-body text-[#040316] antialiased h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">

          {/* Banner */}
          <div className="relative h-52 md:h-64 overflow-hidden">
            {bannerImage ? (
              <img src={bannerImage} alt="banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FFAFB1] to-[#9AC6FF]" />
            )}
            <Link
              to="/"
              className="absolute top-4 left-6 flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={15} />
              Quay lại
            </Link>
          </div>

          {/* Profile header */}
          <div className="px-6 md:px-12 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-14 md:-mt-16 mb-6">
              {/* Avatar */}
              <div className="flex items-end gap-5">
                <div className="relative shrink-0">
                  <img
                    src={avatarSrc}
                    alt={profile.fullName}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-[#FBFBFE] shadow-xl"
                  />
                  {profile.isVerified && (
                    <div className="absolute -bottom-1.5 -right-1.5 bg-[#F65C88] rounded-full p-1 shadow-md">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#040316]">
                      {profile.fullName}
                    </h1>
                    {profile.isGold && (
                      <Crown size={18} className="text-yellow-500 fill-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-[#040316]/50 mt-0.5">@{profile.shortlink}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 md:pb-2">
                {social.website && (
                  <a href={social.website} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-full bg-[#FFC9D2]/20 hover:bg-[#FFC9D2]/40 transition-colors text-[#040316]/60">
                    <Globe size={18} />
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-full bg-[#FFC9D2]/20 hover:bg-[#FFC9D2]/40 transition-colors text-[#040316]/60"
                    title="Twitter / X">
                    <X size={18} />
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-full bg-[#FFC9D2]/20 hover:bg-[#FFC9D2]/40 transition-colors text-[#040316]/60"
                    title="Instagram">
                    <Link2 size={18} />
                  </a>
                )}
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                    isFollowing
                      ? 'bg-transparent border-2 border-[#F65C88] text-[#F65C88]'
                      : 'bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white hover:opacity-90'
                  }`}
                >
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-[#040316]/60 leading-relaxed max-w-2xl mb-6">
                {profile.bio}
              </p>
            )}

            {/* Specialties */}
            {profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {profile.specialties.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-white rounded-2xl border border-[#FFC9D2]/30 p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#040316]/50 text-xs font-semibold">
                  <ShoppingBag size={14} />
                  Sản phẩm
                </div>
                <span className="text-2xl font-black text-[#040316]">{products.length}</span>
              </div>
              <div className="bg-white rounded-2xl border border-[#FFC9D2]/30 p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#040316]/50 text-xs font-semibold">
                  <Star size={14} />
                  Đánh giá
                </div>
                <span className="text-2xl font-black text-[#040316]">—</span>
              </div>
              <div className="bg-white rounded-2xl border border-[#FFC9D2]/30 p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#040316]/50 text-xs font-semibold">
                  <Calendar size={14} />
                  Thành viên từ
                </div>
                <span className="text-base font-bold text-[#040316]">{formatDate(profile.createdAt)}</span>
              </div>
            </div>

            {/* Products */}
            <div>
              <h2 className="text-lg font-extrabold text-[#040316] mb-5">
                Sản phẩm
                <span className="ml-2 text-sm font-normal text-[#040316]/40">({products.length})</span>
              </h2>

              {products.length === 0 ? (
                <div className="text-center py-16 text-[#040316]/40">
                  <p className="text-sm">Chưa có sản phẩm nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.id}`}
                      className="group bg-white rounded-2xl border border-[#FFC9D2]/30 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-[#FFC9D2]/10">
                        {p.imageUrls[0] ? (
                          <img
                            src={p.imageUrls[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#040316]/20 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-[#040316] truncate">{p.name}</p>
                        <p className="text-xs text-[#F65C88] font-bold mt-1">{formatPrice(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AuthorPage;
