import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice, calcItemSubtotal } from './cart.logic';
import type { CartItem as CartItemType } from './cart.logic';

interface Props {
  item: CartItemType;
}

export const CartItem: React.FC<Props> = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#FFC9D2]/40 last:border-0">
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

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <button
          onClick={() => removeItem(item.productId)}
          className="text-[#040316]/30 hover:text-[#F65C88] transition-colors"
          aria-label="Xoá sản phẩm"
        >
          <Trash2 size={14} />
        </button>

        <div className="flex items-center gap-1.5 bg-[#FBFBFE] border border-[#FFC9D2]/60 rounded-full px-1.5 py-0.5">
          <button
            onClick={() => updateQuantity(item.productId, -1)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#FFC9D2]/40 transition-colors text-[#040316]/70"
            aria-label="Giảm số lượng"
          >
            <Minus size={11} strokeWidth={2.5} />
          </button>
          <span className="text-xs font-bold text-[#040316] w-5 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.productId, 1)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#FFC9D2]/40 transition-colors text-[#040316]/70"
            aria-label="Tăng số lượng"
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-xs font-semibold text-[#040316]/70">{formatPrice(calcItemSubtotal(item))}</p>
      </div>
    </div>
  );
};
