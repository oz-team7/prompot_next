import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Prompt } from '@/types/prompt';
import PromptCardCompact from './PromptCardCompact';
import BookmarkPanel from './BookmarkPanel';
import { useSearch } from '@/contexts/SearchContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePrompts } from '@/hooks/usePrompts';
import { useBookmarks } from '@/hooks/useBookmarks';

interface PromptGridProps {
  prompts?: Prompt[];  // 외부에서 전달받는 프롬프트 (옵셔널)
  showHero?: boolean;  // Hero 섹션 표시 여부
  showCreateButton?: boolean;  // 프롬프트 작성 버튼 표시 여부
  pageTitle?: string;  // 페이지 타이틀
  useAPI?: boolean;  // API 사용 여부
}

type CategoryType = 'all' | 'work' | 'dev' | 'design' | 'edu' | 'image';
type SortType = 'latest' | 'likes' | 'views' | 'bookmarks';

const PromptGrid: React.FC<PromptGridProps> = ({ 
  prompts: initialPrompts, 
  showHero = false,
  showCreateButton = false,
  pageTitle,
  useAPI = true 
}) => {
  const router = useRouter();
  const { searchQuery, authorFilter, setAuthorFilter, clearFilters } = useSearch();
  const { isAuthenticated } = useAuth();
  
  // Hook을 항상 호출하되, 인증되지 않은 경우 빈 배열 사용
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  
  // 북마크된 프롬프트 ID 목록 (안전하게 접근)
  const bookmarkedPromptIds = bookmarks ? bookmarks.map(bookmark => bookmark.prompt.id) : [];
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [sortBy, setSortBy] = useState<SortType>('latest');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAIModelDropdown, setShowAIModelDropdown] = useState(false);
  const [activeAIModel, setActiveAIModel] = useState<string>('all');
  const [activeTag, setActiveTag] = useState<string>('all');
  
  // 페이지 경로 변경 시 필터 초기화 (홈으로 이동 시)
  useEffect(() => {
    if (router.pathname === '/' && router.query.reset === 'true') {
      setActiveCategory('all');
      setActiveAIModel('all');
      setActiveTag('all');
      clearFilters(); // 작성자 필터도 초기화
      // URL에서 reset 파라미터 제거
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.pathname, router.query.reset, clearFilters]);
  
  // 정렬 옵션 정의
  const sortOptions = [
    { value: 'latest', label: '최신순', icon: '↓' },
    { value: 'likes', label: '좋아요순', icon: '↓' },
    { value: 'views', label: '조회수순', icon: '↓' },
    { value: 'bookmarks', label: '북마크순', icon: '↓' },
  ];
  
  const { prompts: apiPrompts, loading, error, refetch } = usePrompts({ 
    sort: sortBy 
  });
  
  // API 사용 시 apiPrompts, 아니면 initialPrompts 사용
  const promptsData = useAPI ? apiPrompts : (initialPrompts || []);
  
  const [prompts, setPrompts] = useState<Prompt[]>(promptsData);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(promptsData);

  const categories: { value: CategoryType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'work', label: '업무/마케팅' },
    { value: 'dev', label: '개발/코드' },
    { value: 'design', label: '디자인/브랜드' },
    { value: 'edu', label: '교육/학습' },
    { value: 'image', label: '이미지/동영상' },
  ];

  // AI 모델 목록 (프롬프트 데이터에서 추출된 고유 AI 모델들)
  const uniqueAIModels = React.useMemo(() => {
    const models = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.aiModel) {
        const modelName = typeof prompt.aiModel === 'object' ? prompt.aiModel.name : prompt.aiModel;
        models.add(modelName);
      }
    });
    return ['all', ...Array.from(models)].sort();
  }, [prompts]);

  const selectedSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];
  const selectedCategoryOption = categories.find(category => category.value === activeCategory) || categories[0];
  
  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-dropdown-container')) {
        setShowSortDropdown(false);
      }
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (!target.closest('.aimodel-dropdown-container')) {
        setShowAIModelDropdown(false);
      }
    };

    if (showSortDropdown || showCategoryDropdown || showAIModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown, showCategoryDropdown, showAIModelDropdown]);

  // API에서 데이터를 가져온 경우 prompts 상태 업데이트
  useEffect(() => {
    if (useAPI && apiPrompts.length > 0) {
      console.log('[DEBUG] PromptGrid - apiPrompts loaded:', apiPrompts.length);
      console.log('[DEBUG] First apiPrompt category and aiModel:', {
        category: apiPrompts[0]?.category,
        aiModel: apiPrompts[0]?.aiModel
      });
      setPrompts(apiPrompts);
    } else if (!useAPI && initialPrompts) {
      console.log('[DEBUG] PromptGrid - initialPrompts loaded:', initialPrompts.length);
      console.log('[DEBUG] First initialPrompt category and aiModel:', {
        category: initialPrompts[0]?.category,
        aiModel: initialPrompts[0]?.aiModel
      });
      setPrompts(initialPrompts);
    }
  }, [apiPrompts, initialPrompts, useAPI]);


  const handleLike = (id: number) => {
    setPrompts(prevPrompts =>
      prevPrompts.map(prompt =>
        prompt.id === id
          ? {
              ...prompt,
              isLiked: !prompt.isLiked,
              likes: prompt.isLiked ? prompt.likes - 1 : prompt.likes + 1,
            }
          : prompt
      )
    );
  };

  // 북마크 처리 함수 수정
  const handleBookmark = async (id: string | number, categoryId?: string | null) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const isBookmarked = bookmarks.some(bookmark => bookmark.prompt.id === id);
      
      if (isBookmarked) {
        await removeBookmark(id);
      } else {
        await addBookmark(id, categoryId);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  useEffect(() => {
    let filtered = [...prompts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prompt => 
        prompt.title.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (prompt.author?.name || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.category === activeCategory);
    }

    // AI Model filter
    if (activeAIModel !== 'all') {
      filtered = filtered.filter(prompt => {
        const aiModelName = typeof prompt.aiModel === 'object' ? prompt.aiModel?.name : prompt.aiModel;
        return aiModelName === activeAIModel;
      });
    }

    // Tag filter
    if (activeTag !== 'all') {
      filtered = filtered.filter(prompt => 
        prompt.tags.some(tag => tag === activeTag)
      );
    }

    // Author filter
    if (authorFilter) {
      filtered = filtered.filter(prompt => 
        (prompt.author?.name || '익명') === authorFilter
      );
    }


    // Sorting
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => {
          const dateA = a.created_at || a.date || '';
          const dateB = b.created_at || b.date || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'likes':
        filtered.sort((a, b) => (b.likes_count || b.likes || 0) - (a.likes_count || a.likes || 0));
        break;
      case 'views':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'bookmarks':
        filtered.sort((a, b) => (b.bookmarkCount || b.bookmarks || 0) - (a.bookmarkCount || a.bookmarks || 0));
        break;
    }

    setFilteredPrompts(filtered);
  }, [prompts, activeCategory, sortBy, searchQuery, activeAIModel, activeTag, authorFilter]);

  const handleCreatePrompt = () => {
    if (isAuthenticated) {
      router.push('/prompt/create');
    } else {
      router.push('/login');
    }
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      // 같은 카테고리를 다시 클릭하면 필터 해제
      setActiveCategory('all');
    } else {
      setActiveCategory(category as CategoryType);
    }
  };

  // AI모델 클릭 핸들러
  const handleAIModelClick = (aiModel: string) => {
    if (activeAIModel === aiModel) {
      // 같은 AI 모델을 다시 클릭하면 필터 해제
      setActiveAIModel('all');
    } else {
      setActiveAIModel(aiModel);
    }
  };

  // 태그 클릭 핸들러
  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // 같은 태그를 다시 클릭하면 필터 해제
      setActiveTag('all');
    } else {
      setActiveTag(tag);
    }
  };

  return (
    <>
      {/* Hero Section - 조건부 렌더링 */}
      {showHero && (
        <section className="pt-8 sm:pt-12 pb-4 sm:pb-6 bg-gradient-to-b from-orange-50 to-white">
          <div className="w-full px-4 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4">
              프롬프트의 모든 것, <span className="text-primary">PROMPOT</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed tracking-wide">
              당신의 AI 경험을 한층 높여줄 국내 최고의 프롬프트 라이브러리<br />
              필요한 모든 프롬프트를 찾아보세요
            </p>
          </div>
        </section>
      )}

      <section className="py-2 sm:py-4 bg-orange-50/20">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
          {/* 페이지 타이틀과 프롬프트 작성 버튼 - 조건부 렌더링 */}
          {(pageTitle || showCreateButton) && (
            <div className="flex items-center justify-between mb-6">
              {pageTitle && <h1 className="text-2xl font-bold">{pageTitle}</h1>}
            </div>
          )}

          {/* 활성 필터 표시 - 상단 별도 영역 */}
          {(activeCategory !== 'all' || activeAIModel !== 'all' || activeTag !== 'all' || authorFilter) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap bg-orange-50 border border-orange-200 rounded-lg p-3">
                <span className="text-sm font-medium text-orange-600">활성 필터:</span>
                
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    카테고리: {categories.find(cat => cat.value === activeCategory)?.label}
                    <button
                      onClick={() => setActiveCategory('all')}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {activeAIModel !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    AI모델: {activeAIModel}
                    <button
                      onClick={() => setActiveAIModel('all')}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {activeTag !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    태그: {activeTag}
                    <button
                      onClick={() => setActiveTag('all')}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {authorFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    작성자: {authorFilter}
                    <button
                      onClick={() => setAuthorFilter(null)}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveAIModel('all');
                    setActiveTag('all');
                    clearFilters();
                  }}
                  className="ml-2 px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm hover:bg-orange-300 transition-colors"
                >
                  모든 필터 제거
                </button>
              </div>
            </div>
          )}

          {/* Category, Sort, and Action Buttons */}
          <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 items-center">
            {/* Category Selector */}
            <div className="flex items-center gap-1 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">카테고리</span>
              <div className="category-dropdown-container relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center w-[90px] sm:w-[120px] h-[36px] sm:h-[40px]"
                >
                  <span className="text-gray-700">{selectedCategoryOption.label}</span>
                </button>

                {showCategoryDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => {
                          setActiveCategory(category.value as CategoryType);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedCategoryOption.value === category.value ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700">{category.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Model Selector */}
            <div className="flex items-center gap-1 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">AI모델</span>
              <div className="aimodel-dropdown-container relative">
                <button
                  onClick={() => setShowAIModelDropdown(!showAIModelDropdown)}
                  className="px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center w-[100px] sm:w-[140px] h-[36px] sm:h-[40px]"
                >
                  <span className="text-gray-700 truncate">{activeAIModel === 'all' ? '전체' : activeAIModel}</span>
                </button>

                {showAIModelDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {uniqueAIModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setActiveAIModel(model);
                          setShowAIModelDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          activeAIModel === model ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700">{model === 'all' ? '전체' : model}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">정렬</span>
              <div className="sort-dropdown-container relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between w-[80px] sm:w-[100px] h-[36px] sm:h-[40px]"
                >
                  <span className="text-gray-700 text-xs sm:text-sm">{selectedSortOption.label}</span>
                  <span className="text-gray-700 ml-1 sm:ml-2 text-xs sm:text-sm">{selectedSortOption.icon}</span>
                </button>

                {showSortDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value as SortType);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedSortOption.value === option.value ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                        <span className="text-sm text-gray-700">{option.icon}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Spacer to push buttons to the right */}
            <div className="flex-1"></div>

            {/* Action Buttons */}
            <div className="flex gap-1 sm:gap-2 items-center">
              {showCreateButton && (
                <button
                  onClick={handleCreatePrompt}
                  className="inline-flex items-center justify-center px-2 sm:px-4 py-2 h-[36px] sm:h-10 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm font-medium"
                  title="새 프롬프트 만들기"
                >
                  <svg className="w-4 sm:w-4 h-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline ml-1">New</span>
                </button>
              )}

              {/* 북마크 버튼 - 항상 표시 */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push('/login');
                    return;
                  }
                  setShowBookmarks(!showBookmarks);
                }}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm h-[36px] sm:h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow-md justify-center"
                title="최근 북마크"
              >
                <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {useAPI && loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">프롬프트를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <svg className="w-24 h-24 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button onClick={refetch} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                다시 시도
              </button>
            </div>
          ) : filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {filteredPrompts.map(prompt => (
                <div key={prompt.id} className="w-full mb-6">
                  <PromptCardCompact
                    prompt={prompt}
                    onLike={handleLike}
                    onBookmark={isAuthenticated ? handleBookmark : undefined}
                    isBookmarked={bookmarkedPromptIds ? bookmarkedPromptIds.includes(prompt.id) : false}
                    onCategoryClick={handleCategoryClick}
                    onAIModelClick={handleAIModelClick}
                    onTagClick={handleTagClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">아직 프롬프트가 추가되지 않았습니다</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? `"${searchQuery}"에 대한 프롬프트를 찾을 수 없습니다.` : '프롬프트를 추가해주세요.'}
              </p>
              {showCreateButton && (
                <button
                  onClick={handleCreatePrompt}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  첫 번째 프롬프트 추가하기
                </button>
              )}
            </div>
          )}

          {/* Bookmark Panel - 로그인한 사용자만 표시 */}
          {isAuthenticated && (
            <BookmarkPanel
              isOpen={showBookmarks}
              onClose={() => setShowBookmarks(false)}
              bookmarks={bookmarks || []}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default PromptGrid;