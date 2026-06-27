import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { AssetCard } from '../Home/AssetCard';
import { FOLLOWING_FEED_QUERY } from '../../graphql/product';

interface FeedProduct {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  store: { id: string; name: string; owner: { username: string; fullName: string; avatarUrl: string | null; shortlink: string } };
}

export const FollowingFeedPage: React.FC = () => {
  const token = localStorage.getItem('access_token');

  const { data, loading } = useQuery<{
    followingFeed: { items: FeedProduct[]; totalItems: number };
  }>(FOLLOWING_FEED_QUERY, {
    variables: { page: 1, limit: 50 },
    skip: !token,
    fetchPolicy: 'cache-and-network',
  });

  const products = (data?.followingFeed.items ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrls?.[0] ?? null,
    tags: [],
    licenseType: '',
    createdAt: '',
    authorName: p.store.owner.fullName || p.store.name,
    authorAvatar: p.store.owner.avatarUrl,
    authorShortlink: p.store.owner.shortlink,
  }));

  return (
    <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col relative z-0 overflow-hidden">
      <Header />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto relative h-full">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
              <Users size={13} />
              Đang theo dõi
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-[#040316] mb-1">
              Feed của bạn
            </h1>
            <p className="text-sm text-[#040316]/50">
              Bài đăng mới nhất từ các tác giả bạn theo dõi.
            </p>
          </div>

          {!token ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#040316]/40">
              <Users size={48} strokeWidth={1.2} />
              <p className="text-sm">Đăng nhập để xem feed.</p>
              <Link to="/login" className="px-6 py-2 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full text-sm font-bold">
                Đăng nhập
              </Link>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-[#F65C88]" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#040316]/40">
              <Users size={48} strokeWidth={1.2} />
              <p className="text-sm">Chưa có bài đăng nào. Hãy theo dõi thêm tác giả!</p>
              <Link to="/" className="px-6 py-2 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full text-sm font-bold">
                Khám phá tác giả
              </Link>
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

export default FollowingFeedPage;
