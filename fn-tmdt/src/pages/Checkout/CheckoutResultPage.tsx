import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../components/Cart/cart.logic';

const API = import.meta.env.VITE_API_URL || '';

type Status = 'verifying' | 'success' | 'failed';

export const CheckoutResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const verify = async () => {
      const query = searchParams.toString();
      if (!query) {
        setStatus('failed');
        setMessage('Không có thông tin thanh toán.');
        return;
      }

      try {
        const res = await fetch(`${API}/api/v1/checkout-digital/verify?${query}`);
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setAmount(data.amount);
          clearCart();
        } else {
          setStatus('failed');
          setMessage(data.message);
        }
      } catch {
        setStatus('failed');
        setMessage('Không thể xác minh thanh toán. Vui lòng liên hệ hỗ trợ.');
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-transparent font-body flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-3xl p-10 max-w-md w-full flex flex-col items-center gap-6 shadow-xl">

        {status === 'verifying' && (
          <>
            <Loader2 size={56} className="animate-spin text-[#F65C88]" />
            <div className="text-center">
              <h1 className="font-headline text-2xl font-extrabold mb-2">Đang xác minh…</h1>
              <p className="text-sm text-[#040316]/50">Vui lòng chờ trong giây lát</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={48} className="text-green-500" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="font-headline text-2xl font-extrabold mb-1">Thanh toán thành công!</h1>
              <p className="text-sm text-[#040316]/50 mb-3">{message}</p>
              {amount > 0 && (
                <div className="inline-block bg-[#FFF1F3] border border-[#FFD9E0] rounded-2xl px-6 py-3">
                  <p className="text-xs text-[#040316]/50 mb-1">Tổng đã thanh toán</p>
                  <p className="font-extrabold text-2xl text-[#F65C88]">{formatPrice(amount)}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-[#040316]/40 text-center">
              Tài nguyên đã được kích hoạt trong thư viện của bạn. Cảm ơn bạn đã ủng hộ tác giả!
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 border border-[#FFC9D2] text-[#F65C88] rounded-full font-bold text-sm hover:bg-[#FFF1F3] transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={15} />
                Tiếp tục mua
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle size={48} className="text-red-400" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="font-headline text-2xl font-extrabold mb-1">Thanh toán thất bại</h1>
              <p className="text-sm text-[#040316]/50">{message}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 py-3 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full font-bold text-sm"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 border border-[#FFC9D2] text-[#F65C88] rounded-full font-bold text-sm hover:bg-[#FFF1F3] transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutResultPage;
