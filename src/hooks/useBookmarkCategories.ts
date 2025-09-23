import { useState, useEffect, useCallback, useRef } from 'react';
import { BookmarkCategory } from '@/types/prompt';

export const useBookmarkCategories = () => {
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 캐시 및 중복 요청 방지
  const cache = useRef<{ data: BookmarkCategory[] | null; timestamp: number | null }>({
    data: null,
    timestamp: null
  });
  const isRequestInProgress = useRef(false);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    try {
      // 캐시 확인 (5분간 유효)
      const now = Date.now();
      const cacheAge = cache.current.timestamp ? now - cache.current.timestamp : Infinity;
      const isCacheValid = cacheAge < 5 * 60 * 1000; // 5분
      
      if (!forceRefresh && isCacheValid && cache.current.data) {
        console.log('[DEBUG] Using cached categories');
        setCategories(cache.current.data);
        return;
      }
      
      // 중복 요청 방지
      if (isRequestInProgress.current) {
        console.log('[DEBUG] Request already in progress, skipping');
        return;
      }
      
      isRequestInProgress.current = true;
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setCategories([]);
        cache.current = { data: [], timestamp: now };
        return;
      }

      const res = await fetch('/api/bookmark-categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '북마크 카테고리를 가져오는데 실패했습니다.');
      }

      const data = await res.json();
      
      if (data && Array.isArray(data.categories)) {
        setCategories(data.categories);
        cache.current = { data: data.categories, timestamp: now };
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Categories fetched and cached:', data.categories.length);
        }
      } else {
        console.warn('[DEBUG] Invalid categories data:', data);
        setCategories([]);
        cache.current = { data: [], timestamp: now };
      }
    } catch (err: unknown) {
      console.error('[DEBUG] useBookmarkCategories error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setCategories([]);
    } finally {
      setLoading(false);
      isRequestInProgress.current = false;
    }
  }, []);

  const createCategory = async (name: string, color: string = '#3B82F6') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const res = await fetch('/api/bookmark-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, color }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '카테고리 생성에 실패했습니다.');
      }

      await fetchCategories(true); // 강제 새로고침
    } catch (err: unknown) {
      console.error('[DEBUG] Create category error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const updateCategory = async (id: string, name: string, color: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const res = await fetch(`/api/bookmark-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, color }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '카테고리 수정에 실패했습니다.');
      }

      await fetchCategories(true); // 강제 새로고침
    } catch (err: unknown) {
      console.error('[DEBUG] Update category error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const res = await fetch(`/api/bookmark-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '카테고리 삭제에 실패했습니다.');
      }

      await fetchCategories(true); // 강제 새로고침
    } catch (err: unknown) {
      console.error('[DEBUG] Delete category error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const refetch = () => {
    fetchCategories(true); // 강제 새로고침
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch,
  };
};
