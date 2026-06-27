import React, { useRef, useEffect, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { CartItem } from './CartItem';
import { formatPrice } from './cart.logic';

function useAnimatedPrice(target: number): string {
  const [displayed, setDisplayed] = useState(target);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const DURATION = 300;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / DURATION, 1);

      if (t < 1) {
        // random scramble until near end
        const rand = Math.floor(Math.random() * target * 1.5);
        setDisplayed(rand);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return formatPrice(displayed);
}

export const CartPanel: React.FC = () => {
  const { items, isOpen, closeCart, totalPrice } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const animatedPrice = useAnimatedPrice(totalPrice);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeCart();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeCart]);

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-[calc(100%+12px)] w-[360px] bg-[#FBFBFE] rounded-2xl shadow-xl border border-[#FFC9D2]/40 z-50 transition-all duration-200 origin-top-right ${
        isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#FFC9D2]/40">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#F65C88]" />
          <span className="font-bold text-[#040316] text-base">Giỏ hàng</span>
          {items.length > 0 && (
            <span className="bg-[#FFC9D2] text-[#040316] text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={closeCart}
          className="p-1.5 rounded-full hover:bg-[#FFC9D2]/30 transition-colors text-[#040316]/50 hover:text-[#040316]"
          aria-label="Đóng giỏ hàng"
        >
          <X size={16} />
        </button>
      </div>

      {/* Items */}
      <div className="px-5 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#FFC9D2]/60 scrollbar-track-transparent">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#040316]/40">
            <ShoppingBag size={40} strokeWidth={1.2} />
            <p className="text-sm font-medium">Giỏ hàng trống</p>
          </div>
        ) : (
          items.map((item) => <CartItem key={item.id} item={item} />)
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="px-5 py-4 border-t border-[#FFC9D2]/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#040316]/60 font-medium">Tổng cộng</span>
            <span
              key={totalPrice}
              className="text-lg font-bold text-[#040316] tabular-nums transition-all"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {animatedPrice}
            </span>
          </div>
          <button
            onClick={() => { closeCart(); navigate('/checkout'); }}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98] transition-all duration-150"
          >
            Tiến hành thanh toán
          </button>
        </div>
      )}
    </div>
  );
};
