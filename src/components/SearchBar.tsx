import React, { useState, useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

interface TrendingPrompt {
  id: number;
  title: string;
  author: {
    id: string;
    name: string;
  };
  created_at: string;
  views: number;
  likes_count: number;
  bookmark_count: number;
  popularity_score: number;
  hours_ago: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  className = '', 
  placeholder = '프롬프트 검색' 
}) => {
  const { searchQuery, setSearchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTrending, setShowTrending] = useState(true);
  const [trendingPrompts, setTrendingPrompts] = useState<TrendingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  // 인기 프롬프트 가져오기
  useEffect(() => {
    const fetchTrendingPrompts = async () => {
      try {
        const response = await fetch('/api/prompts/trending');
        const data = await response.json();
        
        if (data.success && data.data) {
          setTrendingPrompts(data.data);
        }
      } catch (error) {
        console.error('Error fetching trending prompts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPrompts();
    // 5분마다 업데이트
    const interval = setInterval(fetchTrendingPrompts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 자동 롤링
  useEffect(() => {
    if (trendingPrompts.length === 0 || isExpanded || !showTrending || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingPrompts.length);
    }, 3000); // 3초마다 변경

    return () => clearInterval(interval);
  }, [trendingPrompts.length, isExpanded, showTrending, isHovered]);

  const currentPrompt = trendingPrompts[currentIndex];

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <form 
        onSubmit={handleSearch} 
        className="relative"
      >
        <div className={`relative transition-all duration-300 ${
          isFocused ? 'w-full' : 'w-full'
        }`}>
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              setShowTrending(false);
            }}
            onBlur={() => {
              setIsFocused(false);
              // 입력값이 없을 때만 인기태그 표시
              if (!localQuery.trim()) {
                setShowTrending(true);
              }
            }}
            placeholder=""
            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 pr-20 sm:pr-24 text-sm sm:text-base rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {/* Clear button */}
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                setSearchQuery('');
                setShowTrending(true);
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

      {/* 인기 프롬프트 버튼 - 검색창 내부 - 항상 고정 */}
      {!loading && trendingPrompts.length > 0 && showTrending && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* 인기태그 버튼 - 항상 표시 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors font-medium text-xs"
            aria-expanded={isExpanded}
          >
            <span className="text-xs">🔥</span>
            <span>인기태그</span>
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 검색어 입력 안내 문구 - 마우스 호버 시 표시 */}
          {isHovered && (
            <span className="text-gray-400 text-sm whitespace-nowrap">
              검색어를 입력해주세요
            </span>
          )}

          {/* 롤링 뉴스 영역 - 마우스 호버 시 숨김 */}
          {!isExpanded && currentPrompt && !isHovered && (
            <div className="flex items-center overflow-hidden">
              <div className="relative h-6 overflow-hidden w-[300px]">
                <div className="absolute inset-0 flex flex-col">
                  {trendingPrompts.map((prompt, index) => (
                    <div 
                      key={prompt.id} 
                      className={`h-6 flex items-center transition-all duration-500 ${
                        index === currentIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ 
                        transform: `translateY(${(index - currentIndex) * 100}%)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0
                      }}
                    >
                      <Link
                        href={`/prompt/${prompt.id}`}
                        className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                      >
                        <span className="text-orange-500 font-bold text-xs">
                          {index + 1}위
                        </span>
                        <span className="text-gray-700 truncate max-w-[200px]">
                          {prompt.title}
                        </span>
                        <span className="text-gray-400 text-xs">
                          by {prompt.author.name}
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 확장된 목록 */}
      {isExpanded && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-[400px] overflow-y-auto scrollbar-hide">
          <div className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>🔥</span>
                실시간 인기 프롬프트 TOP 10
              </h3>
            </div>
            
            <div className="space-y-3">
              {trendingPrompts.map((prompt, index) => (
                <Link
                  key={prompt.id}
                  href={`/prompt/${prompt.id}`}
                  className="block p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                  onClick={() => setIsExpanded(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-orange-500 text-white' : 
                        index === 1 ? 'bg-orange-400 text-white' : 
                        index === 2 ? 'bg-orange-300 text-white' : 
                        'bg-gray-100 text-gray-600'}
                    `}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                        {prompt.title}
                      </h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;