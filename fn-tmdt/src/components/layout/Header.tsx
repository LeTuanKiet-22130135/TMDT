import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginModal } from '../Auth/LoginModal';
import { UserMenu } from '../User/UserMenu';
import { CreateButton } from '../ui/CreateButton';
import { SearchPanel } from './SearchPanel';
import { useCart } from '../../contexts/CartContext';
import { CartPanel } from '../Cart/CartPanel';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { toggleCart, totalItems, isOpen: isCartOpen } = useCart();

  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState<'shiro' | 'manual'>('shiro');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check auth status on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-surface shadow-sm flex items-center justify-between px-8 py-4 font-headline antialiased">
      <div className="flex items-center gap-8">
        <Link to="/" className="hidden md:flex items-center gap-3">
          <img src="/assets/img/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <span className="text-2xl font-bold tracking-tight text-on-surface">Lumine</span>
        </Link>

        <div 
          ref={searchContainerRef}
          className="hidden md:flex flex-col relative"
        >
          <div 
            className={`flex items-center bg-surface-container-low px-4 py-2 rounded-full w-96 transition-all ${
              isSearchPanelOpen ? 'shadow-md ring-2 ring-[#ffafb1]' : 'focus-within:shadow-md'
            } ${activeSearchTab === 'shiro' && isSearchPanelOpen ? 'opacity-80 bg-pink-50/30 border border-pink-100' : ''}`}
            onClick={() => setIsSearchPanelOpen(true)}
          >
            <Search className={activeSearchTab === 'shiro' && isSearchPanelOpen ? 'text-[#f65c88]' : 'text-on-surface-variant mr-2'} size={20} />
            <input
              className={`bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface outline-none ${
                activeSearchTab === 'shiro' && isSearchPanelOpen ? 'text-[#f65c88] font-medium placeholder-[#f65c88]' : 'placeholder-on-surface-variant/60'
              }`}
              placeholder={activeSearchTab === 'shiro' && isSearchPanelOpen ? t('header.shiroSearching') : t('header.searchPlaceholder')}
              type="text"
              disabled={activeSearchTab === 'shiro' && isSearchPanelOpen}
              readOnly={activeSearchTab === 'shiro' && isSearchPanelOpen}
            />
          </div>
          <SearchPanel 
            isOpen={isSearchPanelOpen} 
            activeTab={activeSearchTab} 
            onTabChange={setActiveSearchTab} 
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
          {t('header.library')}
        </Link>
        <CreateButton />
        
        <div className="flex items-center gap-4 ml-4">
          <button className="p-2 hover:bg-surface-bright rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ffafb1]">
            <Bell className="text-on-surface-variant" size={24} />
          </button>

          {/* Cart icon */}
          <div className="relative">
            <button
              onClick={toggleCart}
              className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ffafb1] ${
                isCartOpen ? 'bg-primary/40 text-[#F65C88]' : 'hover:bg-surface-bright text-on-surface-variant'
              }`}
              aria-label="Giỏ hàng"
            >
              <ShoppingCart size={24} />
            </button>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-linear-to-br from-[#FF9FB1] to-[#DB2E50] text-white text-[10px] font-bold px-1 shadow-sm pointer-events-none">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
            <CartPanel />
          </div>
          
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#f65c88] transition-colors focus:outline-none"
              >
                {t('header.login')}
              </button>
              <Link 
                to="/register"
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#f65c88] to-[#db2e50] rounded-full shadow-sm hover:shadow-md transition-all hover:opacity-90"
              >
                {t('header.register')}
              </Link>
            </div>
          )}
        </div>
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={handleLoginSuccess} 
      />
    </header>
  );
};

