import React, { createContext, useContext, useState } from 'react';

export interface SearchFilters {
  keyword: string;
  minPrice: string;
  maxPrice: string;
  isFreeOnly: boolean;
  licenseTypes: string[];
  softwareTags: string[];
  formatTags: string[];
}

export const emptyFilters: SearchFilters = {
  keyword: '',
  minPrice: '',
  maxPrice: '',
  isFreeOnly: false,
  licenseTypes: [],
  softwareTags: [],
  formatTags: [],
};

export const isFiltersEmpty = (f: SearchFilters) =>
  !f.keyword.trim() &&
  !f.minPrice &&
  !f.maxPrice &&
  !f.isFreeOnly &&
  f.licenseTypes.length === 0 &&
  f.softwareTags.length === 0 &&
  f.formatTags.length === 0;

interface SearchFilterCtx {
  activeFilters: SearchFilters | null;
  applyFilters: (f: SearchFilters) => void;
  clearFilters: () => void;
}

const SearchFilterContext = createContext<SearchFilterCtx>({
  activeFilters: null,
  applyFilters: () => {},
  clearFilters: () => {},
});

export const SearchFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilters | null>(null);

  const applyFilters = (f: SearchFilters) => setActiveFilters(isFiltersEmpty(f) ? null : f);
  const clearFilters = () => setActiveFilters(null);

  return (
    <SearchFilterContext.Provider value={{ activeFilters, applyFilters, clearFilters }}>
      {children}
    </SearchFilterContext.Provider>
  );
};

export const useSearchFilters = () => useContext(SearchFilterContext);
