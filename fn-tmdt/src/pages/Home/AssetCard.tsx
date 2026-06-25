import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { HomeProduct } from './home.logic';

interface AssetCardProps {
  product: HomeProduct;
}

export const AssetCard: React.FC<AssetCardProps> = ({ product }) => {
  const navigate = useNavigate();
  
  const formattedPrice = product.price === 0
    ? 'Miễn phí'
    : product.price.toLocaleString('vi-VN') + ' ₫';

  const avatarSrc = product.authorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(product.authorName)}&background=ffafb1&color=db2e50`;

  return (
    <div onClick={() => navigate(`/asset/${product.id}`)} className="group cursor-pointer block relative">
      <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1">
        {product.imageUrl ? (
          <img
            className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-105"
            alt={product.name}
            src={product.imageUrl}
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-[#FFC9D2]/30 to-[#9AC6FF]/20 flex items-center justify-center">
            <span className="text-[#040316]/20 text-xs">No image</span>
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end pt-12">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {product.authorShortlink ? (
                <Link
                  to={`/author/${product.authorShortlink}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                >
                  <img
                    src={avatarSrc}
                    alt={product.authorName}
                    className="w-7 h-7 rounded-full border border-white/20 object-cover"
                  />
                </Link>
              ) : (
                <img
                  src={avatarSrc}
                  alt={product.authorName}
                  className="w-7 h-7 rounded-full border border-white/20 object-cover shrink-0"
                />
              )}
              <div className="text-white min-w-0">
                <p className="text-[10px] opacity-75 font-medium leading-none truncate">{product.authorName}</p>
                <h3 className="font-headline font-bold text-xs md:text-sm line-clamp-1 mt-0.5">
                  {product.name}
                </h3>
              </div>
            </div>

            <span className="shrink-0 px-2.5 py-1 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-full text-[10px] md:text-xs font-bold shadow-sm transition-all duration-200">
              {formattedPrice}
            </span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="px-4 py-2 bg-white/95 text-[#F65C88] font-bold text-xs rounded-full shadow-lg scale-90 group-hover:scale-100 transition-all duration-300">
            Xem chi tiết
          </span>
        </div>
      </div>
    </div>
  );
};
