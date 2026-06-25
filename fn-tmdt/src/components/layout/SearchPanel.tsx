import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, SlidersHorizontal,  } from 'lucide-react';
import shiroEnable from '../../assets/images/texture/shiro_enable.png';
import shiroDisable from '../../assets/images/texture/shiro_disable.png';

interface SearchPanelProps {
  isOpen: boolean;
  activeTab: 'shiro' | 'manual';
  onTabChange: (tab: 'shiro' | 'manual') => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, activeTab, onTabChange }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="absolute top-[120%] left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => onTabChange('shiro')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
            activeTab === 'shiro' 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#f65c88] to-[#db2e50] border-b-2 border-[#f65c88] bg-pink-50/30' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <img 
            src={activeTab === 'shiro' ? shiroEnable : shiroDisable} 
            alt="Shiro" 
            className={`w-5 h-5 object-contain transition-transform ${activeTab === 'shiro' ? 'scale-110 drop-shadow-sm' : 'opacity-70'}`}
          />
          {t('header.searchPanel.shiro.tab')}
        </button>
        <button
          onClick={() => onTabChange('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
            activeTab === 'manual' 
              ? 'text-[#040316] border-b-2 border-[#040316] bg-gray-50/50' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={18} className={activeTab === 'manual' ? 'text-[#040316]' : 'text-gray-400'} />
          {t('header.searchPanel.manual.tab')}
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'shiro' ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-[#f65c88]" />
              <h3 className="text-sm font-semibold text-gray-800">{t('header.searchPanel.shiro.title')}</h3>
            </div>
            <div className="relative">
              <textarea 
                className="w-full bg-surface-container-low border border-pink-100 rounded-xl p-4 pr-12 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f65c88]/50 resize-none h-28"
                placeholder={t('header.searchPanel.shiro.promptPlaceholder')}
              />
              <button className="absolute bottom-4 right-4 p-2 bg-gradient-to-r from-[#f65c88] to-[#db2e50] text-white rounded-full hover:shadow-lg transition-all hover:scale-105">
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('header.searchPanel.manual.title')}</h3>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t('header.searchPanel.manual.priceFilter')}</label>
                <input type="text" placeholder="Vd: $10 - $50" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#040316]/20" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t('header.searchPanel.manual.categoryFilter')}</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#040316]/20 appearance-none">
                  <option>Tất cả danh mục</option>
                  <option>UI Kits</option>
                  <option>3D Assets</option>
                  <option>Illustrations</option>
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-3">{t('header.searchPanel.manual.tagsTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {['Dưới $10', 'Miễn phí', 'Bán chạy nhất', 'Phong cách Minimalist', 'Trending'].map((tag) => (
                  <button key={tag} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-full transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
