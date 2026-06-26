import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { useLazyQuery } from '@apollo/client/react';
import shiroEnable from '../../assets/images/texture/shiro_enable.png';
import shiroDisable from '../../assets/images/texture/shiro_disable.png';
import { LICENSES, SOFTWARES, FILE_FORMATS } from '../../pages/CreateProduct/createProduct.logic';
import { useSearchFilters, emptyFilters } from '../../contexts/SearchFilterContext';
import type { SearchFilters } from '../../contexts/SearchFilterContext';
import { AI_SEARCH_PRODUCTS_QUERY } from '../../graphql/suggestions';
import { cacaoClient } from '../../apollo';

interface SearchPanelProps {
  isOpen: boolean;
  activeTab: 'shiro' | 'manual';
  onTabChange: (tab: 'shiro' | 'manual') => void;
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
        selected
          ? 'bg-[#fff0f3] border-[#f65c88] text-[#db2e50]'
          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, activeTab, onTabChange }) => {
  const { applyFilters, clearFilters, activeFilters, applyAISearch } = useSearchFilters();
  const [draft, setDraft] = useState<SearchFilters>(activeFilters ?? emptyFilters);
  const [aiPromptText, setAiPromptText] = useState('');

  const [runAISearch, { loading: aiLoading }] = useLazyQuery(AI_SEARCH_PRODUCTS_QUERY, {
    client: cacaoClient,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const results = data?.searchProductsByAi ?? [];
      applyAISearch(results, aiPromptText.trim());
    },
  });

  if (!isOpen) return null;

  const set = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const handleApply = () => applyFilters(draft);

  const handleReset = () => {
    setDraft(emptyFilters);
    clearFilters();
  };

  const handleAISearch = () => {
    const prompt = aiPromptText.trim();
    if (!prompt || aiLoading) return;
    runAISearch({ variables: { prompt } });
  };

  const activeCount = [
    draft.minPrice,
    draft.maxPrice,
    draft.isFreeOnly ? '1' : '',
    ...draft.licenseTypes,
    ...draft.softwareTags,
    ...draft.formatTags,
  ].filter(Boolean).length;

  return (
    <div className="absolute top-[120%] left-0 w-[600px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => onTabChange('shiro')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all ${
            activeTab === 'shiro'
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#f65c88] to-[#db2e50] border-b-2 border-[#f65c88]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <img
            src={activeTab === 'shiro' ? shiroEnable : shiroDisable}
            alt="Shiro"
            className={`w-5 h-5 object-contain ${activeTab === 'shiro' ? 'scale-110' : 'opacity-70'}`}
          />
          Shiro AI
        </button>
        <button
          onClick={() => onTabChange('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all ${
            activeTab === 'manual'
              ? 'text-[#040316] border-b-2 border-[#040316]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={16} className={activeTab === 'manual' ? 'text-[#040316]' : 'text-gray-400'} />
          Lọc thủ công
          {activeFilters && activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#f65c88] text-white rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'shiro' ? (
        <div className="p-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-[#f65c88]" />
            <h3 className="text-sm font-semibold text-gray-800">Mô tả điều bạn cần tìm</h3>
          </div>
          <div className="relative">
            <textarea
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAISearch();
              }}
              disabled={aiLoading}
              className="w-full bg-surface-container-low border border-pink-100 rounded-xl p-4 pr-12 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f65c88]/50 resize-none h-28 disabled:opacity-60"
              placeholder="Vd: illustration anime phong cách pastel dùng cho stream, file PSD..."
            />
            <button
              onClick={handleAISearch}
              disabled={aiLoading || !aiPromptText.trim()}
              className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-[#f65c88] to-[#db2e50] text-white rounded-full hover:shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {aiLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Shiro hiểu ngôn ngữ tự nhiên — thử mô tả phong cách, phần mềm, định dạng, giá tiền...
            <span className="ml-1 text-gray-300">Ctrl+Enter để tìm</span>
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Price */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Giá</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => set('isFreeOnly', !draft.isFreeOnly)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    draft.isFreeOnly
                      ? 'bg-[#fff0f3] border-[#f65c88] text-[#db2e50]'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  ✦ Miễn phí
                </button>
                {!draft.isFreeOnly && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={draft.minPrice}
                      onChange={(e) => set('minPrice', e.target.value)}
                      placeholder="Từ"
                      min={0}
                      className="w-24 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#f65c88]/30"
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <input
                      type="number"
                      value={draft.maxPrice}
                      onChange={(e) => set('maxPrice', e.target.value)}
                      placeholder="Đến"
                      min={0}
                      className="w-24 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#f65c88]/30"
                    />
                    <span className="text-gray-400 text-xs">VND</span>
                  </div>
                )}
              </div>
            </div>

            {/* License */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Giấy phép</p>
              <div className="flex flex-wrap gap-2">
                {LICENSES.map((l) => (
                  <Chip
                    key={l.id}
                    label={l.label}
                    selected={draft.licenseTypes.includes(l.id)}
                    onClick={() => set('licenseTypes', toggle(draft.licenseTypes, l.id))}
                  />
                ))}
              </div>
            </div>

            {/* Software */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phần mềm</p>
              <div className="flex flex-wrap gap-2">
                {SOFTWARES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={draft.softwareTags.includes(s.id)}
                    onClick={() => set('softwareTags', toggle(draft.softwareTags, s.id))}
                  />
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Định dạng file</p>
              <div className="flex flex-wrap gap-2">
                {FILE_FORMATS.map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    selected={draft.formatTags.includes(f.id)}
                    onClick={() => set('formatTags', toggle(draft.formatTags, f.id))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={13} />
              Đặt lại
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white text-xs font-bold rounded-full hover:opacity-90 hover:shadow-md transition-all"
            >
              Áp dụng {activeCount > 0 ? `(${activeCount})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
