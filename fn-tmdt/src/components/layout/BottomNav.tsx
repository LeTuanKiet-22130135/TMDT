import React from 'react';
import { Home, Compass, Plus, LayoutGrid, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low border-t border-outline-variant/10 flex justify-around items-center py-3 px-6 z-50">
      <a className="flex flex-col items-center gap-1 text-tertiary" href="#">
        <Home size={24} fill="currentColor" />
        <span className="text-[10px] font-bold">Trang chủ</span>
      </a>
      <a className="flex flex-col items-center gap-1 text-on-surface-variant" href="#">
        <Compass size={24} />
        <span className="text-[10px]">Khám phá</span>
      </a>
      <div className="relative -top-6">
        <button className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF9FB1] to-[#DB2E50] shadow-lg flex items-center justify-center text-white">
          <Plus size={32} />
        </button>
      </div>
      <a className="flex flex-col items-center gap-1 text-on-surface-variant" href="#">
        <LayoutGrid size={24} />
        <span className="text-[10px]">Thư viện</span>
      </a>
      <a className="flex flex-col items-center gap-1 text-on-surface-variant" href="#">
        <User size={24} />
        <span className="text-[10px]">Hồ sơ</span>
      </a>
    </nav>
  );
};
