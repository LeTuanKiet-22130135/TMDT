import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Plus, LayoutGrid, User } from "lucide-react";

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low border-t border-outline-variant/10 flex justify-around items-center py-3 px-6 z-50">
      <Link
        className={`flex flex-col items-center gap-1 ${currentPath === "/" ? "text-tertiary font-bold" : "text-on-surface-variant"}`}
        to="/"
      >
        <Home size={24} fill={currentPath === "/" ? "currentColor" : "none"} />
        <span className="text-[10px]">Trang chủ</span>
      </Link>
      <Link
        className={`flex flex-col items-center gap-1 ${currentPath === "/custom-requests" ? "text-tertiary font-bold" : "text-on-surface-variant"}`}
        to="/custom-requests"
      >
        <Compass size={24} />
        <span className="text-[10px]">Yêu cầu</span>
      </Link>
      <div className="relative -top-6">
        <button
          onClick={() => alert("Chức năng tạo mới nhanh đang phát triển!")}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF9FB1] to-[#DB2E50] shadow-lg flex items-center justify-center text-white"
        >
          <Plus size={32} />
        </button>
      </div>
      <Link
        className="flex flex-col items-center gap-1 text-on-surface-variant"
        to="/"
      >
        <User size={24} />
        <span className="text-[10px]">Hồ sơ</span>
      </Link>
    </nav>
  );
};
