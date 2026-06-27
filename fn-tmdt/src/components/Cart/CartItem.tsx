import React from 'react';
import { Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from './cart.logic';
import type { CartItem as CartItemType } from './cart.logic';

interface Props {
  item: CartItemType;
}

export const CartItem: React.FC<Props> = ({ item }) => {
  const { removeItem } = useCart();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#FFC9D2]/40 last:border-0">
      <img
        src={item.image}
        alt={item.name}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#040316] leading-tight truncate">{item.name}</p>
        <p className="text-xs text-[#040316]/50 mt-0.5 truncate">{item.storeName}</p>
        <p className="text-sm font-bold text-[#F65C88] mt-1">{formatPrice(item.price)}</p>
      </div>

      <button
        onClick={() => removeItem(item.productId)}
        className="text-[#040316]/30 hover:text-[#F65C88] transition-colors flex-shrink-0"
        aria-label="Xoá sản phẩm"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};
