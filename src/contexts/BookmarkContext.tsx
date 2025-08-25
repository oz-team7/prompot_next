import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

interface BookmarkContextType {
  bookmarkedPrompts: string[];
  isBookmarked: (promptId: string) => boolean;
  toggleBookmark: (promptId: string) => Promise<boolean>;
  refreshBookmarks: () => Promise<void>;
  loading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

interface BookmarkProviderProps {
  children: ReactNode;
}

export const BookmarkProvider: React.FC<BookmarkProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [bookmarkedPrompts, setBookmarkedPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 북마크 상태 확인
  const checkBookmarkStatus = (promptId: string): boolean => {
    return bookmarkedPrompts.includes(promptId);
  };

  // 북마크 토글
  const toggleBookmark = async (promptId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ promptId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '북마크 토글에 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.success) {
        // 로컬 상태 업데이트
        setBookmarkedPrompts(prev => 
          data.isBookmarked 
            ? [...prev, promptId]
            : prev.filter(id => id !== promptId)
        );
        
        return data.isBookmarked;
      }
      
      throw new Error('북마크 토글에 실패했습니다.');
    } catch (error) {
      console.error('북마크 토글 오류:', error);
      throw error;
    }
  };

  // 북마크 목록 새로고침
  const refreshBookmarks = async () => {
    if (!isAuthenticated) {
      setBookmarkedPrompts([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setBookmarkedPrompts([]);
        return;
      }

      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const bookmarkIds = data.bookmarks?.map((b: any) => b.promptId) || [];
        setBookmarkedPrompts(bookmarkIds);
      } else {
        setBookmarkedPrompts([]);
      }
    } catch (error) {
      console.error('북마크 목록 새로고침 오류:', error);
      setBookmarkedPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태 변경 시 북마크 목록 새로고침
  useEffect(() => {
    refreshBookmarks();
  }, [isAuthenticated]);

  const value: BookmarkContextType = {
    bookmarkedPrompts,
    isBookmarked: checkBookmarkStatus,
    toggleBookmark,
    refreshBookmarks,
    loading,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};
