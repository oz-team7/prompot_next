import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import RatingSystem from '@/components/RatingSystem';
import CommentSection from '@/components/CommentSection';
import SharePrompt from '@/components/SharePrompt';
import BookmarkCategorySelector from '@/components/BookmarkCategorySelector';

interface AIModel {
  id: string;
  name: string;
  icon: string;
}

interface PromptDetail {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  aiModel: AIModel | string;
  tags?: string[];
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  date: string;
  rating?: number;
  userRating?: number;
  isPublic?: boolean;
  previewImage?: string;
  additionalImages?: string[];
}

const PromptDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();

  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [localBookmarkState, setLocalBookmarkState] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [imageError, setImageError] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const fetchPrompt = useCallback(async () => {
    try {
      const res = await fetch(`/api/prompts/${id}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || '프롬프트를 불러올 수 없습니다.');
      }
      
      setPrompt(data.prompt);
      console.log('[DEBUG] Fetched prompt data:', {
        id: data.prompt.id,
        title: data.prompt.title,
        previewImage: data.prompt.previewImage,
        hasPreviewImage: !!data.prompt.previewImage,
        additionalImages: data.prompt.additionalImages,
        hasAdditionalImages: !!(data.prompt.additionalImages && data.prompt.additionalImages.length > 0)
      });
      setLocalBookmarkState(bookmarks.some(bookmark => bookmark.prompt.id === data.prompt.id));
      setImageError(false); // 이미지 에러 상태 초기화
    } catch (error: any) {
      setToastMessage(error.message);
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [id, bookmarks]);

  useEffect(() => {
    if (id) {
      fetchPrompt();
    }
  }, [id, fetchPrompt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">프롬프트를 찾을 수 없습니다</h2>
            <Link href="/" className="text-primary hover:underline">홈으로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  const isBookmarked = localBookmarkState;
  const isAuthor = user?.id === prompt.author?.id;

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    console.log('[DEBUG] Bookmark toggle - prompt ID:', prompt.id, 'type:', typeof prompt.id);
    console.log('[DEBUG] Bookmark toggle - isBookmarked:', isBookmarked);
    console.log('[DEBUG] Bookmark toggle - current bookmarks:', bookmarks);

    try {
      if (isBookmarked) {
        console.log('[DEBUG] Removing bookmark for prompt ID:', prompt.id);
        await removeBookmark(prompt.id);
        setToastMessage('북마크가 제거되었습니다.');
      } else {
        console.log('[DEBUG] Adding bookmark for prompt ID:', prompt.id);
        console.log('[DEBUG] Prompt ID type:', typeof prompt.id);
        console.log('[DEBUG] Prompt ID value:', prompt.id);
        
        // 북마크 추가 시 카테고리 선택 모달 표시
        setShowCategorySelector(true);
        return;
      }
      setToastType('success');
      setShowToast(true);
      setLocalBookmarkState(!isBookmarked);
    } catch (error: any) {
      console.error('[DEBUG] Bookmark toggle error:', error);
      setToastMessage(error.message || '북마크 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCategorySelect = async (categoryId: number | null) => {
    try {
      console.log('[DEBUG] Adding bookmark with category ID:', categoryId);
      await addBookmark(prompt.id, categoryId);
      setToastMessage('북마크에 추가되었습니다!');
      setToastType('success');
      setShowToast(true);
      setLocalBookmarkState(true);
    } catch (error: any) {
      console.error('[DEBUG] Add bookmark with category error:', error);
      setToastMessage(error.message || '북마크 추가 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('프롬프트 삭제에 실패했습니다.');
      }

      setToastMessage('프롬프트가 삭제되었습니다.');
      setToastType('success');
      setShowToast(true);
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.message);
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            {/* Content header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{prompt.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{prompt.author.name}</span>
                  <span>•</span>
                  <time dateTime={prompt.createdAt}>{prompt.date}</time>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isAuthor && (
                  <>
                    <button
                      onClick={() => router.push(`/prompt/edit/${prompt.id}`)}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
                
                {isAuthenticated && (
                  <button
                    onClick={handleBookmarkToggle}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1
                      ${isBookmarked 
                        ? 'bg-orange-100 text-primary border border-orange-200 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {isBookmarked ? '북마크됨' : '북마크'}
                  </button>
                )}
              </div>
            </div>

            {/* Prompt content */}
            <div className={`mt-6 ${!isAuthenticated ? 'blur-md pointer-events-none' : ''}`}>
              {/* 프롬프트 정보 섹션 */}
              <div className="mb-6 space-y-4">
                {/* 설명 */}
                {prompt.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">설명</h3>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      {prompt.description}
                    </p>
                  </div>
                )}

                {/* 카테고리와 AI 모델 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">카테고리</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {prompt.category === 'work' && '💼'}
                        {prompt.category === 'dev' && '💻'}
                        {prompt.category === 'design' && '🎨'}
                        {prompt.category === 'edu' && '📚'}
                        {prompt.category === 'image' && '🖼️'}
                      </span>
                      <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {prompt.category === 'work' && '업무/마케팅'}
                        {prompt.category === 'dev' && '개발/코드'}
                        {prompt.category === 'design' && '디자인/브랜드'}
                        {prompt.category === 'edu' && '교육/학습'}
                        {prompt.category === 'image' && '이미지/아트'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI 모델</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {prompt.aiModel === 'chatgpt' && '🤖'}
                        {prompt.aiModel === 'claude' && '🧠'}
                        {prompt.aiModel === 'gemini' && '💎'}
                        {prompt.aiModel === 'dalle' && '🖼️'}
                        {prompt.aiModel === 'midjourney' && '🎨'}
                        {prompt.aiModel === 'copilot' && '👨‍💻'}
                        {prompt.aiModel === 'other' && '🔧'}
                      </span>
                      <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {prompt.aiModel === 'chatgpt' && 'ChatGPT'}
                        {prompt.aiModel === 'claude' && 'Claude'}
                        {prompt.aiModel === 'gemini' && 'Gemini'}
                        {prompt.aiModel === 'dalle' && 'DALL-E'}
                        {prompt.aiModel === 'midjourney' && 'Midjourney'}
                        {prompt.aiModel === 'copilot' && 'GitHub Copilot'}
                        {prompt.aiModel === 'other' && '기타'}
                        {prompt.aiModel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 태그 */}
                {prompt.tags && prompt.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">태그</h3>
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 공개 설정 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">공개 설정</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prompt.isPublic 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {prompt.isPublic ? '🌐 공개' : '🔒 비공개'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Image */}
              {prompt.previewImage && !imageError && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">미리보기</h3>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={prompt.previewImage}
                      alt={prompt.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                      priority
                      onError={() => {
                        console.error('[DEBUG] Image load error for:', prompt.previewImage);
                        setImageError(true);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Additional Images */}
              {prompt.additionalImages && prompt.additionalImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">추가 이미지</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {prompt.additionalImages.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={`추가 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          onError={() => {
                            console.error('[DEBUG] Additional image load error for:', imageUrl);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap border border-gray-200">
                {prompt.content}
              </div>

              <div className="mt-4">
                <SharePrompt promptId={prompt.id} title={prompt.title} />
              </div>
              
              {!isAuthenticated && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                  <div className="text-center">
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

            {/* Rating */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">평가하기</h3>
              <RatingSystem 
                promptId={prompt.id}
                onRatingChange={(success, message) => {
                  setToastMessage(message);
                  setToastType(success ? 'success' : 'error');
                  setShowToast(true);
                }}
              />
            </div>

            {/* Comments */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">댓글</h3>
              <CommentSection promptId={prompt.id} />
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Login modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">로그인</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Link
              href="/login"
              className="block w-full py-2 px-4 bg-primary text-white text-center rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-red-600">프롬프트 삭제</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 mb-4">이 프롬프트를 삭제하시겠습니까?</p>
            <p className="text-sm text-red-600 mb-6">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmark Category Selector */}
      <BookmarkCategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
      />
    </div>
  );
};

export default PromptDetailPage;
