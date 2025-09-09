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
type SortType = 'latest' | 'latest-desc' | 'popular' | 'popular-desc' | 'rating' | 'rating-desc';

const PromptGrid: React.FC<PromptGridProps> = ({ 
  prompts: initialPrompts, 
  showHero = false,
  showCreateButton = false,
  pageTitle,
  useAPI = true 
}) => {
  const router = useRouter();
  const { searchQuery } = useSearch();
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
  
  // 정렬 옵션 정의
  const sortOptions = [
    { value: 'latest', label: '최신순', icon: '⌄' },
    { value: 'latest-desc', label: '오래된순', icon: '⌄' },
    { value: 'popular-desc', label: '인기순', icon: '⌄' },
    { value: 'popular', label: '인기순', icon: '⌄' },
    { value: 'rating-desc', label: '평점순', icon: '⌄' },
    { value: 'rating', label: '평점순', icon: '⌄' },
  ];
  
  const categories: { value: CategoryType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'work', label: '업무/마케팅' },
    { value: 'dev', label: '개발/코드' },
    { value: 'design', label: '디자인/브랜드' },
    { value: 'edu', label: '교육/학습' },
    { value: 'image', label: '이미지/아트' },
  ];

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
    };

    if (showSortDropdown || showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown, showCategoryDropdown]);
  
  const { prompts: apiPrompts, loading, error, refetch } = usePrompts({ 
    sort: sortBy.includes('popular') ? 'popular' : undefined 
  });
  
  // API 사용 시 apiPrompts, 아니면 initialPrompts 사용
  const promptsData = useAPI ? apiPrompts : (initialPrompts || []);
  
  const [prompts, setPrompts] = useState<Prompt[]>(promptsData);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(promptsData);

  // API에서 데이터를 가져온 경우 prompts 상태 업데이트
  useEffect(() => {
    if (useAPI && apiPrompts.length > 0) {
      setPrompts(apiPrompts);
    } else if (!useAPI && initialPrompts) {
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


    // Sorting
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'latest-desc':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => a.likes - b.likes);
        break;
      case 'popular-desc':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'rating':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'rating-desc':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredPrompts(filtered);
  }, [prompts, activeCategory, sortBy, searchQuery]);

  const handleCreatePrompt = () => {
    if (isAuthenticated) {
      router.push('/prompt/create');
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {/* Hero Section - 조건부 렌더링 */}
      {showHero && (
        <section className="py-4 sm:py-6 bg-gradient-to-b from-orange-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">
              프롬프트의 모든 것, <span className="text-primary">PROMPOT</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-600">
              창의적인 프롬프트를 공유하고 발견하며, 생산성을 극대화하세요
            </p>
          </div>
        </section>
      )}

      <section className="py-2 sm:py-4 bg-orange-50/20">
        <div className="container mx-auto px-3 sm:px-4">
          {/* 페이지 타이틀과 프롬프트 작성 버튼 - 조건부 렌더링 */}
          {(pageTitle || showCreateButton) && (
            <div className="flex items-center justify-between mb-6">
              {pageTitle && <h1 className="text-2xl font-bold">{pageTitle}</h1>}
            </div>
          )}

          {/* Category, Sort, and Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
            {/* Left side: Category and Sort Selectors */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Category Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-orange-600">카테고리</span>
                <div className="category-dropdown-container relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center w-[120px] h-[40px]"
                  >
                    <span className="text-gray-700">{selectedCategoryOption.label}</span>
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
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

              {/* Sort Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-orange-600">정렬</span>
                <div className="sort-dropdown-container relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between w-[120px] h-[40px]"
                  >
                    <span className="text-gray-700">{selectedSortOption.label}</span>
                    <span className="text-gray-700">{selectedSortOption.icon}</span>
                  </button>

                  {showSortDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
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
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex gap-2">
              {showCreateButton && (
                <button
                  onClick={handleCreatePrompt}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </button>
              )}

              {/* 북마크 버튼 - 로그인한 사용자만 표시 */}
              {isAuthenticated && (
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  북마크
                </button>
              )}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredPrompts.map(prompt => (
                <PromptCardCompact
                  key={prompt.id}
                  prompt={prompt}
                  onLike={handleLike}
                  onBookmark={isAuthenticated ? handleBookmark : undefined}
                  isBookmarked={bookmarkedPromptIds ? bookmarkedPromptIds.includes(prompt.id) : false}
                />
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
              bookmarkedPrompts={bookmarkedPromptIds || []}
              prompts={prompts}
              onRemoveBookmark={handleBookmark}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default PromptGrid;