import React from 'react';
import { TrendingUp, Loader2, Flame, Sparkles } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { AssetCard } from '../Home/AssetCard';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useTrendingPage } from './trending.logic';

export const TrendingPage: React.FC = () => {
  const { profile } = useUserProfile();
  const { selectedTag, setSelectedTag, popularTags, tagsLoading, products, loading } =
    useTrendingPage();

  const userSpecialties = profile.specialties ?? [];
  const token = localStorage.getItem('access_token');

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col relative z-0 overflow-hidden">
      <Header />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto relative h-full">
          {/* Page header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
              <TrendingUp size={13} />
              Thịnh hành
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-[#040316] mb-1">
              Bán chạy nhất
            </h1>
            <p className="text-sm text-[#040316]/50">
              Sản phẩm được mua nhiều nhất — lọc theo chủ đề bạn thích.
            </p>
          </div>

          {/* User specialties — "Có thể bạn thích" */}
          {token && userSpecialties.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-[#f65c88]" />
                <span className="text-xs font-bold text-[#040316]/60 uppercase tracking-wider">
                  Có thể bạn thích
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userSpecialties.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      selectedTag === tag
                        ? 'bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white border-transparent shadow-md'
                        : 'bg-[#f65c88]/10 text-[#db2e50] border-[#f65c88]/20 hover:bg-[#f65c88]/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular tags */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-[#f65c88]" />
              <span className="text-xs font-bold text-[#040316]/60 uppercase tracking-wider">
                Chủ đề phổ biến
              </span>
            </div>
            {tagsLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-7 w-20 rounded-full bg-[#f5f5f5] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      selectedTag === tag
                        ? 'bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white border-transparent shadow-md'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:bg-surface-bright hover:text-on-surface'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTag && !popularTags.includes(selectedTag) && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white border-transparent shadow-md"
                  >
                    {selectedTag} ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active filter indicator */}
          {selectedTag && (
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm text-[#040316]/50">Đang xem:</span>
              <span className="px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#db2e50] text-sm font-semibold border border-[#f65c88]/20">
                {selectedTag}
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-[#040316]/40 hover:text-[#db2e50] transition-colors"
              >
                Bỏ lọc
              </button>
            </div>
          )}

          {/* Products */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-[#F65C88]" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-[#040316]/40">
              <TrendingUp size={48} strokeWidth={1.2} />
              <p className="text-sm">
                {selectedTag
                  ? `Chưa có sản phẩm nào cho chủ đề "${selectedTag}".`
                  : 'Chưa có sản phẩm bán chạy.'}
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <ResponsiveMasonry columnsCountBreakPoints={{ 640: 1, 768: 2, 1024: 3, 1536: 4 }}>
                <Masonry gutter="1.5rem">
                  {products.map((p) => (
                    <AssetCard key={p.id} product={p} />
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default TrendingPage;
