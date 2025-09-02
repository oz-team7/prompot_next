import { useState, useEffect } from 'react';
import { Bookmark } from '@/types/prompt';

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  addBookmark: (promptId: number) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useBookmarks = (): UseBookmarksReturn => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      console.log('[DEBUG] Token from localStorage:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.log('[DEBUG] No token found in localStorage');
        setError('인증이 필요합니다.');
        return;
      }

      // 인증 디버깅 API 호출
      try {
        const debugRes = await fetch('/api/test-token', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const debugData = await debugRes.json();
        console.log('[DEBUG] Auth debug result:', debugData);
      } catch (debugError) {
        console.error('[DEBUG] Auth debug error:', debugError);
      }

      const res = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[DEBUG] Bookmarks response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('[DEBUG] Bookmarks error response:', errorData);
        throw new Error(errorData.message || '북마크 목록을 가져오는데 실패했습니다.');
      }

      const data = await res.json();
      console.log('[DEBUG] Bookmarks data:', data);
      setBookmarks(data.bookmarks);
    } catch (err) {
      console.error('Fetch bookmarks error:', err);
      setError(err instanceof Error ? err.message : '북마크 목록을 가져오는데 실패했습니다.');
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

      console.log('[DEBUG] Adding bookmark for prompt:', promptId);
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

      console.log('[DEBUG] Bookmark added successfully');
      // 북마크 목록 새로고침
      await fetchBookmarks();
    } catch (err) {
      console.error('Add bookmark error:', err);
      throw err;
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      console.log('[DEBUG] Removing bookmark:', bookmarkId);
      const res = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookmarkId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '북마크 삭제에 실패했습니다.');
      }

      console.log('[DEBUG] Bookmark removed successfully');
      // 북마크 목록 새로고침 (로컬 상태 업데이트 대신)
      await fetchBookmarks();
    } catch (err) {
      console.error('Remove bookmark error:', err);
      throw err;
    }
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
    refetch: fetchBookmarks,
  };
};
