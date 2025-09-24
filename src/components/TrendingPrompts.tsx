import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
    <div className="relative">
      {/* 메인 컨테이너 */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors font-medium"
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

        {/* 롤링 뉴스 영역 */}
        {!isExpanded && (
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
                      <span className="text-gray-700 truncate max-w-[150px] sm:max-w-[200px] lg:max-w-[250px]">
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

      {/* 확장된 목록 */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 w-80 sm:w-96 max-h-[500px] overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>🔥</span>
              실시간 인기 프롬프트 TOP 10
            </h3>
            
            <div className="space-y-3">
              {trendingPrompts.map((prompt, index) => (
                <Link
                  key={prompt.id}
                  href={`/prompt/${prompt.id}`}
                  className="block p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                  onClick={() => setIsExpanded(false)}
                >
                  <div className="flex items-start gap-3">
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
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{prompt.author.name}</span>
                        <span>•</span>
                        <span>
                          {prompt.hours_ago < 1 ? '방금 전' : 
                           prompt.hours_ago < 24 ? `${prompt.hours_ago}시간 전` :
                           `${Math.floor(prompt.hours_ago / 24)}일 전`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-gray-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {prompt.views}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                          {prompt.likes_count}
                        </span>
                        <span className="flex items-center gap-1 text-orange-500">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                          {prompt.bookmark_count}
                        </span>
                      </div>
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

export default TrendingPrompts;