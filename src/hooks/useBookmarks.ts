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
    } catch (err: any) {
      console.error('[DEBUG] useBookmarks error:', err);
      setError(err.message);
      setBookmarks([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (promptId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promptId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '북마크 추가에 실패했습니다.');
      }

      // 북마크 목록 새로고침
      await fetchBookmarks();
    } catch (err: any) {
      console.error('[DEBUG] Add bookmark error:', err);
      throw err;
    }
  };

  const removeBookmark = async (promptId: number) => {
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
    } catch (err: any) {
      console.error('[DEBUG] Remove bookmark error:', err);
      throw err;
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
