import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TAGLINES = [
  'Shiro tìm được rồi đấy — còn bạn thì chưa.',
  'Pixels đẹp tới mức bạn không nỡ dùng vào slide thuyết trình.',
  'Nghệ thuật số. Không cần máy in. Không cần giải thích.',
  'Tác giả đổ mồ hôi, bạn thêm vào giỏ — ai cũng vui.',
  'Cảm hứng không gõ cửa, nó nằm sẵn ở đây rồi.',
  'Đẹp theo nghĩa đen. Theo nghĩa bóng cũng được.',
  'File .zip nhỏ, ước mơ lớn.',
  'Mua một lần, dùng mãi — trừ khi bạn đổi style mỗi tuần.',
  'Các tác giả Việt đang chờ bạn khám phá. Đừng để họ chờ lâu.',
  'Không gian sáng tạo của bạn, nhưng đẹp hơn hẳn.',
];
import { useHomeProducts, useFilteredProducts, usePersonalizedFeed } from './home.logic';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { AssetCard } from './AssetCard';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { LoadingSlime } from '../../components/ui/LoadingSlime';
import { useSearchFilters } from '../../contexts/SearchFilterContext';
import notFoundIcon from '../../assets/images/404-icon.png';
import shiroEnable from '../../assets/images/texture/shiro_enable.png';
import { useUserProfile } from '../../contexts/UserProfileContext';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { activeFilters, clearFilters, aiResults, aiPrompt, aiStep, aiSearchLoading, clearAISearch } = useSearchFilters();
  const { profile } = useUserProfile();
  const { products: filteredProducts, loading: filterLoading, isActive } = useFilteredProducts(activeFilters);
  const skipGeneralFeed = !!profile.id || !!aiResults || isActive;
  const { products: allProducts, loading: allLoading, hasMore: allHasMore, reachedMax: allReachedMax, loadMore: allLoadMore, refresh: allRefresh } = useHomeProducts(skipGeneralFeed);
  const { products: personalizedProducts, loading: personalizedLoading, hasMore: pHasMore, reachedMax: pReachedMax, loadMore: pLoadMore, refresh: pRefresh } = usePersonalizedFeed(profile.id || null);
  const isAISearch = !!aiResults;
  const isPersonalized = !!profile.id && !isActive && !isAISearch;
  const products = isAISearch ? (aiResults as typeof allProducts) : (isActive ? filteredProducts : (isPersonalized ? personalizedProducts : allProducts));
  const loading = isAISearch ? false : (isActive ? filterLoading : (isPersonalized ? personalizedLoading : allLoading));
  const hasMore = isPersonalized ? pHasMore : allHasMore;
  const reachedMax = isPersonalized ? pReachedMax : allReachedMax;
  const loadMore = isPersonalized ? pLoadMore : allLoadMore;
  const refresh = isPersonalized ? pRefresh : allRefresh;
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col relative z-0 overflow-hidden">
      <Header />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto relative h-full">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ffafb1]/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

          <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                {isAISearch ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
                    <img src={shiroEnable} alt="Shiro" className="w-3.5 h-3.5 object-contain" />
                    Shiro AI
                    <button onClick={clearAISearch} className="ml-0.5 hover:text-[#db2e50] transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ) : isActive ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#040316]/8 text-[#040316] text-xs font-bold uppercase tracking-wider mb-4 border border-[#040316]/15">
                    <SlidersHorizontal size={13} />
                    Đang lọc
                    <button onClick={clearFilters} className="ml-0.5 hover:text-[#f65c88] transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ) : isPersonalized ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
                    <Sparkles size={14} />
                    Dành cho bạn
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
                    <Sparkles size={14} />
                    Top Picks
                  </div>
                )}
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-[#040316] mb-3">
                  {t('home.title')}
                </h1>
                <p className="text-gray-500 max-w-xl text-lg leading-relaxed">
                  {tagline}
                </p>
              </div>
            </div>
          </section>

          {aiSearchLoading || (loading && products.length === 0) ? (
            <LoadingSlime />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 select-none">
              {isAISearch && aiStep === 'notfound' ? (
                <>
                  <img src={notFoundIcon} alt="404" className="w-32 h-32 object-contain mb-6 opacity-80" />
                  <p className="text-lg font-bold text-[#040316] mb-1">Ôi thôi... chúng tôi đã cố lắm rồi.</p>
                  <p className="text-sm text-[#040316]/50 mb-1">Shiro tìm tiếng Việt, tiếng Anh, nới lỏng hết mức rồi mà vẫn bó tay.</p>
                  <p className="text-xs text-[#040316]/30 mb-5">"{aiPrompt}"</p>
                  <button
                    onClick={clearAISearch}
                    className="px-5 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] hover:opacity-90 transition-all shadow-sm"
                  >
                    Thử câu khác
                  </button>
                </>
              ) : isAISearch ? (
                <>
                  <img src={shiroEnable} alt="Shiro" className="w-10 h-10 object-contain opacity-40 mb-3" />
                  <p className="text-sm text-[#040316]/40">Shiro không tìm thấy sản phẩm phù hợp với "{aiPrompt}"</p>
                  <button onClick={clearAISearch} className="mt-3 text-xs text-[#f65c88] hover:underline">Xóa tìm kiếm</button>
                </>
              ) : (
                <p className="text-sm text-[#040316]/40">Chưa có sản phẩm nào.</p>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <ResponsiveMasonry columnsCountBreakPoints={{ 640: 1, 768: 2, 1024: 3, 1536: 4 }}>
                <Masonry gutter="1.5rem">
                  {products.map((product) => (
                    <AssetCard key={product.id} product={product} />
                  ))}
                </Masonry>
              </ResponsiveMasonry>

              {/* Infinite scroll sentinel — hidden when filter or AI search active */}
              <div ref={(isActive || isAISearch) ? undefined : sentinelRef} className="py-8 flex flex-col items-center gap-3">
                {loading && (
                  <div className="w-6 h-6 border-2 border-[#F65C88]/30 border-t-[#F65C88] rounded-full animate-spin" />
                )}
                {reachedMax && (
                  <>
                    <p className="text-xs text-[#040316]/40">Đã hiển thị 100 sản phẩm</p>
                    <button
                      onClick={refresh}
                      className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white hover:opacity-90 transition-all shadow-sm"
                    >
                      <Sparkles size={14} />
                      Làm mới
                    </button>
                  </>
                )}
                {!hasMore && !reachedMax && products.length > 0 && (
                  <p className="text-xs text-[#040316]/30">Đã hiển thị tất cả sản phẩm</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Home;
