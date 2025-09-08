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
type SortType = 'none' | 'popular' | 'rating';

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
  const [sortBy, setSortBy] = useState<SortType>('none');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [activeTag, setActiveTag] = useState<string>('all');
  
  const { prompts: apiPrompts, loading, error, refetch } = usePrompts({ sort: sortBy === 'popular' ? 'popular' : undefined });
  
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

  const categories: { value: CategoryType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'work', label: '업무/마케팅' },
    { value: 'dev', label: '개발/코드' },
    { value: 'design', label: '디자인/브랜드' },
    { value: 'edu', label: '교육/학습' },
    { value: 'image', label: '이미지/아트' },
  ];

  // 모든 태그 추출 및 중복 제거
  const getAllTags = () => {
    const allTags = prompts.flatMap(prompt => prompt.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();
    return uniqueTags;
  };

  const availableTags = getAllTags();

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

    // Tag filter
    if (activeTag !== 'all') {
      filtered = filtered.filter(prompt => 
        prompt.tags && prompt.tags.includes(activeTag)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredPrompts(filtered);
  }, [prompts, activeCategory, sortBy, searchQuery, activeTag]);

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
        <section className="py-8 sm:py-12 bg-gradient-to-b from-orange-50 to-white">
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

      <section className="py-6 sm:py-12 bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4">
          {/* 페이지 타이틀과 프롬프트 작성 버튼 - 조건부 렌더링 */}
          {(pageTitle || showCreateButton) && (
            <div className="flex items-center justify-between mb-6">
              {pageTitle && <h1 className="text-2xl font-bold">{pageTitle}</h1>}
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === category.value
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Tag Tabs */}
          {availableTags.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">태그</h3>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setActiveTag('all')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full whitespace-nowrap transition-colors ${
                    activeTag === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full whitespace-nowrap transition-colors ${
                      activeTag === tag
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="none">최신순</option>
                <option value="popular">인기순 (댓글)</option>
                <option value="rating">평점순</option>
              </select>
            </div>

            <div className="ml-auto flex gap-2">
              {showCreateButton && (
                <button
                  onClick={handleCreatePrompt}
                  className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </button>
              )}

              {/* 북마크 버튼 - 로그인한 사용자만 표시 */}
              {isAuthenticated && (
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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