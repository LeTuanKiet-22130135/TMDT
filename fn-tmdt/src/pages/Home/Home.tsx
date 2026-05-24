import React from 'react';
import { useHomeData } from './home.logic';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { AssetCard } from './AssetCard';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';

export const Home: React.FC = () => {
  const { assets } = useHomeData();

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
                  Bộ sưu tập tuần
                </h1>
                <p className="text-on-surface-variant max-w-xl text-lg">
                  Những tài nguyên cao cấp được chọn lọc thủ công từ các nhà sáng tạo đổi mới nhất thế giới. Chiều sâu, kết cấu và linh hồn trong từng byte.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-6 py-2 rounded-full bg-surface-container-high font-semibold text-sm hover:bg-surface-container-highest transition-colors">
                  Mới nhất
                </button>
                <button className="px-6 py-2 rounded-full bg-on-surface text-surface font-semibold text-sm hover:opacity-90 transition-opacity">
                  Phổ biến
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
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Home;
