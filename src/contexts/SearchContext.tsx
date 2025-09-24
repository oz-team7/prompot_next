import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  authorFilter: string | null;
  setAuthorFilter: (author: string | null) => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  aiModelFilter: string | null;
  setAiModelFilter: (aiModel: string | null) => void;
  clearFilters: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [aiModelFilter, setAiModelFilter] = useState<string | null>(null);

  const clearFilters = () => {
    setSearchQuery('');
    setAuthorFilter(null);
    setCategoryFilter(null);
    setAiModelFilter(null);
  };

  return (
    <SearchContext.Provider value={{ 
      searchQuery, 
      setSearchQuery, 
      authorFilter, 
      setAuthorFilter,
      categoryFilter,
      setCategoryFilter,
      aiModelFilter,
      setAiModelFilter,
      clearFilters 
    }}>
      {children}
    </SearchContext.Provider>
  );
};