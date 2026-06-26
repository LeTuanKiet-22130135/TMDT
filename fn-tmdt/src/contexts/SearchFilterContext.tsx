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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AIProduct = any;

interface SearchFilterCtx {
  activeFilters: SearchFilters | null;
  applyFilters: (f: SearchFilters) => void;
  clearFilters: () => void;
  aiResults: AIProduct[] | null;
  aiPrompt: string;
  applyAISearch: (results: AIProduct[], prompt: string) => void;
  clearAISearch: () => void;
}

const SearchFilterContext = createContext<SearchFilterCtx>({
  activeFilters: null,
  applyFilters: () => {},
  clearFilters: () => {},
  aiResults: null,
  aiPrompt: '',
  applyAISearch: () => {},
  clearAISearch: () => {},
});

export const SearchFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilters | null>(null);
  const [aiResults, setAiResults] = useState<AIProduct[] | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');

  const applyFilters = (f: SearchFilters) => {
    setAiResults(null);
    setAiPrompt('');
    setActiveFilters(isFiltersEmpty(f) ? null : f);
  };

  const clearFilters = () => {
    setActiveFilters(null);
    setAiResults(null);
    setAiPrompt('');
  };

  const applyAISearch = (results: AIProduct[], prompt: string) => {
    setActiveFilters(null);
    setAiResults(results);
    setAiPrompt(prompt);
  };

  const clearAISearch = () => {
    setAiResults(null);
    setAiPrompt('');
  };

  return (
    <SearchFilterContext.Provider value={{ activeFilters, applyFilters, clearFilters, aiResults, aiPrompt, applyAISearch, clearAISearch }}>
      {children}
    </SearchFilterContext.Provider>
  );
};

export const useSearchFilters = () => useContext(SearchFilterContext);
