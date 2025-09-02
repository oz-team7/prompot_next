import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import RatingSystem from '@/components/RatingSystem';
import CommentSection from '@/components/CommentSection';
import { Prompt } from '@/types/prompt';

const PromptDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPrompt();
    }
  }, [id]);

  const fetchPrompt = async () => {
    try {
      console.log('Fetching prompt with ID:', id);
      const res = await fetch(`/api/prompts/${id}`, {
        credentials: 'include', // 인증 쿠키 포함
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) {
        throw new Error(data.message || '프롬프트를 불러올 수 없습니다.');
      }
      
      setPrompt(data.prompt);
    } catch (error: any) {
      console.error('Fetch prompt error:', error);
      setToastMessage(error.message || '프롬프트를 불러올 수 없습니다.');
      setToastType('error');
      setShowToast(true);
      if (error.message === '로그인이 필요합니다.') {
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">프롬프트를 불러오는 중...</p>
          </div>
        </div>
      </>
    );
  }

  // 북마크 상태 확인
  const isBookmarked = bookmarks.some(bookmark => bookmark.prompt.id === prompt?.id);

  // 북마크 토글 함수
  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!prompt) return;

    try {
      if (isBookmarked) {
        const bookmark = bookmarks.find(b => b.prompt.id === prompt.id);
        if (bookmark) {
          await removeBookmark(bookmark.id);
          setToastMessage('북마크가 제거되었습니다.');
          setToastType('success');
        }
      } else {
        await addBookmark(prompt.id);
        setToastMessage('북마크에 추가되었습니다!');
        setToastType('success');
      }
      setShowToast(true);
    } catch (error) {
      console.error('Bookmark toggle error:', error);
      setToastMessage('북마크 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (!prompt) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">프롬프트를 찾을 수 없습니다.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 pt-2 pb-2 max-w-4xl">
          {/* 프롬프트 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-xl font-bold mb-1">{prompt.title}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>{prompt.author}</span>
                  <span>•</span>
                  <span>{prompt.date}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-semibold">{prompt.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 태그 및 AI 모델 */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* AI 모델 태그 */}
              {prompt.aiModel && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  {typeof prompt.aiModel === 'object' && prompt.aiModel.icon && (
                    <Image
                      src={prompt.aiModel.icon}
                      alt={typeof prompt.aiModel === 'object' ? prompt.aiModel.name : prompt.aiModel}
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  )}
                  <span className="font-medium">
                    {typeof prompt.aiModel === 'object' ? prompt.aiModel.name : prompt.aiModel}
                  </span>
                </div>
              )}
              
              {/* 일반 태그 */}
              {prompt.tags && prompt.tags.length > 0 && prompt.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 설명 */}
            <p className="text-sm text-gray-700 line-clamp-2">{prompt.description}</p>

            {/* 별점 시스템 */}
            <div className="mt-4">
              <RatingSystem promptId={prompt.id.toString()} onRatingChange={(success, message) => { setToastMessage(message); setToastType(success ? "success" : "error"); setShowToast(true); }} />
            </div>

            {/* 구분선 */}
            <hr className="my-6 border-gray-200" />

            {/* 댓글 섹션 */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">댓글</h2>
              <CommentSection promptId={prompt.id.toString()} />
            </div>
          </div>

          {/* 미리보기 이미지 */}
          {prompt.previewImage && (
            <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
              <h2 className="text-base font-semibold mb-2">미리보기</h2>
              <div className="relative w-full aspect-video">
                <Image
                  src={prompt.previewImage}
                  alt={prompt.title}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 프롬프트 내용 - 블러 처리 */}
          <div className="relative">
            <div className={`bg-white rounded-lg shadow-sm p-3 ${!isAuthenticated ? 'select-none' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold">프롬프트 내용</h2>
                {isAuthenticated && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(prompt.content || '프롬프트 내용');
                        setToastMessage('프롬프트가 클립보드에 복사되었습니다!');
                        setToastType('success');
                        setShowToast(true);
                      }}
                      className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                      title="복사하기"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleBookmarkToggle}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked 
                          ? 'text-primary bg-orange-50 hover:bg-orange-100' 
                          : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                      }`}
                      title={isBookmarked ? '북마크 제거' : '북마크 추가'}
                    >
                      <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className={`${!isAuthenticated ? 'blur-md pointer-events-none' : ''}`}>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm whitespace-pre-wrap">
                  {prompt.content || `이 프롬프트는 ${prompt.category === 'work' ? '업무/마케팅' : prompt.category === 'dev' ? '개발/코드' : prompt.category === 'design' ? '디자인/브랜드' : prompt.category === 'edu' ? '교육/학습' : '이미지/아트'} 분야의 프롬프트입니다.

[프롬프트 내용이 여기에 표시됩니다]

이 프롬프트를 사용하여 더 나은 결과를 얻어보세요!`}
                </div>
              </div>
            </div>

            {/* 로그인 오버레이 */}
            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">로그인이 필요합니다</h3>
                  <p className="text-gray-600 mb-4">프롬프트 내용을 보려면 로그인하세요</p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    로그인하기
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Toast 알림 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">로그인</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                로그인
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">계정이 없으신가요? </span>
              <Link href="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromptDetailPage;