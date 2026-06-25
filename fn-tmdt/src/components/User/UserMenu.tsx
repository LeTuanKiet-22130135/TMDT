import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, LogOut, Package, User, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../../contexts/UserProfileContext';

export const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.reload();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-high hover:border-[#f65c88] transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#ffafb1]"
      >
        <img
          alt="Avatar"
          className="w-full h-full object-cover"
          src={profile.avatar}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          {/* User Card Header */}
          <div
            className="relative h-24"
            style={
              profile.banner
                ? { backgroundImage: `url(${profile.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: 'linear-gradient(to right, #ffafb1, #9AC6FF)' }
            }
          >
            <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-white shadow-sm">
              <img
                alt="Avatar"
                className="w-full h-full object-cover"
                src={profile.avatar}
              />
            </div>
          </div>
          <div className="pt-8 pb-4 px-6 border-b border-gray-100">
            <h3 className="font-bold text-lg text-[#040316]">{profile.displayName}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700">
              <User size={18} className="mr-3 text-gray-400" />
              <span className="font-medium text-sm">{t('user.menu.profile')}</span>
            </Link>
            <Link to="/orders" onClick={() => setIsOpen(false)} className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700">
              <Package size={18} className="mr-3 text-gray-400" />
              <span className="font-medium text-sm">{t('user.menu.orders')}</span>
            </Link>
            <Link to={`/author/${profile.shortlink}`} onClick={() => setIsOpen(false)} className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700">
              <Store size={18} className="mr-3 text-gray-400" />
              <span className="font-medium text-sm">{t('user.menu.shops')}</span>
            </Link>
            <Link to="/settings" onClick={() => setIsOpen(false)} className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700">
              <Settings size={18} className="mr-3 text-gray-400" />
              <span className="font-medium text-sm">{t('user.menu.settings')}</span>
            </Link>
          </div>

          <div className="border-t border-gray-100 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-6 py-3 hover:bg-red-50 transition-colors text-[#db2e50]"
            >
              <LogOut size={18} className="mr-3" />
              <span className="font-medium text-sm">{t('user.menu.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
