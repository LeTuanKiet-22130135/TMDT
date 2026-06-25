import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHomeProducts } from './home.logic';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { AssetCard } from './AssetCard';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { Sparkles } from 'lucide-react';
import { LoadingSlime } from '../../components/ui/LoadingSlime';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { products, loading, hasMore, loadMore } = useHomeProducts();
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
    <div className="bg-surface font-body text-on-surface antialiased h-screen flex flex-col relative z-0 overflow-hidden">
      <Header />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto relative h-full">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ffafb1]/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

          <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
                  <Sparkles size={14} />
                  Top Picks
                </div>
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-[#040316] mb-3">
                  {t('home.title')}
                </h1>
                <p className="text-gray-500 max-w-xl text-lg leading-relaxed">
                  {t('home.subtitle')}
                </p>
              </div>
            </div>
          </section>

          {loading && products.length === 0 ? (
            <LoadingSlime />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#040316]/40">
              <p className="text-sm">Chưa có sản phẩm nào.</p>
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

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-8 flex justify-center">
                {loading && (
                  <div className="w-6 h-6 border-2 border-[#F65C88]/30 border-t-[#F65C88] rounded-full animate-spin" />
                )}
                {!hasMore && products.length > 0 && (
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
