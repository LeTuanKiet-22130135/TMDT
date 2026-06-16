import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, LayoutGrid, Users, Settings, HelpCircle } from 'lucide-react';
import { SparkButton } from '../ui/SparkButton';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="hidden md:flex flex-col h-full overflow-y-auto bg-surface-container-low w-64 p-4 gap-2 font-label text-sm shadow-[32px_0_32px_-12px_rgba(26,25,47,0.06)] border-r border-outline-variant/15 shrink-0">
      <div className="px-4 py-6 mb-4">
        <h2 className="text-xl font-black text-tertiary font-headline">Khám phá</h2>
        <p className="text-xs text-on-surface-variant opacity-70">Tài nguyên chọn lọc</p>
      </div>
      <nav className="flex flex-col gap-1">
        <Link 
          className={`flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-300 ${
            currentPath === '/' 
              ? 'bg-surface-container-lowest text-tertiary shadow-sm' 
              : 'text-on-surface-variant hover:bg-surface-bright'
          }`} 
          to="/"
        >
          <Home size={20} fill={currentPath === '/' ? 'currentColor' : 'none'} />
          <span>Trang chủ</span>
        </Link>
        <Link 
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" 
          to="/"
        >
          <TrendingUp size={20} />
          <span>Thịnh hành</span>
        </Link>
        <Link 
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" 
          to="/"
        >
          <LayoutGrid size={20} />
          <span>Bộ sưu tập</span>
        </Link>
        <Link 
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" 
          to="/"
        >
          <Users size={20} />
          <span>Tác giả</span>
        </Link>
      </nav>
      
      {/* Tác giả đã đăng ký */}
      <div className="mt-8 px-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-4">Tác giả đã đăng ký</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container">
              <img className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtluSThhnYoePmLDCRSU_GSBw_VfMQOONhTs6eucDvi1uYfU4rza65Lv6DBt6uciYczZ_bd5vRt2l6I24Q7fwuYsCKfmcLlvVF2KV1VhuJefl8tRYscgLUqaMUsxLIoQLrUigKjfzEk_jMC6wMh9Y_Mgb-drl2_Liexezmv9Yn2VGaM39HcuzwTEFej7TkDTsJtso_iN_a2bxozXFhwrev1ozNole7eA-wFH4Zf9398W91JQ0AMxWkUednwnLrNNUE9KbtqIzSlgMg" alt="Studio Arid" />
            </div>
            <span className="text-xs font-semibold">Studio Arid</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-tertiary-container">
              <img className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJcjaFmuI06E2-7RyXXIWRgu0pKEvl_fyyWOEeyR8mli5DQG8Uws5CnhZwAKSicULujuUboDm2JjWQYcysyRZ5VOXloklP7R4Z9M9AqDhWfrefpdnufffJ3l2lYlRZ20JxHnagMBBgbfrcfAGR2nbwsRd2VJ3O5arbx4KcTx_6wHfglqmwEeCHF_lVvjjIZs-gxmSIDTq7nXchKPLOedlmYrH9T-HEoTVSuS50ZJVYy7YHbFpijGN24pFDx_8uqWhpVNzAGY1BFjrk" alt="Elena V." />
            </div>
            <span className="text-xs font-semibold">Elena V.</span>
          </div>
        </div>
      </div>
      
      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/10 pt-4">
        <SparkButton className="mb-4" onClick={() => alert('Nâng cấp Premium thành công!')}>
          Nâng cấp Premium
        </SparkButton>
        <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" href="#">
          <Settings size={20} />
          <span>Cài đặt</span>
        </a>
        <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-bright rounded-full transition-all" href="#">
          <HelpCircle size={20} />
          <span>Trợ giúp</span>
        </a>
      </div>
    </aside>
  );
};
