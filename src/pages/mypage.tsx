import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { usePrompts } from '@/hooks/usePrompts';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Prompt } from '@/types/prompt';
import Toast from '@/components/Toast';
import AvatarUpload from '@/components/AvatarUpload';
import ProfileImageModal from '@/components/ProfileImageModal';
import BookmarkCategoryManager from '@/components/BookmarkCategoryManager';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';

const MyPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'prompts' | 'bookmarks' | 'settings'>('prompts');
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // useMemo를 사용하여 options 객체를 안정화
  const promptsOptions = useMemo(() => ({ author: true }), []);
  const { prompts: allPrompts, loading, error, refetch } = usePrompts(promptsOptions);
  const { bookmarks, loading: bookmarksLoading, error: bookmarksError, removeBookmark, refetch: refetchBookmarks } = useBookmarks();
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [userProfile, setUserProfile] = useState<any>(null);
  const { categories: bookmarkCategories, refetch: refetchBookmarkCategories } = useBookmarkCategories();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // 사용자 프로필 정보 새로고침 함수
  const refreshUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      // 인증된 사용자의 경우 프로필 정보 새로고침
      refreshUserProfile();
    }
  }, [isAuthenticated, router]);

  // URL 파라미터 처리 (프롬프트 생성 후 리다이렉트용)
  useEffect(() => {
    console.log('[DEBUG] URL params check:', { 
      isAuthenticated, 
      tab: router.query.tab, 
      refresh: router.query.refresh 
    });
    
    if (isAuthenticated && router.query.tab === 'prompts' && router.query.refresh === 'true') {
      console.log('[DEBUG] Detected refresh parameter, refetching prompts');
      setActiveTab('prompts');
      
      // 즉시 새로고침 실행
      refetch();
      
      // 캐시 무효화를 위한 추가 새로고침
      setTimeout(() => {
        console.log('[DEBUG] Cache invalidation refetch');
        refetch();
      }, 500);
      
      // URL 파라미터 정리 (shallow: true로 변경하여 페이지 새로고침 방지)
      router.replace('/mypage?tab=prompts', undefined, { shallow: true });
    }
  }, [isAuthenticated, router.query.tab, router.query.refresh, router]);

  useEffect(() => {
    // author=true로 호출했으므로 이미 현재 사용자의 프롬프트만 받아옴
    console.log('[DEBUG] MyPage useEffect - allPrompts:', allPrompts);
    console.log('[DEBUG] MyPage useEffect - user:', user);
    console.log('[DEBUG] MyPage useEffect - isAuthenticated:', isAuthenticated);
    
    if (allPrompts.length > 0) {
      console.log('[DEBUG] Setting prompts directly (already filtered by author=true):', allPrompts);
      setMyPrompts(allPrompts);
    } else {
      console.log('[DEBUG] No prompts available');
      setMyPrompts([]);
    }
  }, [allPrompts, user, isAuthenticated]);

  // 페이지 방문 시 자동 새로고침 추가 (한 번만 실행)
  useEffect(() => {
    if (isAuthenticated && activeTab === 'prompts') {
      console.log('[DEBUG] Initial load - fetching prompts');
      refetch();
    }
  }, [isAuthenticated, activeTab]); // refetch 의존성 제거

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        // localStorage에서 토큰 가져오기
        const token = localStorage.getItem('token');
        console.log('Delete - Token from localStorage:', token); // 디버깅 로그
        
        const res = await fetch(`/api/prompts/${deleteTargetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`, // 인증 헤더 추가
          },
        });

        console.log('Delete - Response status:', res.status); // 디버깅 로그
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || '프롬프트 삭제에 실패했습니다.');
        }

        setMyPrompts(prev => prev.filter(p => p.id !== deleteTargetId));
        setToastMessage('프롬프트가 삭제되었습니다.');
        setToastType('success');
        setShowToast(true);
        setShowDeleteModal(false);
        setDeleteTargetId(null);
        refetch();
      } catch (error) {
        console.error('Delete error:', error); // 디버깅 로그
        setToastMessage('프롬프트 삭제 중 오류가 발생했습니다.');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const handlePasswordChange = async () => {
    const currentPasswordInput = document.getElementById('currentPassword') as HTMLInputElement;
    const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToastMessage('모든 비밀번호 필드를 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (newPassword.length < 6) {
      setToastMessage('새 비밀번호는 6자 이상이어야 합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMessage('새 비밀번호가 일치하지 않습니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      // localStorage에서 토큰 가져오기
      const token = localStorage.getItem('token');
      console.log('Password change - Token from localStorage:', token); // 디버깅 로그
      
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // 인증 헤더 추가
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      console.log('Password change - Response status:', res.status); // 디버깅 로그
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '비밀번호 변경에 실패했습니다.');
      }

      // 성공 처리
      setToastMessage('비밀번호가 성공적으로 변경되었습니다.');
      setToastType('success');
      setShowToast(true);

      // 입력 필드 초기화
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
    } catch (error: any) {
      setToastMessage(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user?.name,
          avatar_url: avatarUrl,
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        // 프로필 사진 업로드 후 사용자 정보 새로고침
        await refreshUserProfile();
        await refreshUser(); // AuthContext의 사용자 정보도 새로고침
        setToastMessage('프로필 사진이 업데이트되었습니다.');
        setToastType('success');
        setShowToast(true);
      } else {
        throw new Error(data.error || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setToastMessage('프로필 업데이트에 실패했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      setToastMessage('비밀번호를 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsDeletingAccount(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deleteAccountPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToastMessage('계정이 성공적으로 삭제되었습니다.');
        setToastType('success');
        setShowToast(true);
        
        // 로그인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        throw new Error(data.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setToastMessage(error.message || '계정 삭제 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountPassword('');
      setShowDeleteAccountModal(false);
    }
  };

  // 인증 상태 확인 및 재로그인 함수
  const checkAuthAndRedirect = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[DEBUG] No token found, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.log('[DEBUG] Token invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      console.log('[DEBUG] Auth check successful');
    } catch (error) {
      console.error('[DEBUG] Auth check error:', error);
      router.push('/login');
    }
  }, [router]);

  // 인증 상태 확인 useEffect
  useEffect(() => {
    if (isAuthenticated) {
      checkAuthAndRedirect();
    }
  }, [isAuthenticated, checkAuthAndRedirect]);

  // 북마크 탭 클릭 핸들러
  const handleBookmarkTabClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    setActiveTab('bookmarks');
    
    // 수동으로 북마크 새로고침
    setTimeout(async () => {
      if (refetchBookmarks && typeof refetchBookmarks === 'function') {
        try {
          await refetchBookmarks();
        } catch (error) {
          console.error('[DEBUG] Manual refetch error:', error);
          setToastMessage('북마크를 불러오는 중 오류가 발생했습니다.');
          setToastType('error');
          setShowToast(true);
        }
      }
    }, 100);
  };

  const tabs = [
    { id: 'prompts', label: '내 프롬프트', count: myPrompts.length },
    { id: 'bookmarks', label: '북마크', count: bookmarks.length },
    { id: 'settings', label: '프로필 수정', count: null },
  ];

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-orange-50/20">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-6">
              {/* 프로필 사진 */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center hover:opacity-90 transition-opacity group relative"
                >
                  {userProfile?.avatar_url || user?.avatar_url ? (
                    <>
                      <img
                        src={userProfile?.avatar_url || user?.avatar_url}
                        alt={user?.name || ''}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">이미지 보기</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-400">
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </button>
              </div>

              {/* 프로필 이미지 모달 */}
              <ProfileImageModal 
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                avatarUrl={userProfile?.avatar_url || user?.avatar_url}
                onEdit={() => {
                  setShowProfileModal(false);
                  setActiveTab('settings');
                }}
              />
              <div>
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>프롬프트 {myPrompts.length}개</span>
                  <span>•</span>
                  <span>북마크 {bookmarks.length}개</span>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex gap-2 mb-6 border-b justify-between items-center">
            <div className="flex gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'bookmarks') {
                      handleBookmarkTabClick();
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`px-4 py-2 font-medium transition-colors relative flex items-center gap-1 ${
                    activeTab === tab.id
                      ? tab.id === 'bookmarks'
                        ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                        : 'text-primary border-b-2 border-primary'
                      : tab.id === 'bookmarks'
                        ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.id === 'bookmarks' && (
                    <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-1 text-sm ${
                      activeTab === tab.id
                        ? tab.id === 'bookmarks'
                          ? 'text-orange-500'
                          : 'text-gray-500'
                        : 'text-gray-500'
                    }`}>
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* 내 프롬프트 탭에서만 추가 버튼 표시 */}
            {activeTab === 'prompts' && (
              <Link
                href="/prompt/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </Link>
            )}
          </div>

          {/* 탭 콘텐츠 */}
          <div>
            {/* 내 프롬프트 탭 */}
            {activeTab === 'prompts' && (
              <div>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">프롬프트를 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <p className="text-red-500">{error}</p>
                    <button onClick={refetch} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                      다시 시도
                    </button>
                  </div>
                ) : myPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myPrompts.map(prompt => (
                      <div key={prompt.id} className="bg-white rounded-lg shadow-sm p-4">
                        {prompt.preview_image && (
                          <div className="relative w-full h-40 mb-3">
                            <Image
                              src={prompt.preview_image}
                              alt={prompt.title}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-1">{prompt.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {prompt.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{prompt.date}</span>
                          <span>좋아요 {prompt.likes}개</span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/prompt/${prompt.id}`}
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-center text-sm"
                          >
                            보기
                          </Link>
                          <Link
                            href={`/prompt/edit/${prompt.id}`}
                            className="flex-1 px-3 py-1.5 bg-primary text-white rounded hover:bg-orange-600 transition-colors text-center text-sm"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-lg">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">아직 작성한 프롬프트가 없습니다</h3>
                    <p className="text-gray-600 mb-4">첫 프롬프트를 작성해보세요!</p>
                    <Link
                      href="/prompt/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      프롬프트 작성
                    </Link>
                  </div>
                )}
              </div>
            )}
            {/* 북마크 탭 */}
            {activeTab === "bookmarks" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">북마크</h2>
                  <button
                    onClick={() => setShowCategoryManager(true)}
                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    카테고리 관리
                  </button>
                </div>

                {/* 카테고리 필터 */}
                {bookmarkCategories.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          selectedCategory === null
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        전체
                      </button>
                      {bookmarkCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
                            selectedCategory === category.id
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                          <span className="text-xs">({category.bookmarkCount || 0})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 북마크 목록 */}
                <div>
                  {bookmarksLoading ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-gray-600">북마크를 불러오는 중...</p>
                    </div>
                  ) : bookmarksError ? (
                    <div className="text-center py-16">
                      <p className="text-red-500">{bookmarksError}</p>
                      <button onClick={refetchBookmarks} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                        다시 시도
                      </button>
                    </div>
                  ) : bookmarks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarks
                        .filter((bookmark: any) => 
                          selectedCategory === null || 
                          bookmark.categoryId === selectedCategory
                        )
                        .map(bookmark => (
                        <div key={bookmark.id} className="bg-white rounded-lg shadow-sm p-4">
                          {bookmark.prompt.preview_image && (
                            <div className="relative w-full h-40 mb-3">
                              <Image
                                src={bookmark.prompt.preview_image}
                                alt={bookmark.prompt.title}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <h3 className="font-semibold mb-1">{bookmark.prompt.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {bookmark.prompt.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>{typeof bookmark.prompt.author === "string" ? bookmark.prompt.author : bookmark.prompt.author?.name || "Unknown"}</span>
                            <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/prompt/${bookmark.prompt.id}`}
                              className="flex-1 px-3 py-1.5 bg-primary text-white rounded hover:bg-orange-600 transition-colors text-center text-sm"
                            >
                              자세히 보기
                            </Link>
                            <button
                              onClick={async () => {
                                try {
                                  await removeBookmark(bookmark.prompt.id);
                                  setToastMessage("북마크가 삭제되었습니다.");
                                  setToastType("success");
                                  setShowToast(true);
                                } catch (error) {
                                  setToastMessage("북마크 삭제에 실패했습니다.");
                                  setToastType("error");
                                  setShowToast(true);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg">
                      <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">아직 북마크한 프롬프트가 없습니다</h3>
                      <p className="text-gray-600 mb-4">마음에 드는 프롬프트를 북마크해보세요!</p>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        프롬프트 탐색하기
                      </Link>
                    </div>
                  )}
                </div>

                {/* 카테고리 관리 모달 */}
                <BookmarkCategoryManager
                  isOpen={showCategoryManager}
                  onClose={() => setShowCategoryManager(false)}
                  onCategoryChange={() => {
                    // 북마크 목록과 카테고리 목록 새로고침
                    if (refetchBookmarks && typeof refetchBookmarks === "function") {
                      refetchBookmarks();
                    }
                    if (refetchBookmarkCategories && typeof refetchBookmarkCategories === "function") {
                      refetchBookmarkCategories();
                    }
                  }}
                />
              </div>
            )}

            {/* 프로필 수정 탭 */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">프로필 수정</h2>
                
                {/* 상단: 프로필 사진과 기본 정보 가로 배치 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* 왼쪽: 프로필 사진 업로드 섹션 */}
                  <div className="border-b pb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">프로필 사진</h4>
                    <div className="flex items-start gap-6">
                      <AvatarUpload
                        currentAvatarUrl={userProfile?.avatar_url || user?.avatar_url}
                        userName={user?.name || ''}
                        onAvatarChange={handleAvatarChange}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          프로필사진 업로드 기준
                        </p>
                        <div className="text-xs text-gray-500">
                          <p>• JPG, PNG 파일만 지원됩니다</p>
                          <p>• 최대 5MB까지 업로드 가능합니다</p>
                          <p>• 권장 크기: 200x200 픽셀 이상</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 이름과 이메일 섹션 */}
                  <div className="border-b pb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">기본 정보</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                        <input
                          type="text"
                          value={user.name}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={user.email}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                          <button
                            onClick={() => {
                              setToastMessage('이메일 인증 기능은 준비 중입니다.');
                              setToastType('info');
                              setShowToast(true);
                            }}
                            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
                          >
                            이메일 인증
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단: 비밀번호 변경 섹션 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 왼쪽: 비밀번호 변경 섹션 */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-4">보안 설정</h3>
                      
                      {/* 비밀번호 변경 섹션 */}
                      <div className="border-b pb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">비밀번호 변경</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                            <input
                              type="password"
                              id="currentPassword"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="현재 비밀번호를 입력하세요"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                            <input
                              type="password"
                              id="newPassword"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                            <input
                              type="password"
                              id="confirmPassword"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="새 비밀번호를 다시 입력하세요"
                            />
                          </div>
                          <button
                            onClick={handlePasswordChange}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            비밀번호 변경
                          </button>
                        </div>
                      </div>

                      {/* 계정 관리 섹션 */}
                      <div className="pt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">계정 관리</h4>
                        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                          <button
                            onClick={() => setShowDeleteAccountModal(true)}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            회원탈퇴
                          </button>
                          <p className="text-xs text-red-600">
                            계정을 삭제하면 개인 정보는 삭제되고 작성한 콘텐츠는 익명으로 유지됩니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 알림 설정 섹션 */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-4">알림 설정</h3>
                      
                      {/* 알림 설정 섹션 */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-4">알림 옵션</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className="text-sm text-gray-600">내 프롬프트에 좋아요를 받으면 알림</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className="text-sm text-gray-600">내 프롬프트에 댓글이 달리면 알림</span>
                          </label>
                          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                            알림 설정 저장
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">프롬프트 삭제</h3>
            <p className="text-gray-600 mb-6">
              이 프롬프트를 삭제하시겠습니까? 삭제된 프롬프트는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">회원탈퇴</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                계정을 삭제하면 다음과 같이 처리됩니다:
              </p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">삭제되는 데이터:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 개인 프로필 정보</li>
                    <li>• 북마크한 프롬프트 목록</li>
                    <li>• 북마크 카테고리</li>
                    <li>• 계정 로그인 정보</li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">유지되는 데이터 (익명화):</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 작성한 프롬프트 (작성자: "삭제된 사용자")</li>
                    <li>• 작성한 댓글 (작성자: "삭제된 사용자")</li>
                    <li>• 남긴 평점 (작성자: "삭제된 사용자")</li>
                  </ul>
                </div>
              </div>
              
              <p className="text-sm text-red-600 font-medium mt-4">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호를 입력하여 확인하세요
              </label>
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeletingAccount}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeletingAccount || !deleteAccountPassword.trim()}
              >
                {isDeletingAccount ? '삭제 중...' : '계정 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 알림 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default MyPage;