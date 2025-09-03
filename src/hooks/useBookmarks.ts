import { useState, useEffect } from 'react';
import { Prompt } from '@/types/prompt';

interface Bookmark {
  id: number;
  prompt: Prompt;
  createdAt: string;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
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

  const addBookmark = async (promptId: string | number) => {
    try {
      console.log('[DEBUG] Adding bookmark for promptId:', promptId, 'type:', typeof promptId);
      
      // ID 유효성 검증
      if (!promptId || (typeof promptId === 'number' && (isNaN(promptId) || promptId <= 0)) || 
          (typeof promptId === 'string' && promptId.trim() === '')) {
        throw new Error('유효하지 않은 프롬프트 ID입니다.');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      console.log('[DEBUG] Sending request with data:', { promptId, token: token.substring(0, 20) + '...' });

      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promptId }),
      });

      console.log('[DEBUG] Add bookmark response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('[DEBUG] Add bookmark error data:', errorData);
        throw new Error(errorData.message || '북마크 추가에 실패했습니다.');
      }

      // 북마크 목록 새로고침
      await fetchBookmarks();
    } catch (err: unknown) {
      console.error('[DEBUG] Add bookmark error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const removeBookmark = async (promptId: string | number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const res = await fetch(`/api/bookmarks?promptId=${promptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '북마크 삭제에 실패했습니다.');
      }

      // 북마크 목록 새로고침
      await fetchBookmarks();
    } catch (err: unknown) {
      console.error('[DEBUG] Remove bookmark error:', err);
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
