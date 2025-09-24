import React, { useState } from 'react';
import { useSearch } from '@/contexts/SearchContext';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  className = '', 
  placeholder = '프롬프트 검색' 
}) => {
  const { searchQuery, setSearchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    // 실시간 검색을 위해 디바운스 없이 바로 적용
    setSearchQuery(value);
  };

  return (
    <div className={`relative ${className}`}>
      <form 
        onSubmit={handleSearch} 
        className="relative"
      >
        <div className="relative w-full">
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 pr-20 sm:pr-24 text-sm sm:text-base rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {/* Clear button */}
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                setSearchQuery('');
              }}
              className="absolute right-10 sm:right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Search button */}
          <button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 text-primary hover:text-orange-600 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;