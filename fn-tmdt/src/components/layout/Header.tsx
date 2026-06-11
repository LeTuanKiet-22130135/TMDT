import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isCustom = location.pathname === '/custom-requests';

  return (
    <header className="w-full sticky top-0 z-50 bg-surface shadow-sm flex items-center justify-between px-8 py-4 font-headline antialiased">
      <div className="flex items-center gap-8">
        <Link to="/" className="hidden md:flex items-center gap-4">
          <img src="/assets/img/logo.png" alt="Logo" className="w-12 h-12 img-pixelated" />
          <span className="text-2xl font-bold tracking-tight text-on-surface">Atélier</span>
        </Link>

        <div className="hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-full w-96">
          <Search className="text-on-surface-variant mr-2" size={20} />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder-on-surface-variant/60"
            placeholder="Tìm kiếm tài nguyên..."
            type="text"
          />
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        <Link 
          className={`transition-colors duration-200 ${
            isHome ? 'text-tertiary font-semibold border-b-2 border-tertiary' : 'text-on-surface-variant hover:text-tertiary'
          }`} 
          to="/"
        >
          Thư viện
        </Link>
        <Link 
          className={`transition-colors duration-200 ${
            isCustom ? 'text-tertiary font-semibold border-b-2 border-tertiary' : 'text-on-surface-variant hover:text-tertiary'
          }`} 
          to="/custom-requests"
        >
          Tạo mới
        </Link>
        <div className="flex items-center gap-4 ml-4">
          <button className="p-2 hover:bg-surface-bright rounded-full transition-colors duration-200">
            <Bell className="text-on-surface-variant" size={24} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-high scale-102 transition-transform duration-300 ease-out">
            <img
              alt="Hồ sơ người dùng"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgjenSZvmWQAHLKLu_fM4v9SZRZ5DPygvM4mF4-TlaoifBbIrtbx7MeVFpDB2CgAiBf6Olwz4ICP4Plwu_0wfr6r-N-ww-oFnsUeOMkWFCZ156VXAI6-zoqaMlPVQ1cxNZRWipMYMI9hvlB-aSrTz6cDJdt8v8cD9ZCeRcDBa5cSyGFLiMuffdtl8AbMa4HtDhvfdC3NwkAjOw2DAoum7ndBfvubfjy3t0mN2xPJZoRVeP1VS6yiFtETW8eVGimEItoeJTxP4ONZFz"
            />
          </div>
        </div>
      </nav>
    </header>
  );
};

