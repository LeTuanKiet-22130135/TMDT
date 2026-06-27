import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import starImg from '../../assets/images/texture/star.png';
import { Link } from 'react-router-dom';

interface StarProps {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: string;
}

export const CreateButton: React.FC = () => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [stars, setStars] = useState<StarProps[]>([]);
  const [clickCount, setClickCount] = useState(0);

  const triggerStars = () => {
    const newStars = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i + clickCount * 10,
      left: `${Math.random() * 80 + 10}%`,
      delay: `${Math.random() * 0.1}s`,
      duration: `${0.8 + Math.random() * 0.4}s`,
      size: `${12 + Math.random() * 12}px`
    }));
    setStars(prev => [...prev, ...newStars].slice(-16));
    setClickCount(prev => prev + 1);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => { setIsHovered(true); triggerStars(); }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={triggerStars}
    >
      <Link
        to="/create-product"
        className={`
          relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-white transition-all duration-300
          bg-gradient-to-r from-[#ffafb1] via-[#f65c88] to-[#db2e50] bg-[length:200%_auto]
          hover:shadow-[0_0_20px_rgba(246,92,136,0.4)] focus:outline-none hover:-translate-y-0.5
          ${isHovered ? 'animate-gradient' : ''}
        `}
      >
        {/* Floating Stars Container inside button */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {stars.map(star => (
            <img
              key={star.id}
              src={starImg}
              alt="star"
              className="absolute -bottom-4 opacity-0 animate-float-up drop-shadow-sm"
              style={{
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
              onAnimationEnd={() => {
                setStars(prev => prev.filter(s => s.id !== star.id));
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Plus size={18} className="stroke-[3px]" />
          <span>{t('header.create')}</span>
        </div>
      </Link>
    </div>
  );
};
