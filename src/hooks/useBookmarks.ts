import { useState, useEffect, useCallback, useRef } from 'react';
import { Prompt } from '@/types/prompt';

interface Bookmark {
  id: number;
  prompt: {
    id: number;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    aiModel: string;
    previewImage?: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    author: string;
    authorId?: string;
  };
  createdAt: string;
  categoryId?: string | null;
}

// 실시간 동기화를 위한 이벤트 키
const BOOKMARK_SYNC_KEY = 'prompot_bookmarks_sync';
const BOOKMARK_STORAGE_KEY = 'prompot_bookmarks_cache';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  // 실시간 동기화 트리거 함수
  const triggerSync = useCallback((action: 'add' | 'remove' | 'refresh', promptId?: number) => {
    const now = Date.now();
    const syncData = { action, promptId, timestamp: now };
    
    // localStorage 이벤트로 다른 탭에 알림
    localStorage.setItem(BOOKMARK_SYNC_KEY, JSON.stringify(syncData));
    lastSyncRef.current = now;
    
    // console.log('[SYNC] Triggered sync event:', syncData);
  }, []);

  // 캐시된 북마크 로드
  const loadCachedBookmarks = useCallback(() => {
    try {
      const cached = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.bookmarks && Array.isArray(data.bookmarks) && data.timestamp > Date.now() - 5 * 60 * 1000) {
          setBookmarks(data.bookmarks);
          return true;
        }
      }
    } catch (err) {
      console.warn('[CACHE] Failed to load cached bookmarks:', err);
    }
    return false;
  }, []);

  // 북마크 캐시 저장
  const saveCachedBookmarks = useCallback((bookmarksData: Bookmark[]) => {
    try {
      const cacheData = {
        bookmarks: bookmarksData,
        timestamp: Date.now()
      };
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('[CACHE] Failed to save cached bookmarks:', err);
    }
  }, []);

  const fetchBookmarks = useCallback(async (useCache = true) => {
    try {
      // 캐시 우선 로드 (성능 최적화)
      if (useCache && loadCachedBookmarks()) {
        // console.log('[CACHE] Loaded bookmarks from cache');
        return;
      }

      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setBookmarks([]);
        saveCachedBookmarks([]);
        return;
      }

      // 서버 연결 상태 확인 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        try {
          const healthCheck = await fetch('/api/test-basic', {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3초 타임아웃
          });
          
          if (!healthCheck.ok) {
            console.warn('[HEALTH] Server health check failed, using cached data');
            // 캐시된 데이터 사용
            const cached = localStorage.getItem(BOOKMARK_STORAGE_KEY);
            if (cached) {
              try {
                const data = JSON.parse(cached);
                if (data.bookmarks && Array.isArray(data.bookmarks)) {
                  setBookmarks(data.bookmarks);
                  return;
                }
              } catch (err) {
                console.warn('[HEALTH] Failed to parse cached bookmarks:', err);
              }
            }
            setBookmarks([]);
            return;
          }
        } catch (healthError) {
          console.warn('[HEALTH] Server health check failed:', healthError);
          // 개발 환경에서 서버가 응답하지 않으면 캐시된 데이터 사용
          const cached = localStorage.getItem(BOOKMARK_STORAGE_KEY);
          if (cached) {
            try {
              const data = JSON.parse(cached);
              if (data.bookmarks && Array.isArray(data.bookmarks)) {
                setBookmarks(data.bookmarks);
                return;
              }
            } catch (err) {
              console.warn('[HEALTH] Failed to parse cached bookmarks:', err);
            }
          }
          setBookmarks([]);
          return;
        }
      }

      // console.log('[DEBUG] Fetching bookmarks from API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const res = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // console.log('[DEBUG] Bookmarks API response status:', res.status);

      if (!res.ok) {
        // 응답이 JSON인지 확인
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          if (res.status === 401 || res.status === 403) {
            // console.log('[DEBUG] Authentication required for bookmarks');
            setBookmarks([]);
            saveCachedBookmarks([]);
            return;
          }
          throw new Error(errorData.message || '북마크를 가져오는데 실패했습니다.');
        } else {
          // HTML 응답인 경우 (에러 페이지 등) - 개발 환경에서 자주 발생하는 문제
          console.warn(`[DEBUG] Received HTML response instead of JSON (${res.status}): ${res.statusText}`);
          
          // 개발 환경에서는 캐시된 데이터 사용, 프로덕션에서는 오류 표시
          if (process.env.NODE_ENV === 'development') {
            console.warn('[DEBUG] Development mode: Using cached data due to server error');
            // 캐시된 데이터가 있으면 사용, 없으면 빈 배열
            const cached = localStorage.getItem(BOOKMARK_STORAGE_KEY);
            if (cached) {
              try {
                const data = JSON.parse(cached);
                if (data.bookmarks && Array.isArray(data.bookmarks)) {
                  setBookmarks(data.bookmarks);
                  return;
                }
              } catch (err) {
                console.warn('[DEBUG] Failed to parse cached bookmarks:', err);
              }
            }
            setBookmarks([]);
            return;
          } else {
            throw new Error(`서버 오류 (${res.status}): ${res.statusText}`);
          }
        }
      }

      const data = await res.json();
      
      if (data && Array.isArray(data.bookmarks)) {
        setBookmarks(data.bookmarks);
        saveCachedBookmarks(data.bookmarks);
        // console.log('[API] Loaded bookmarks from server:', data.bookmarks.length);
      } else {
        console.warn('[DEBUG] Invalid bookmarks data:', data);
        setBookmarks([]);
        saveCachedBookmarks([]);
      }
    } catch (err: unknown) {
      console.error('useBookmarks error:', err);
      
      // 네트워크 오류 처리
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // 네트워크 에러 발생
        setError('네트워크 연결을 확인해주세요. 서버가 실행 중인지 확인해주세요.');
      } else if (err instanceof Error) {
        // "Failed to fetch" 오류 처리
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          // fetch 실패
          setError('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        } else if (err.name === 'AbortError') {
          // 타임아웃 오류
          setError('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
        } else {
          setError(err.message);
        }
      } else {
        console.error('Unknown error type:', typeof err);
        setError('알 수 없는 오류가 발생했습니다.');
      }
      
      // 인증 관련 오류가 아닌 경우에만 북마크 초기화
      if (!(err instanceof Error && err.message.includes('인증'))) {
        setBookmarks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedBookmarks, saveCachedBookmarks]);

  const addBookmark = useCallback(async (promptId: string | number, categoryId?: string | null, promptData?: any) => {
    try {
      // ID 유효성 검증
      if (!promptId || (typeof promptId === 'number' && (isNaN(promptId) || promptId <= 0)) || 
          (typeof promptId === 'string' && promptId.trim() === '')) {
        throw new Error('유효하지 않은 프롬프트 ID입니다.');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const numericPromptId = Number(promptId);
      
      // 이미 북마크되어 있는지 확인
      const existingBookmark = bookmarks.find(b => b.prompt.id === numericPromptId);
      if (existingBookmark) {
        // console.log('[DEBUG] Bookmark already exists for prompt:', numericPromptId);
        return existingBookmark;
      }

      // 즉시 UI 업데이트 (낙관적 업데이트)
      const tempBookmark: Bookmark = {
        id: Date.now(), // 임시 ID (타임스탬프 사용)
        createdAt: new Date().toISOString(),
        categoryId,
        prompt: promptData || {
          id: numericPromptId,
          title: '로딩 중...',
          description: '',
          content: '',
          category: '',
          tags: [],
          aiModel: '',
          previewImage: undefined,
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Unknown',
          authorId: undefined
        }
      };

      // 즉시 UI 반영
      setBookmarks(prev => {
        const filtered = prev.filter(b => b.prompt.id !== numericPromptId);
        const newBookmarks = [...filtered, tempBookmark];
        saveCachedBookmarks(newBookmarks);
        return newBookmarks;
      });

      // API 호출
      // console.log('[DEBUG] Adding bookmark via API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promptId, categoryId }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // console.log('[DEBUG] Add bookmark API response status:', res.status);
      
      if (!res.ok) {
        // 실패 시 롤백
        setBookmarks(prev => {
          const rolledBack = prev.filter(b => b.prompt.id !== numericPromptId);
          saveCachedBookmarks(rolledBack);
          return rolledBack;
        });
        
        // 응답이 JSON인지 확인
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || '북마크 추가에 실패했습니다.');
        } else {
          // HTML 응답인 경우 (에러 페이지 등) - 개발 환경에서 자주 발생하는 문제
          console.warn(`[DEBUG] Add bookmark received HTML response (${res.status}): ${res.statusText}`);
          
          if (process.env.NODE_ENV === 'development') {
            console.warn('[DEBUG] Development mode: Bookmark add failed due to server error');
            throw new Error('개발 서버에 문제가 있습니다. 서버를 재시작해주세요.');
          } else {
            throw new Error(`서버 오류 (${res.status}): ${res.statusText}`);
          }
        }
      }

      const result = await res.json();
      
      // 실제 데이터로 교체
      setBookmarks(prev => {
        const filtered = prev.filter(b => b.prompt.id !== numericPromptId);
        let newBookmarks = filtered;
        
        if (result.bookmark && result.bookmark.prompts) {
          const realBookmark: Bookmark = {
            id: result.bookmark.id,
            createdAt: result.bookmark.created_at,
            categoryId: result.bookmark.category_id,
            prompt: {
              id: result.bookmark.prompts.id,
              title: result.bookmark.prompts.title,
              description: result.bookmark.prompts.description,
              content: result.bookmark.prompts.content,
              category: result.bookmark.prompts.category,
              tags: result.bookmark.prompts.tags,
              aiModel: result.bookmark.prompts.ai_model,
              previewImage: result.bookmark.prompts.preview_image,
              isPublic: result.bookmark.prompts.is_public,
              createdAt: result.bookmark.prompts.created_at,
              updatedAt: result.bookmark.prompts.updated_at,
              author: result.bookmark.prompts.profiles?.name || 'Unknown',
              authorId: result.bookmark.prompts.author_id
            }
          };
          newBookmarks = [...filtered, realBookmark];
        }
        
        saveCachedBookmarks(newBookmarks);
        return newBookmarks;
      });
      
      // 다른 탭에 동기화 신호 전송
      triggerSync('add', numericPromptId);
      
      return result;
    } catch (err: unknown) {
      console.error('Add bookmark error:', err);
      
      // 네트워크 오류 처리
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // 북마크 추가 중 네트워크 오류
        throw new Error('네트워크 연결을 확인해주세요.');
      } else if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          // 북마크 추가 중 fetch 실패
          throw new Error('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        } else if (err.name === 'AbortError') {
          // 타임아웃 오류
          throw new Error('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
        }
        throw err;
      } else {
        throw new Error('알 수 없는 오류가 발생했습니다.');
      }
    }
  }, [bookmarks, saveCachedBookmarks, triggerSync]);

  const removeBookmark = useCallback(async (promptId: string | number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const numericPromptId = Number(promptId);
      
      // 북마크 삭제 정보 로깅 제거

      // 제거할 북마크 백업 (더 안전한 찾기)
      const bookmarkToRemove = bookmarks.find(b => {
        // 타입 안전한 비교 (문자열과 숫자 모두 고려)
        return b.prompt.id === numericPromptId || b.prompt.id === promptId || String(b.prompt.id) === String(promptId);
      });
      
      if (!bookmarkToRemove) {
        // 북마크 ID 정보 로깅 제거
        // 북마크가 없어도 계속 진행 (이미 제거된 경우)
      }
      
      // 즉시 UI 업데이트 (낙관적 업데이트) - 타입 안전한 필터링
      setBookmarks(prev => {
        const newBookmarks = prev.filter(b => {
          // 다양한 타입으로 비교하여 확실히 제거
          return !(b.prompt.id === numericPromptId || 
                   b.prompt.id === promptId || 
                   String(b.prompt.id) === String(promptId));
        });
        saveCachedBookmarks(newBookmarks);
        // UI 업데이트 정보 로깅 제거
        return newBookmarks;
      });

      // API 호출
      // console.log('[DEBUG] Removing bookmark via API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const res = await fetch(`/api/bookmarks?promptId=${promptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // console.log('[DEBUG] Remove bookmark API response status:', res.status);

      if (!res.ok) {
        // 실패 시 롤백 (백업된 북마크가 있는 경우에만)
        // console.log('[DEBUG] removeBookmark - API failed, rolling back');
        if (bookmarkToRemove) {
          setBookmarks(prev => {
            // 중복 방지: 이미 있는지 확인 후 추가
            const exists = prev.some(b => 
              b.prompt.id === bookmarkToRemove.prompt.id || 
              String(b.prompt.id) === String(bookmarkToRemove.prompt.id)
            );
            const rolledBack = exists ? prev : [...prev, bookmarkToRemove];
            saveCachedBookmarks(rolledBack);
            // 롤백 정보 로깅 제거
            return rolledBack;
          });
        }
        
        // 응답이 JSON인지 확인
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || '북마크 삭제에 실패했습니다.');
        } else {
          // HTML 응답인 경우 (에러 페이지 등) - 개발 환경에서 자주 발생하는 문제
          console.warn(`[DEBUG] Remove bookmark received HTML response (${res.status}): ${res.statusText}`);
          
          if (process.env.NODE_ENV === 'development') {
            console.warn('[DEBUG] Development mode: Bookmark remove failed due to server error');
            throw new Error('개발 서버에 문제가 있습니다. 서버를 재시작해주세요.');
          } else {
            throw new Error(`서버 오류 (${res.status}): ${res.statusText}`);
          }
        }
      }
      
      // 다른 탭에 동기화 신호 전송
      triggerSync('remove', numericPromptId);
      
      // console.log('[DEBUG] removeBookmark - API success');
      return await res.json();
    } catch (err: unknown) {
      console.error('Remove bookmark error:', err);
      
      // 네트워크 오류 처리
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // 북마크 제거 중 네트워크 오류
        throw new Error('네트워크 연결을 확인해주세요.');
      } else if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          // 북마크 제거 중 fetch 실패
          throw new Error('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        } else if (err.name === 'AbortError') {
          // 타임아웃 오류
          throw new Error('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
        }
        throw err;
      } else {
        throw new Error('알 수 없는 오류가 발생했습니다.');
      }
    }
  }, [bookmarks, saveCachedBookmarks, triggerSync]);

  const refetch = useCallback(async () => {
    try {
      return await fetchBookmarks(false); // 강제로 서버에서 새로고침
    } catch (err) {
      console.error('Refetch error:', err);
      // refetch 실패 시에도 앱이 멈추지 않도록 처리
      throw err;
    }
  }, [fetchBookmarks]);

  // 북마크 존재 여부 확인 (타입 안전한 비교)
  const isBookmarked = useCallback((promptId: number | string) => {
    const numericId = Number(promptId);
    const result = bookmarks.some(b => {
      return b.prompt.id === numericId || 
             b.prompt.id === promptId || 
             String(b.prompt.id) === String(promptId);
    });
    
    // 디버깅 로그를 조건부로만 출력 (북마크가 있을 때만)
    // 북마크 찾기 결과 로깅 제거
    
    return result;
  }, [bookmarks]);

  // 카테고리별 북마크 필터링
  const getBookmarksByCategory = useCallback((categoryId: string | null) => {
    if (categoryId === null) return bookmarks; // 전체
    if (categoryId === 'uncategorized') return bookmarks.filter(b => !b.categoryId); // 카테고리 없음
    return bookmarks.filter(b => b.categoryId === categoryId); // 특정 카테고리
  }, [bookmarks]);

  // 실시간 동기화 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === BOOKMARK_SYNC_KEY && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          const { timestamp, action, promptId } = syncData;
          
          // 자신이 보낸 이벤트는 무시 (중복 방지)
          if (timestamp <= lastSyncRef.current + 1000) {
            return;
          }
          
          // console.log('[SYNC] Received sync event:', syncData);
          
          // 디바운스를 통한 중복 요청 방지
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
          }
          
          syncTimeoutRef.current = setTimeout(() => {
            // console.log('[SYNC] Processing sync event:', action);
            fetchBookmarks(false); // 캐시 무시하고 서버에서 새로고침
          }, 500);
          
        } catch (err) {
          console.warn('[SYNC] Failed to parse sync event:', err);
        }
      }
    };

    // 브라우저 포커스 이벤트 (탭 전환 시 동기화)
    const handleFocus = () => {
      // console.log('[SYNC] Window focused, refreshing bookmarks');
      try {
        fetchBookmarks(false);
      } catch (err) {
        console.error('[SYNC] Error during focus refresh:', err);
        // 에러가 발생해도 앱이 멈추지 않도록 처리
        // 사용자에게는 조용히 실패 (백그라운드 동기화이므로)
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // 초기 로드 (에러 처리 포함)
    try {
      fetchBookmarks();
    } catch (err) {
      console.error('Initial bookmark load error:', err);
      // 초기 로드 실패 시에도 앱이 멈추지 않도록 처리
    }

    return () => {
      // 정리
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [fetchBookmarks]);

  return {
    bookmarks,
    loading,
    error,
    addBookmark,
    removeBookmark,
    refetch,
    isBookmarked,
    getBookmarksByCategory,
  };
};
