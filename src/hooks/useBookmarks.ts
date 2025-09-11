import { useState, useEffect } from 'react';
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

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // 토큰이 없으면 빈 배열로 설정하고 조용히 리턴
        setBookmarks([]);
        return;
      }

      const res = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        // 인증 오류인 경우 조용히 처리
        if (res.status === 401 || res.status === 403) {
          console.log('[DEBUG] Authentication required for bookmarks');
          setBookmarks([]);
          return;
        }
        throw new Error(errorData.message || '북마크를 가져오는데 실패했습니다.');
      }

      const data = await res.json();
      
      // 안전한 데이터 설정
      if (data && Array.isArray(data.bookmarks)) {
        setBookmarks(data.bookmarks);
      } else {
        console.warn('[DEBUG] Invalid bookmarks data:', data);
        setBookmarks([]);
      }
    } catch (err: unknown) {
      console.error('[DEBUG] useBookmarks error:', err);
      // 인증 관련 오류는 조용히 처리
      if (err instanceof Error && err.message.includes('인증')) {
        setBookmarks([]);
        return;
      }
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setBookmarks([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (promptId: string | number, categoryId?: string | null, promptData?: any) => {
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
        console.log('[DEBUG] Bookmark already exists for prompt:', numericPromptId);
        return existingBookmark;
      }

      // 즉시 UI 업데이트 (낙관적 업데이트) - 프롬프트 ID 기반으로 관리
      const tempBookmark = {
        id: -1, // 임시 ID (음수로 구분)
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

      // 중복 방지를 위해 프롬프트 ID로 필터링
      setBookmarks(prev => {
        const filtered = prev.filter(b => b.prompt.id !== numericPromptId);
        return [...filtered, tempBookmark];
      });

      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promptId, categoryId }),
      });
      
      if (!res.ok) {
        // 실패 시 롤백 - 프롬프트 ID로 필터링
        setBookmarks(prev => prev.filter(b => b.prompt.id !== numericPromptId));
        const errorData = await res.json();
        throw new Error(errorData.message || '북마크 추가에 실패했습니다.');
      }

      const result = await res.json();
      
      // 실제 데이터로 교체 - 프롬프트 ID로 필터링
      setBookmarks(prev => {
        const filtered = prev.filter(b => b.prompt.id !== numericPromptId);
        if (result.bookmark && result.bookmark.prompts) {
          return [...filtered, {
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
          }];
        }
        return filtered;
      });
      
      return result;
    } catch (err: unknown) {
      console.error('Add bookmark error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const removeBookmark = async (promptId: string | number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const numericPromptId = Number(promptId);
      
      // 더 명확한 디버그 로그
      console.log('[DEBUG] removeBookmark - removing promptId:', numericPromptId);
      console.log('[DEBUG] removeBookmark - bookmarks before:', bookmarks.map(b => b.prompt.id));

      // 즉시 UI 업데이트 (낙관적 업데이트) - 더 명확한 상태 업데이트
      const bookmarkToRemove = bookmarks.find(b => b.prompt.id === numericPromptId);
      
      setBookmarks(prev => {
        const newBookmarks = prev.filter(b => b.prompt.id !== numericPromptId);
        console.log('[DEBUG] removeBookmark - bookmarks after filtering:', {
          before: prev.length,
          after: newBookmarks.length,
          removedId: numericPromptId,
          newIds: newBookmarks.map(b => b.prompt.id)
        });
        return newBookmarks;
      });

      const res = await fetch(`/api/bookmarks?promptId=${promptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // 실패 시 롤백
        console.log('[DEBUG] removeBookmark - API failed, rolling back');
        if (bookmarkToRemove) {
          setBookmarks(prev => [...prev, bookmarkToRemove]);
        }
        const errorData = await res.json();
        throw new Error(errorData.message || '북마크 삭제에 실패했습니다.');
      }
      
      console.log('[DEBUG] removeBookmark - API success');
      return await res.json();
    } catch (err: unknown) {
      console.error('Remove bookmark error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const refetch = async () => {
    return fetchBookmarks();
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return {
    bookmarks,
    loading,
    error,
    addBookmark,
    removeBookmark,
    refetch,
  };
};
