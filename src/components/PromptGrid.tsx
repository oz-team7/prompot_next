import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Prompt } from '@/types/prompt';
import PromptCardCompact from './PromptCardCompact';
import BookmarkPanel from './BookmarkPanel';
// import TrendingPrompts from './TrendingPrompts'; // 이제 SearchBar 내부로 이동됨
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
  const { searchQuery, authorFilter, setAuthorFilter, categoryFilter, setCategoryFilter, aiModelFilter, setAiModelFilter, clearFilters } = useSearch();
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
  
  // URL 쿼리 파라미터에서 필터 설정
  useEffect(() => {
    const { category, aiModel, author, reset } = router.query;
    
    if (reset === 'true') {
      setActiveCategory('all');
      setActiveAIModel('all');
      setActiveTag('all');
      clearFilters(); // 작성자 필터도 초기화
      // URL에서 reset 파라미터 제거
      router.replace('/', undefined, { shallow: true });
    } else {
      // URL 쿼리 파라미터에서 필터 설정
      if (category && typeof category === 'string') {
        console.log('[DEBUG] URL category filter:', category);
        setCategoryFilter(category);
        setActiveCategory(category as CategoryType);
      }
      
      if (aiModel && typeof aiModel === 'string') {
        // 정규화된 이름으로 변환하여 사용
        const normalizedName = normalizeAIModelName(aiModel);
        setAiModelFilter(normalizedName);
        setActiveAIModel(normalizedName);
      }
      
      if (author && typeof author === 'string') {
        setAuthorFilter(author);
      }
    }
  }, [router.query, clearFilters, setCategoryFilter, setAiModelFilter, setAuthorFilter]);
  
  // 정렬 옵션 정의
  const sortOptions = [
    { value: 'latest', label: '최신순', icon: '' },
    { value: 'likes', label: '좋아요순', icon: '' },
    { value: 'views', label: '조회수순', icon: '' },
    { value: 'bookmarks', label: '북마크순', icon: '' },
  ];
  
  // AI모델 이름 정규화 함수 - 정규화된 이름을 기준으로 통일
  const normalizeAIModelName = (modelName: string): string => {
    const aiModels = [
      { id: 'chatgpt', name: 'ChatGPT' },
      { id: 'claude', name: 'Claude' },
      { id: 'gemini', name: 'Gemini' },
      { id: 'perplexity', name: 'Perplexity' },
      { id: 'copilot', name: 'GitHub Copilot' },
      { id: 'cursor', name: 'Cursor' },
      { id: 'replit', name: 'Replit' },
      { id: 'v0', name: 'v0' },
      { id: 'dalle', name: 'DALL-E' },
      { id: 'midjourney', name: 'Midjourney' },
      { id: 'stable-diffusion', name: 'Stable Diffusion' },
      { id: 'leonardo', name: 'Leonardo AI' },
      { id: 'runway', name: 'Runway' },
      { id: 'pika', name: 'Pika Labs' },
      { id: 'kling', name: 'Kling' },
      { id: 'sora', name: 'Sora' },
      { id: 'elevenlabs', name: 'ElevenLabs' },
      { id: 'jasper', name: 'Jasper' },
      { id: 'copy-ai', name: 'Copy.ai' },
      { id: 'other', name: '기타' },
    ];
    
    const normalizedName = modelName.toLowerCase();
    const model = aiModels.find(m => 
      m.id.toLowerCase() === normalizedName || 
      m.name.toLowerCase() === normalizedName
    );
    
    // 항상 정규화된 이름 반환 (대문자로 시작하는 표준 이름)
    return model?.name || modelName;
  };

  const { 
    prompts: apiPrompts, 
    loading, 
    loadingMore,
    error, 
    refetch, 
    loadMore,
    hasMore 
  } = usePrompts({ 
    sort: sortBy,
    limit: 20,
    category: (() => {
      const currentCategory = activeCategory !== 'all' ? activeCategory : categoryFilter;
      console.log('[DEBUG] usePrompts category - activeCategory:', activeCategory, 'categoryFilter:', categoryFilter, 'currentCategory:', currentCategory);
      return currentCategory && currentCategory !== 'all' ? currentCategory : undefined;
    })(),
    aiModel: (() => {
      const currentAIModel = activeAIModel !== 'all' ? activeAIModel : aiModelFilter;
      return currentAIModel && currentAIModel !== 'all' ? normalizeAIModelName(currentAIModel) : undefined;
    })(),
    authorFilter: authorFilter || undefined
  });
  
  // 필터링 변경 시 API 재호출
  useEffect(() => {
    if (useAPI) {
      refetch();
    }
  }, [activeCategory, activeAIModel, authorFilter, categoryFilter, aiModelFilter, refetch, useAPI]);
  
  // API 사용 시 apiPrompts, 아니면 initialPrompts 사용
  const promptsData = useAPI ? apiPrompts : (initialPrompts || []);
  
  const [prompts, setPrompts] = useState<Prompt[]>(promptsData);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(promptsData);
  
  // Infinite scroll을 위한 observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const categories: { value: CategoryType; label: string; icon: string }[] = [
    { value: 'all', label: '전체', icon: '' },
    { value: 'work', label: '업무/마케팅', icon: '💼' },
    { value: 'dev', label: '개발/코드', icon: '💻' },
    { value: 'design', label: '디자인/브랜드', icon: '🎨' },
    { value: 'edu', label: '교육/학습', icon: '📚' },
    { value: 'image', label: '이미지/동영상', icon: '🎬' },
  ];

  // AI 모델 목록 (프롬프트 생성 페이지와 동일)
  const aiModels = [
    // 텍스트 생성 AI
    { id: 'chatgpt', name: 'ChatGPT', icon: '/image/icon_chatgpt.png' },
    { id: 'claude', name: 'Claude', icon: '/image/icon_claude.png' },
    { id: 'gemini', name: 'Gemini', icon: '/image/icon_gemini.png' },
    { id: 'perplexity', name: 'Perplexity', icon: '/image/icon_perplexity.png' },
    
    // 코딩 AI
    { id: 'copilot', name: 'GitHub Copilot', icon: '/image/icon_gpt-4_code.png' },
    { id: 'cursor', name: 'Cursor', icon: '/image/icon_cursor-ai.png' },
    { id: 'replit', name: 'Replit', icon: '/image/icon_Replit.png' },
    { id: 'v0', name: 'v0', icon: '/image/icon_v0.png' },
    
    // 이미지 생성 AI
    { id: 'dalle', name: 'DALL-E', icon: '/image/icon_dall_e_3.png' },
    { id: 'midjourney', name: 'Midjourney', icon: '/image/icon_midjourney.png' },
    { id: 'stable-diffusion', name: 'Stable Diffusion', icon: '/image/icon_Stable_Diffusion.png' },
    { id: 'leonardo', name: 'Leonardo AI', icon: '/image/icon_leonardo_ai.png' },
    
    // 비디오 생성 AI
    { id: 'runway', name: 'Runway', icon: '/image/icon_runway.png' },
    { id: 'pika', name: 'Pika Labs', icon: '/image/icon_PikaLabs.png' },
    { id: 'kling', name: 'Kling', icon: '/image/icon_kling.png' },
    { id: 'sora', name: 'Sora', icon: '/image/icon_Sora.png' },
    
    // 기타 AI 도구
    { id: 'elevenlabs', name: 'ElevenLabs', icon: '/image/icon_ElevenLabs.png' },
    { id: 'jasper', name: 'Jasper', icon: '/image/icon_jasper.png' },
    { id: 'copy-ai', name: 'Copy.ai', icon: '/image/icon_Copy-ai.png' },
    { id: 'other', name: '기타', icon: '🔧' },
  ];

  // AI 모델 목록 (전체 + 프롬프트 생성 페이지와 동일한 목록)
  const uniqueAIModels = React.useMemo(() => {
    return ['all', ...aiModels.map(model => model.name)];
  }, []);

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
      // console.log('[DEBUG] PromptGrid - apiPrompts loaded:', apiPrompts.length);
      // console.log('[DEBUG] First apiPrompt category and aiModel:', {
      //   category: apiPrompts[0]?.category,
      //   aiModel: apiPrompts[0]?.aiModel
      // });
      setPrompts(apiPrompts);
    } else if (!useAPI && initialPrompts) {
      // console.log('[DEBUG] PromptGrid - initialPrompts loaded:', initialPrompts.length);
      // console.log('[DEBUG] First initialPrompt category and aiModel:', {
      //   category: initialPrompts[0]?.category,
      //   aiModel: initialPrompts[0]?.aiModel
      // });
      setPrompts(initialPrompts);
    }
  }, [apiPrompts, initialPrompts, useAPI]);

  // Intersection Observer 설정
  useEffect(() => {
    if (!useAPI) return; // API를 사용하지 않는 경우 무한 스크롤 비활성화

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    const currentObserver = observerRef.current;
    const currentLoadMoreRef = loadMoreRef.current;

    if (currentLoadMoreRef) {
      currentObserver.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentObserver && currentLoadMoreRef) {
        currentObserver.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, loadingMore, loading, loadMore, useAPI]);


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

  // API 사용 시에는 서버에서 필터링된 데이터를 받아오므로 로컬 필터링 불필요
  // initialPrompts 사용 시에만 로컬 필터링 적용
  useEffect(() => {
    console.log('[DEBUG] PromptGrid filtering - useAPI:', useAPI, 'prompts count:', prompts.length);
    console.log('[DEBUG] Current filters - activeCategory:', activeCategory, 'activeAIModel:', activeAIModel, 'categoryFilter:', categoryFilter, 'aiModelFilter:', aiModelFilter);
    
    if (useAPI) {
      // API 사용 시에는 서버에서 이미 필터링된 데이터를 받아옴
      console.log('[DEBUG] Using API data directly, no client-side filtering');
      setFilteredPrompts(prompts);
    } else {
      // initialPrompts 사용 시에만 로컬 필터링 적용
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

      // Category filter (로컬 상태 우선, 없으면 SearchContext 사용)
      const currentCategory = activeCategory !== 'all' ? activeCategory : categoryFilter;
      if (currentCategory && currentCategory !== 'all') {
        filtered = filtered.filter(prompt => prompt.category === currentCategory);
      }

      // AI Model filter (로컬 상태 우선, 없으면 SearchContext 사용)
      const currentAIModel = activeAIModel !== 'all' ? activeAIModel : aiModelFilter;
      if (currentAIModel && currentAIModel !== 'all') {
        filtered = filtered.filter(prompt => {
          // AI모델 이름 추출 (여러 필드 확인)
          const aiModelName = prompt.aiModel?.name || prompt.ai_model || '';
          
          // 대소문자 무시하고 정확한 매칭
          const normalizedPromptModel = aiModelName.toLowerCase();
          const normalizedFilterModel = currentAIModel.toLowerCase();
          
          // AI모델 정의에서 정규화된 이름으로 매칭
          const aiModels = [
            { id: 'chatgpt', name: 'ChatGPT' },
            { id: 'claude', name: 'Claude' },
            { id: 'gemini', name: 'Gemini' },
            { id: 'perplexity', name: 'Perplexity' },
            { id: 'copilot', name: 'GitHub Copilot' },
            { id: 'cursor', name: 'Cursor' },
            { id: 'replit', name: 'Replit' },
            { id: 'v0', name: 'v0' },
            { id: 'dalle', name: 'DALL-E' },
            { id: 'midjourney', name: 'Midjourney' },
            { id: 'stable-diffusion', name: 'Stable Diffusion' },
            { id: 'leonardo', name: 'Leonardo AI' },
            { id: 'runway', name: 'Runway' },
            { id: 'pika', name: 'Pika Labs' },
            { id: 'kling', name: 'Kling' },
            { id: 'sora', name: 'Sora' },
            { id: 'elevenlabs', name: 'ElevenLabs' },
            { id: 'jasper', name: 'Jasper' },
            { id: 'copy-ai', name: 'Copy.ai' },
            { id: 'other', name: '기타' },
          ];
          
          // 프롬프트의 AI모델을 정규화된 이름으로 변환
          const promptModel = aiModels.find(m => 
            m.id.toLowerCase() === normalizedPromptModel || 
            m.name.toLowerCase() === normalizedPromptModel
          )?.name || aiModelName;
          
          // 필터의 AI모델을 정규화된 이름으로 변환
          const filterModel = aiModels.find(m => 
            m.id.toLowerCase() === normalizedFilterModel || 
            m.name.toLowerCase() === normalizedFilterModel
          )?.name || currentAIModel;
          
          return promptModel.toLowerCase() === filterModel.toLowerCase();
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
    }
  }, [prompts, activeCategory, sortBy, searchQuery, activeAIModel, activeTag, authorFilter, categoryFilter, aiModelFilter, useAPI]);

  const handleCreatePrompt = () => {
    if (isAuthenticated) {
      router.push('/prompt/create');
    } else {
      router.push('/login');
    }
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (category: string) => {
    console.log('[DEBUG] handleCategoryClick - category:', category, 'activeCategory:', activeCategory, 'categoryFilter:', categoryFilter);
    if (activeCategory === category || categoryFilter === category) {
      // 같은 카테고리를 다시 클릭하면 필터 해제
      console.log('[DEBUG] Same category clicked, clearing filter');
      setActiveCategory('all');
      setCategoryFilter(null);
    } else {
      console.log('[DEBUG] Setting new category filter:', category);
      setActiveCategory(category as CategoryType);
      setCategoryFilter(category);
      setActiveAIModel('all'); // 다른 필터 초기화
      setActiveTag('all');
      setAiModelFilter(null);
    }
  };

  // AI모델 클릭 핸들러
  const handleAIModelClick = (aiModel: string) => {
    if (activeAIModel === aiModel || aiModelFilter === aiModel) {
      // 같은 AI 모델을 다시 클릭하면 필터 해제
      setActiveAIModel('all');
      setAiModelFilter(null);
    } else {
      setActiveAIModel(aiModel);
      setAiModelFilter(aiModel);
      setActiveCategory('all'); // 다른 필터 초기화
      setActiveTag('all');
      setCategoryFilter(null);
    }
  };

  // 태그 클릭 핸들러
  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // 같은 태그를 다시 클릭하면 필터 해제
      setActiveTag('all');
    } else {
      setActiveTag(tag);
      setActiveCategory('all'); // 다른 필터 초기화
      setActiveAIModel('all');
      setCategoryFilter(null);
      setAiModelFilter(null);
    }
  };

  // 작성자 클릭 핸들러
  const handleAuthorClick = (author: string) => {
    if (authorFilter === author) {
      // 같은 작성자를 다시 클릭하면 필터 해제
      setAuthorFilter(null);
    } else {
      setAuthorFilter(author);
      setActiveCategory('all'); // 다른 필터 초기화
      setActiveAIModel('all');
      setActiveTag('all');
      setCategoryFilter(null);
      setAiModelFilter(null);
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
              당신의 AI 경험을 한층 높여줄 최고의 프롬프트 라이브러리<br />
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
          {(activeCategory !== 'all' || activeAIModel !== 'all' || activeTag !== 'all' || authorFilter || categoryFilter || aiModelFilter) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap bg-orange-50 border border-orange-200 rounded-lg p-3">
                <span className="text-sm font-medium text-orange-600">활성 필터:</span>
                
                {/* 카테고리 필터 - 통일된 로직 */}
                {(categoryFilter || activeCategory !== 'all') && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    카테고리: {categoryFilter ? 
                      (categories.find(c => c.value === categoryFilter)?.label || categoryFilter) : 
                      categories.find(cat => cat.value === activeCategory)?.label
                    }
                    <button
                      onClick={() => {
                        console.log('[DEBUG] 카테고리 필터 제거 - categoryFilter:', categoryFilter, 'activeCategory:', activeCategory);
                        setCategoryFilter(null);
                        setActiveCategory('all');
                        // URL에서 카테고리 파라미터 제거
                        const { category, ...restQuery } = router.query;
                        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
                      }}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* AI모델 필터 - 통일된 로직 */}
                {(aiModelFilter || activeAIModel !== 'all') && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    AI모델: {aiModelFilter || activeAIModel}
                    <button
                      onClick={() => {
                        console.log('[DEBUG] AI모델 필터 제거 - aiModelFilter:', aiModelFilter, 'activeAIModel:', activeAIModel);
                        setAiModelFilter(null);
                        setActiveAIModel('all');
                        // URL에서 AI모델 파라미터 제거
                        const { aiModel, ...restQuery } = router.query;
                        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
                      }}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 태그 필터 - 통일된 로직 */}
                {activeTag !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    태그: {activeTag}
                    <button
                      onClick={() => {
                        console.log('[DEBUG] 태그 필터 제거 - activeTag:', activeTag);
                        setActiveTag('all');
                        // URL에서 태그 파라미터 제거
                        const { tag, ...restQuery } = router.query;
                        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
                      }}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 작성자 필터 - 통일된 로직 */}
                {authorFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                    작성자: {authorFilter}
                    <button
                      onClick={() => {
                        console.log('[DEBUG] 작성자 필터 제거 - authorFilter:', authorFilter);
                        setAuthorFilter(null);
                        // URL에서 작성자 파라미터 제거
                        const { author, ...restQuery } = router.query;
                        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
                      }}
                      className="ml-1 hover:text-orange-900 text-orange-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                <button
                  onClick={() => {
                    console.log('[DEBUG] 모든 필터 제거');
                    setActiveCategory('all');
                    setActiveAIModel('all');
                    setActiveTag('all');
                    setCategoryFilter(null);
                    setAiModelFilter(null);
                    clearFilters();
                    // URL을 홈으로 이동 (모든 쿼리 파라미터 제거)
                    router.replace('/', undefined, { shallow: true });
                  }}
                  className="ml-2 px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm hover:bg-orange-300 transition-colors"
                >
                  모든 필터 제거
                </button>
              </div>
            </div>
          )}

          {/* Category, Sort, and Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 items-start">

            {/* Category Selector */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">카테고리</span>
              <div className="category-dropdown-container relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 w-[120px] sm:w-[130px] h-[30px] sm:h-[40px]"
                >
                  <span className="text-xs sm:text-sm">{selectedCategoryOption.icon}</span>
                  <span className="text-gray-700 truncate text-xs sm:text-sm">{selectedCategoryOption.label}</span>
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
                        className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedCategoryOption.value === category.value ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{category.icon}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{category.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Model Selector */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">AI모델</span>
              <div className="aimodel-dropdown-container relative">
                <button
                  onClick={() => setShowAIModelDropdown(!showAIModelDropdown)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 w-[120px] sm:w-[150px] h-[30px] sm:h-[40px]"
                >
                  {activeAIModel === 'all' ? (
                    <span className="text-xs sm:text-sm"></span>
                  ) : (() => {
                    const model = aiModels.find(m => m.name === activeAIModel);
                    return model ? (
                      model.icon === '🔧' ? (
                        <span className="text-xs sm:text-sm">{model.icon}</span>
                      ) : (
                        <img 
                          src={model.icon} 
                          alt={activeAIModel}
                          className="w-3 h-3 sm:w-4 sm:h-4 object-contain flex-shrink-0"
                        />
                      )
                    ) : (
                      <span className="text-xs sm:text-sm">🔧</span>
                    );
                  })()}
                  <span className="text-gray-700 truncate text-xs sm:text-sm">
                    {activeAIModel === 'all' ? '전체' : activeAIModel}
                  </span>
                </button>

                {showAIModelDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto scrollbar-orange">
                    {uniqueAIModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setActiveAIModel(model);
                          setShowAIModelDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          activeAIModel === model ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        {model === 'all' ? (
                          <span className="text-xs sm:text-sm"></span>
                        ) : (() => {
                          const aiModel = aiModels.find(m => m.name === model);
                          return aiModel ? (
                            aiModel.icon === '🔧' ? (
                              <span className="text-xs sm:text-sm">{aiModel.icon}</span>
                            ) : (
                              <img 
                                src={aiModel.icon} 
                                alt={model}
                                className="w-3 h-3 sm:w-4 sm:h-4 object-contain flex-shrink-0"
                              />
                            )
                          ) : (
                            <span className="text-xs sm:text-sm">🔧</span>
                          );
                        })()}
                        <span className={`font-medium text-gray-700 ${model !== 'all' && model.length > 12 ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                          {model === 'all' ? '전체' : model}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">정렬</span>
              <div className="sort-dropdown-container relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between w-[120px] sm:w-[100px] h-[30px] sm:h-[40px]"
                >
                  <span className="text-gray-700 truncate text-xs sm:text-sm">{selectedSortOption.label}</span>
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
                        className={`w-full flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedSortOption.value === option.value ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{option.label}</span>
                        <span className="text-xs sm:text-sm text-gray-700">{option.icon}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Spacer to push buttons to the right */}
            <div className="flex-1"></div>

            {/* Trending Prompts - 이제 SearchBar 내부로 이동됨 */}

            {/* Action Buttons */}
            <div className="flex gap-1 sm:gap-2 items-center">
              {/* New 버튼 - 로그인한 사용자만 표시 */}
              {isAuthenticated && (
                <Link href="/prompt/create">
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm h-[30px] sm:h-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New</span>
                  </button>
                </Link>
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
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm h-[30px] sm:h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow-md justify-center"
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
              {filteredPrompts.map((prompt, index) => (
                <div key={prompt.id} className="w-full mb-6">
                  <PromptCardCompact
                    prompt={prompt}
                    onLike={handleLike}
                    onBookmark={isAuthenticated ? handleBookmark : undefined}
                    isBookmarked={bookmarkedPromptIds ? bookmarkedPromptIds.includes(prompt.id) : false}
                    onCategoryClick={handleCategoryClick}
                    onAIModelClick={handleAIModelClick}
                    onTagClick={handleTagClick}
                    onAuthorClick={handleAuthorClick}
                    priority={index === 0}
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

          {/* 더 많은 프롬프트를 로드하는 중 표시 */}
          {useAPI && loadingMore && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">더 많은 프롬프트를 불러오는 중...</p>
            </div>
          )}

          {/* 무한 스크롤 트리거 */}
          {useAPI && hasMore && !loading && (
            <div ref={loadMoreRef} className="h-10" />
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