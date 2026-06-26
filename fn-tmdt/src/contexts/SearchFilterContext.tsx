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
  aiStep: string | null;
  aiSearchLoading: boolean;
  setAiSearchLoading: (v: boolean) => void;
  applyAISearch: (results: AIProduct[], prompt: string, step?: string) => void;
  clearAISearch: () => void;
}

const SearchFilterContext = createContext<SearchFilterCtx>({
  activeFilters: null,
  applyFilters: () => {},
  clearFilters: () => {},
  aiResults: null,
  aiPrompt: '',
  aiStep: null,
  aiSearchLoading: false,
  setAiSearchLoading: () => {},
  applyAISearch: () => {},
  clearAISearch: () => {},
});

export const SearchFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilters | null>(null);
  const [aiResults, setAiResults] = useState<AIProduct[] | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStep, setAiStep] = useState<string | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  const applyFilters = (f: SearchFilters) => {
    setAiResults(null);
    setAiPrompt('');
    setAiStep(null);
    setActiveFilters(isFiltersEmpty(f) ? null : f);
  };

  const clearFilters = () => {
    setActiveFilters(null);
    setAiResults(null);
    setAiPrompt('');
    setAiStep(null);
  };

  const applyAISearch = (results: AIProduct[], prompt: string, step?: string) => {
    setActiveFilters(null);
    setAiResults(results);
    setAiPrompt(prompt);
    setAiStep(step ?? null);
    setAiSearchLoading(false);
  };

  const clearAISearch = () => {
    setAiResults(null);
    setAiPrompt('');
    setAiStep(null);
    setAiSearchLoading(false);
  };

  return (
    <SearchFilterContext.Provider value={{ activeFilters, applyFilters, clearFilters, aiResults, aiPrompt, aiStep, aiSearchLoading, setAiSearchLoading, applyAISearch, clearAISearch }}>
      {children}
    </SearchFilterContext.Provider>
  );
};

export const useSearchFilters = () => useContext(SearchFilterContext);
