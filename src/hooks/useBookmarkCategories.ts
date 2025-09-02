import { useState, useEffect, useCallback } from 'react';
import { BookmarkCategory } from '@/types/prompt';

export const useBookmarkCategories = () => {
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setCategories([]);
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
      } else {
        console.warn('[DEBUG] Invalid categories data:', data);
        setCategories([]);
      }
    } catch (err: unknown) {
      console.error('[DEBUG] useBookmarkCategories error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setCategories([]);
    } finally {
      setLoading(false);
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

      await fetchCategories();
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

      await fetchCategories();
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

      await fetchCategories();
    } catch (err: unknown) {
      console.error('[DEBUG] Delete category error:', err);
      throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
    }
  };

  const refetch = () => {
    fetchCategories();
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
