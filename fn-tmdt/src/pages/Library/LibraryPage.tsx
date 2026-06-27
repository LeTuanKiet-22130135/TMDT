import React from 'react';
import { useQuery } from '@apollo/client/react';
import { Download, BookOpen, Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { BottomNav } from '../../components/layout/BottomNav';
import { MY_PURCHASED_PRODUCTS_QUERY } from '../../graphql/product';
import { resolveMediaUrl } from '../../lib/media';

interface PurchasedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
  mainFileUrl: string | null;
  store: { name: string };
}

const API = import.meta.env.VITE_API_URL || '';

function formatPrice(price: number) {
  if (price === 0) return 'Miễn phí';
  return price.toLocaleString('vi-VN') + ' ₫';
}

export const LibraryPage: React.FC = () => {
  const token = localStorage.getItem('access_token');
  const { data, loading } = useQuery<{ myPurchasedProducts: PurchasedProduct[] }>(
    MY_PURCHASED_PRODUCTS_QUERY,
    { skip: !token, fetchPolicy: 'cache-and-network' }
  );

  const products = data?.myPurchasedProducts ?? [];

  return (
    <div className="bg-transparent font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f65c88]/10 text-[#f65c88] text-xs font-bold uppercase tracking-wider mb-4 border border-[#f65c88]/20">
            <BookOpen size={13} />
            Thư viện
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-[#040316] mb-1">
            Lịch sử mua hàng
          </h1>
          <p className="text-sm text-[#040316]/50">
            Tất cả tài nguyên bạn đã mua — tải về bất cứ lúc nào.
          </p>
        </div>

        {/* Content */}
        {!token ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#040316]/40">
            <BookOpen size={48} strokeWidth={1.2} />
            <p className="text-sm">Đăng nhập để xem thư viện của bạn.</p>
            <Link
              to="/login"
              className="px-6 py-2 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full text-sm font-bold"
            >
              Đăng nhập
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-[#F65C88]" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#040316]/40">
            <ShoppingBag size={48} strokeWidth={1.2} />
            <p className="text-sm">Bạn chưa mua tài nguyên nào.</p>
            <Link
              to="/"
              className="px-6 py-2 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full text-sm font-bold"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {products.map((p) => {
              const thumb = resolveMediaUrl(p.imageUrls?.[0]);
              const downloadUrl = p.mainFileUrl
                ? `${API}${p.mainFileUrl.startsWith('/') ? '' : '/'}${p.mainFileUrl}`
                : null;

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-5 bg-white/70 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <Link to={`/asset/${p.id}`} className="shrink-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={p.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#FFC9D2]/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#FFC9D2]/20 flex items-center justify-center">
                        <BookOpen size={20} className="text-[#F65C88]/50" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/asset/${p.id}`}>
                      <h3 className="font-bold text-[#040316] text-sm truncate hover:text-[#F65C88] transition-colors">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-[#040316]/50 mt-0.5">{p.store.name}</p>
                    <p className="text-xs font-semibold text-[#F65C88] mt-1">
                      {formatPrice(p.price)}
                    </p>
                  </div>

                  {/* Download */}
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      download
                      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:opacity-95 active:scale-[0.97] transition-all"
                    >
                      <Download size={13} />
                      Tải về
                    </a>
                  ) : (
                    <span className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-full text-xs font-bold cursor-not-allowed">
                      <Download size={13} />
                      Chưa có file
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default LibraryPage;
