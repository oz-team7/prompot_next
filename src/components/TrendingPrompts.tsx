import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createPortal } from 'react-dom';

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

const TrendingPrompts: React.FC = () => {
  const router = useRouter();
  const [trendingPrompts, setTrendingPrompts] = useState<TrendingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

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
    if (trendingPrompts.length === 0 || isExpanded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingPrompts.length);
    }, 3000); // 3초마다 변경

    return () => clearInterval(interval);
  }, [trendingPrompts.length, isExpanded]);

  if (loading || trendingPrompts.length === 0) {
    return null;
  }

  const currentPrompt = trendingPrompts[currentIndex];

  return (
    <div className="relative flex-shrink-0">
      {/* 메인 컨테이너 */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setButtonRect(rect);
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors font-medium text-xs sm:text-sm"
          aria-expanded={isExpanded}
        >
          <span className="text-xs">🔥</span>
          <span>인기 프롬프트</span>
          <svg 
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 롤링 뉴스 영역 - 항상 표시 */}
        <div className="flex items-center overflow-hidden min-w-0">
          <div className="relative h-6 overflow-hidden w-64 sm:w-80 lg:w-96">
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
                    <span className="text-gray-700 truncate max-w-[150px] sm:max-w-[200px] lg:max-w-[250px] text-xs sm:text-sm">
                      {prompt.title}
                    </span>
                    <span className="text-gray-400 text-xs">
                      by {typeof prompt.author === 'object' ? prompt.author?.name || '익명' : prompt.author || '익명'}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 확장된 목록 - 포털로 렌더링 */}
      {isExpanded && buttonRect && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white rounded-xl shadow-xl border border-gray-100 w-72 max-h-[500px] overflow-y-auto scrollbar-hide z-[9999] backdrop-blur-sm"
          style={{
            top: buttonRect.bottom + 8,
            left: buttonRect.left,
          }}
        >
          <div className="p-3">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
              <span className="text-orange-500">🔥</span>
              인기 프롬프트 TOP 10
            </h3>
            
            <div className="space-y-1">
              {trendingPrompts.map((prompt, index) => (
                <Link
                  key={prompt.id}
                  href={`/prompt/${prompt.id}`}
                  className="block p-2 rounded-lg hover:bg-orange-50 transition-all duration-200 group"
                  onClick={() => setIsExpanded(false)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 
                        index === 1 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 
                        index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' : 
                        'bg-gray-100 text-gray-600'}
                    `}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors truncate text-sm">
                        {prompt.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <span className="truncate">{typeof prompt.author === 'object' ? prompt.author?.name || '익명' : prompt.author || '익명'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {prompt.views}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                          {prompt.likes_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TrendingPrompts;