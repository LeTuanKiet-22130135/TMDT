import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHomeData } from './home.logic';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { AssetCard } from './AssetCard';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { Flame, Sparkles } from 'lucide-react';
import { LoadingSlime } from '../../components/ui/LoadingSlime';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { assets } = useHomeData();
  const [isLoading, setIsLoading] = useState(true);

  // Fake loading timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds loading
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface antialiased h-screen flex flex-col relative z-0 overflow-hidden">
      <Header />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto relative h-full">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ffafb1]/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
          
          {isLoading ? (
            <LoadingSlime />
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
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
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm font-semibold text-sm hover:border-[#f65c88] hover:text-[#f65c88] transition-all focus:outline-none focus:ring-2 focus:ring-[#ffafb1]">
                      {t('home.latest')}
                    </button>
                    <button className="px-6 py-2.5 rounded-full bg-[#040316] text-white shadow-md font-semibold text-sm hover:bg-[#db2e50] hover:shadow-lg transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#ffafb1]">
                      <Flame size={16} className="text-orange-400" />
                      {t('home.popular')}
                    </button>
                  </div>
                </div>
              </section>
              
              <ResponsiveMasonry columnsCountBreakPoints={{640: 1, 768: 2, 1024: 3, 1536: 4}}>
                <Masonry gutter="1.5rem">
                  {assets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
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

export default Home;
