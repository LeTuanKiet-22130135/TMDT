import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Users, ShoppingBag, Calendar, Globe, X, Link2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { AssetCard } from '../Home/AssetCard';
import { Badge } from '../../components/ui/Badge';
import { useAuthorData } from './author.logic';

export const AuthorPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { profile, authorAssets, avgRating, totalReviews, bannerImage } = useAuthorData(handle ?? '');
  const [isFollowing, setIsFollowing] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface text-on-surface">
        <div className="text-center">
          <p className="text-lg font-semibold">Không tìm thấy tác giả</p>
          <Link to="/" className="text-tertiary hover:underline mt-2 inline-block">
            Trở lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">

          {/* Banner */}
          <div className="relative h-52 md:h-64 overflow-hidden">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt="banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FFAFB1] to-[#9AC6FF]" />
            )}
            {/* Back link */}
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
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-surface shadow-xl"
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 bg-[#F65C88] rounded-full p-1 shadow-md">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-on-surface">
                    {profile.name}
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-0.5">@{profile.handle}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 md:pb-2">
                {profile.socialLinks.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  >
                    <Globe size={18} />
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface-variant"
                    title="Twitter / X"
                  >
                    <X size={18} />
                  </a>
                )}
                {profile.socialLinks.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface-variant"
                    title="Instagram"
                  >
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
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl mb-6">
              {profile.bio}
            </p>

            {/* Specialties */}
            <div className="flex flex-wrap gap-2 mb-8">
              {profile.specialties.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
                  <Users size={14} />
                  Người theo dõi
                </div>
                <span className="text-2xl font-black text-on-surface">{profile.followers}</span>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
                  <ShoppingBag size={14} />
                  Đã bán
                </div>
                <span className="text-2xl font-black text-on-surface">{profile.totalSales.toLocaleString()}</span>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
                  <Star size={14} />
                  Đánh giá trung bình
                </div>
                <span className="text-2xl font-black text-on-surface">
                  {avgRating.toFixed(1)}
                  <span className="text-sm font-normal text-on-surface-variant ml-1">/ 5</span>
                </span>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
                  <Calendar size={14} />
                  Thành viên từ
                </div>
                <span className="text-base font-bold text-on-surface">{profile.memberSince}</span>
              </div>
            </div>

            {/* Products section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold font-headline text-on-surface">
                  Sản phẩm của {profile.name}
                  <span className="ml-2 text-sm font-normal text-on-surface-variant">
                    ({authorAssets.length} sản phẩm • {totalReviews} đánh giá)
                  </span>
                </h2>
              </div>

              {authorAssets.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <p className="text-sm">Chưa có sản phẩm nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                  {authorAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
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
