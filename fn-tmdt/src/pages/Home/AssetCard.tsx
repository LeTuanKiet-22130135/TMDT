import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import type { HomeProduct } from './home.logic';
import { resolveMediaUrl } from '../../lib/media';
import { useCart } from '../../contexts/CartContext';
import { usePurchasedProductIds } from '../../hooks/usePurchasedProductIds';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { trackEvent } from '../../services/redService';

interface AssetCardProps {
  product: HomeProduct;
}

export const AssetCard: React.FC<AssetCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const purchasedIds = usePurchasedProductIds();
  const { profile } = useUserProfile();
  const [imgLoaded, setImgLoaded] = useState(false);

  const inCart = items.some((i) => i.productId === product.id);
  const purchased = purchasedIds.has(product.id);

  const formattedPrice = product.price === 0
    ? 'Miễn phí'
    : product.price.toLocaleString('vi-VN') + ' ₫';

  const avatarSrc = product.authorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(product.authorName)}&background=ffafb1&color=db2e50`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (purchased || inCart) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: resolveMediaUrl(product.imageUrl),
      storeName: product.authorName,
    });
    trackEvent(profile.id, product.id, 'cart');
  };

  return (
    <div
      onClick={() => navigate(`/asset/${product.id}`)}
      className="group cursor-pointer block relative"
    >
      <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1">

        {/* Image */}
        <div className="relative w-full">
          {product.imageUrl ? (
            <>
              {!imgLoaded && (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#f5f5f5] via-[#ececec] to-[#f5f5f5] animate-pulse" />
              )}
              <img
                className={`w-full block object-cover transition-all duration-500 group-hover:scale-105 ${
                  imgLoaded ? 'h-auto opacity-100' : 'absolute inset-0 w-full h-full opacity-0'
                }`}
                alt={product.name}
                src={resolveMediaUrl(product.imageUrl)}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-[#FFC9D2]/30 to-[#9AC6FF]/20 flex items-center justify-center">
              <span className="text-[#040316]/20 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-6 flex flex-col gap-1 transition-all duration-300 group-hover:pt-10">

          {/* Author row — hidden when not hovered */}
          <div className="flex items-center gap-1.5 overflow-hidden max-h-0 opacity-0 group-hover:max-h-6 group-hover:opacity-100 transition-all duration-300">
            {product.authorShortlink ? (
              <Link
                to={`/author/${product.authorShortlink}`}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              >
                <img src={avatarSrc} alt={product.authorName} className="w-5 h-5 rounded-full border border-white/20 object-cover" />
              </Link>
            ) : (
              <img src={avatarSrc} alt={product.authorName} className="w-5 h-5 rounded-full border border-white/20 object-cover shrink-0" />
            )}
            <p className="text-[10px] text-white/60 font-medium truncate">{product.authorName}</p>
          </div>

          {/* "Xem chi tiết" — hidden when not hovered */}
          <p className="text-[10px] text-[#FFC9D2]/80 font-semibold tracking-wide uppercase leading-none overflow-hidden max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-100 transition-all duration-300">
            Xem chi tiết →
          </p>

          {/* Product name */}
          <h3 className="font-headline font-bold text-xs md:text-sm text-white line-clamp-1 leading-tight">
            {product.name}
          </h3>

          {/* Price + cart button */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            {product.price === 0 ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] text-white shadow-sm animate-pulse">
                ✦ Miễn phí
              </span>
            ) : (
              <span className="text-[#FFC9D2] font-bold text-xs">{formattedPrice}</span>
            )}

            <button
              onClick={handleAddToCart}
              disabled={purchased}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 shrink-0 ${
                purchased
                  ? 'bg-gray-400/70 text-white cursor-not-allowed'
                  : inCart
                    ? 'bg-green-500/90 text-white'
                    : 'bg-[#F65C88] hover:bg-[#F65C88]/90 text-white active:scale-95'
              }`}
              aria-label={purchased ? 'Đã mua' : inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
            >
              <Check size={11} strokeWidth={3} />
              <span>{purchased ? 'Đã mua' : inCart ? 'Đã thêm' : 'Thêm'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
