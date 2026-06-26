import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../components/Cart/cart.logic';
import shiroEnable from '../../assets/images/texture/shiro_enable.png';

const API = import.meta.env.VITE_API_URL || '';

// ── Plexus ───────────────────────────────────────────────────────────────────

const COLORS = ['#FFC9D2', '#F65C88', '#8CB9FF', '#FFB3C6', '#C4D9FF', '#FF9FB1'];
const N = 70;
const MAX_DIST = 140;
const MOUSE_DIST = 110;

interface Dot {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
}

function PlexusBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const dots: Dot[] = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);

    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      for (const d of dots) {
        // gentle mouse repel
        const dx = d.x - mouse.current.x;
        const dy = d.y - mouse.current.y;
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < MOUSE_DIST && md > 0) {
          const f = (MOUSE_DIST - md) / MOUSE_DIST * 0.015;
          d.vx += (dx / md) * f;
          d.vy += (dy / md) * f;
        }

        // dampen + move
        d.vx *= 0.99;
        d.vy *= 0.99;
        d.x += d.vx;
        d.y += d.vy;

        // wrap
        if (d.x < 0) d.x = W;
        if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H;
        if (d.y > H) d.y = 0;
      }

      // connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(246,92,136,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // dots
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color + '55';
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
    <div className="relative min-h-screen font-body flex items-center justify-center px-4">
      <PlexusBackground />

      <div
        className="relative z-10 bg-white/80 backdrop-blur-md border border-[#FFC9D2]/40 rounded-3xl p-10 max-w-md w-full flex flex-col items-center gap-6 shadow-2xl"
      >
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
            {/* Shiro icon with glow ring */}
            <div className="relative flex items-center justify-center w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFC9D2]/60 to-[#8CB9FF]/40 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-white/70 backdrop-blur-sm" />
              <img
                src={shiroEnable}
                alt="Shiro"
                className="relative w-14 h-14 drop-shadow-lg animate-bounce"
                style={{ animationDuration: '2s' }}
              />
            </div>

            <div className="text-center">
              <h1 className="font-headline text-2xl font-extrabold mb-1 bg-gradient-to-r from-[#F65C88] to-[#8CB9FF] bg-clip-text text-transparent">
                Thanh toán thành công!
              </h1>
              <p className="text-sm text-[#040316]/50 mb-3">{message}</p>
              {amount > 0 && (
                <div className="inline-block bg-gradient-to-br from-[#FFF1F3] to-[#F0F5FF] border border-[#FFD9E0] rounded-2xl px-6 py-3">
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
                className="flex-1 py-3 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
