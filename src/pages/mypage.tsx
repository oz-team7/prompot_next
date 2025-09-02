import React, { useState, useEffect } from 'react';
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

const MyPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'prompts' | 'bookmarks' | 'settings'>('prompts');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { prompts: allPrompts, loading, error, refetch } = usePrompts({ author: true });
  const { bookmarks, loading: bookmarksLoading, error: bookmarksError, removeBookmark, refetch: refetchBookmarks } = useBookmarks();
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [userProfile, setUserProfile] = useState<any>(null);

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

  useEffect(() => {
    // 사용자의 프롬프트만 필터링
    if (allPrompts.length > 0) {
      setMyPrompts(allPrompts.filter(p => p.authorId === user?.id));
    }
  }, [allPrompts, user]);

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

  const tabs = [
    { id: 'prompts', label: '내 프롬프트', count: myPrompts.length },
    { id: 'bookmarks', label: '북마크', count: bookmarks.length },
    { id: 'settings', label: '설정', count: null },
  ];

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 text-sm text-gray-500">({tab.count})</span>
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
                        {prompt.previewImage && (
                          <div className="relative w-full h-40 mb-3">
                            <Image
                              src={prompt.previewImage}
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">작성한 프롬프트가 없습니다</h3>
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
            {activeTab === 'bookmarks' && (
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
                    {bookmarks.map(bookmark => (
                      <div key={bookmark.id} className="bg-white rounded-lg shadow-sm p-4">
                        {bookmark.prompt.previewImage && (
                          <div className="relative w-full h-40 mb-3">
                            <Image
                              src={bookmark.prompt.previewImage}
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
                          <span>{bookmark.prompt.author}</span>
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
                                await removeBookmark(bookmark.id);
                                setToastMessage('북마크가 삭제되었습니다.');
                                setToastType('success');
                                setShowToast(true);
                              } catch (error) {
                                setToastMessage('북마크 삭제에 실패했습니다.');
                                setToastType('error');
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
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">북마크한 프롬프트가 없습니다</h3>
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
            )}

            {/* 설정 탭 */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">계정 설정</h2>
                <div className="space-y-6">
                  {/* 프로필 사진 업로드 섹션 */}
                  <div className="border-b pb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">프로필 사진</h3>
                    <div className="flex items-start gap-6">
                      <AvatarUpload
                        currentAvatarUrl={userProfile?.avatar_url || user?.avatar_url}
                        userName={user?.name || ''}
                        onAvatarChange={handleAvatarChange}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          프로필 사진을 업로드하여 개인화된 경험을 제공받으세요.
                        </p>
                        <div className="text-xs text-gray-500">
                          <p>• JPG, PNG 파일만 지원됩니다</p>
                          <p>• 최대 5MB까지 업로드 가능합니다</p>
                          <p>• 권장 크기: 200x200 픽셀 이상</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 기본 정보 섹션 */}
                  <div className="border-b pb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">기본 정보</h3>
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
                        <input
                          type="email"
                          value={user.email}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* 비밀번호 변경 섹션 */}
                  <div className="border-b pb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">비밀번호 변경</h3>
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

                  {/* 알림 설정 섹션 */}
                  <div className="border-b pb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">알림 설정</h3>
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

                  {/* 계정 관리 섹션 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">계정 관리</h3>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        계정 삭제
                      </button>
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