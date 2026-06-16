import React, { useState, useEffect } from 'react';
import frame0 from '../../assets/images/texture/loading_frame_0.png';
import frame1 from '../../assets/images/texture/loading_frame_1.png';

export const LoadingSlime: React.FC = () => {
  const [frame, setFrame] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    const messages = [
      "Lumine đang đọc suy nghĩ của bạn...",
      "Lumine đang tìm sở thích của bạn...",
      "Đợi tí, Lumine đang make up giao diện...",
      "Lumine đang pha cà phê để tải lẹ hơn...",
      "Lumine đang lục lọi vũ trụ để tìm tài nguyên cho bạn..."
    ];
    setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);

    const interval = setInterval(() => {
      setFrame(f => (f === 0 ? 1 : 0));
    }, 350); // Toggle speed for slime jump
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] animate-in fade-in duration-500">
      <div className="relative w-32 h-32 mb-8 flex items-end justify-center">
        <img 
          src={frame === 0 ? frame0 : frame1} 
          alt="Loading slime" 
          className="w-24 object-contain drop-shadow-lg transition-transform duration-300 ease-out"
          style={{ 
            transform: frame === 0 ? 'translateY(10px) scale(1, 0.9)' : 'translateY(-20px) scale(0.95, 1.05)',
            imageRendering: 'pixelated'
          }}
        />
        {/* Slime shadow */}
        <div 
          className="absolute bottom-0 w-20 h-3 bg-black/10 rounded-full blur-sm transition-all duration-300"
          style={{
            transform: frame === 0 ? 'scale(1)' : 'scale(0.6)',
            opacity: frame === 0 ? 0.8 : 0.3
          }}
        />
      </div>
      
      {/* Loading Bar */}
      <div className="w-64 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-[#ffafb1] to-[#9AC6FF] rounded-full" 
          style={{
            animation: 'fake-progress 2.5s ease-in-out forwards'
          }}
        />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-500 tracking-wide animate-pulse">
        {loadingMessage}
      </p>
      
      <style>{`
        @keyframes fake-progress {
          0% { width: 0%; }
          40% { width: 45%; }
          70% { width: 80%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
