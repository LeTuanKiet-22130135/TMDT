import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Loader2, Lock, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../components/Cart/cart.logic';
import { resolveMediaUrl } from '../../lib/media';
import { Header } from '../../components/layout/Header';

const API = import.meta.env.VITE_API_URL || '';

// Group cart items by storeName
function groupByStore(items: ReturnType<typeof useCart>['items']) {
  const map = new Map<string, { storeName: string; items: typeof items }>();
  for (const item of items) {
    const existing = map.get(item.storeName);
    if (existing) existing.items.push(item);
    else map.set(item.storeName, { storeName: item.storeName, items: [item] });
  }
  return Array.from(map.values());
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem } = useCart();
  const [tips, setTips] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = groupByStore(items);
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const totalTips = Object.values(tips).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const total = subtotal + totalTips;

  const handleCheckout = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/v1/checkout-digital/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_ids: items.map((i) => i.productId),
          tips: Object.fromEntries(
            Object.entries(tips)
              .filter(([, v]) => parseInt(v) > 0)
              .map(([k, v]) => [k, parseInt(v)])
          ),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Checkout thất bại');

      // Redirect to VNPay
      window.location.href = data.payment_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#040316]/40">
          <ShoppingBag size={48} strokeWidth={1.2} />
          <p className="text-sm font-medium">Giỏ hàng trống</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 bg-[#F65C88] text-white rounded-full text-sm font-bold"
          >
            Khám phá ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Xác nhận đơn hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — items + tips */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Items */}
            <div className="bg-white/70 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#FFC9D2]/20 flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#F65C88]" />
                <span className="font-bold text-sm">{items.length} tài nguyên</span>
              </div>
              <div className="divide-y divide-[#FFC9D2]/20">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <img
                      src={resolveMediaUrl(item.image)}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[#040316]/50 mt-0.5">{item.storeName}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-bold text-[#F65C88] text-sm">{formatPrice(item.price)}</span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-[#040316]/25 hover:text-[#F65C88] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips per author/store */}
            <div className="bg-white/70 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#FFC9D2]/20 flex items-center gap-2">
                <Heart size={16} className="text-[#F65C88]" />
                <span className="font-bold text-sm">Tip cho tác giả</span>
                <span className="text-xs text-[#040316]/40 ml-1">— tuỳ chọn</span>
              </div>
              <div className="divide-y divide-[#FFC9D2]/20">
                {grouped.map((group) => {
                  const storeTotal = group.items.reduce((s, i) => s + i.price, 0);
                  return (
                    <div key={group.storeName} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FFC9D2] flex items-center justify-center font-bold text-[#F65C88] text-sm flex-shrink-0">
                        {group.storeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{group.storeName}</p>
                        <p className="text-xs text-[#040316]/50">{group.items.length} tài nguyên · {formatPrice(storeTotal)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#040316]/50">Tip</span>
                        <input
                          type="number"
                          min={0}
                          step={5000}
                          placeholder="0"
                          value={tips[group.storeName] ?? ''}
                          onChange={(e) =>
                            setTips((prev) => ({ ...prev, [group.storeName]: e.target.value }))
                          }
                          className="w-28 text-right text-sm font-bold border border-[#FFC9D2]/50 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#F65C88] bg-white/80"
                        />
                        <span className="text-xs text-[#040316]/40">₫</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 bg-[#FFF1F3]/50">
                <p className="text-xs text-[#040316]/50 leading-relaxed">
                  Tip là cách để bạn ủng hộ tác giả trực tiếp. 100% tip đến tay tác giả.
                </p>
              </div>
            </div>
          </div>

          {/* Right — summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-2xl p-6 flex flex-col gap-4 sticky top-24">
              <h2 className="font-bold text-base">Tóm tắt thanh toán</h2>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#040316]/60">Tài nguyên ({items.length})</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {totalTips > 0 && (
                  <div className="flex justify-between text-[#F65C88]">
                    <span>Tip tác giả</span>
                    <span className="font-semibold">+{formatPrice(totalTips)}</span>
                  </div>
                )}
                <div className="border-t border-[#FFC9D2]/30 pt-2 flex justify-between font-extrabold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-[#F65C88]">{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Thanh toán qua VNPay</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#040316]/40">
                <Lock size={10} />
                <span>Bảo mật bởi VNPay · SSL encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
