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
import ImageModal from '@/components/ImageModal';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

// 추가 이미지 컴포넌트
const AdditionalImageItem = ({ imageUrl, index, onImageClick }: { imageUrl: string; index: number; onImageClick: (imageUrl: string, alt: string) => void }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-1">🖼️</div>
          <p className="text-xs text-gray-500">이미지 로드 실패</p>
          <button
            onClick={() => setImageError(false)}
            className="mt-1 text-xs text-blue-500 hover:text-blue-700"
          >
            재시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
      onClick={() => onImageClick(imageUrl, `추가 이미지 ${index + 1}`)}
    >
      <Image
        src={imageUrl}
        alt={`추가 이미지 ${index + 1}`}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        unoptimized={true}
        onError={() => {
          console.error('[DEBUG] Additional image load error for:', imageUrl);
          setImageError(true);
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface AIModel {
  id: string;
  name: string;
  icon: string;
}

const aiModels: AIModel[] = [
  // 텍스트 생성 AI
  { id: 'chatgpt', name: 'ChatGPT', icon: '/image/icon_chatgpt.png' },
  { id: 'claude', name: 'Claude', icon: '/image/icon_claude.png' },
  { id: 'gemini', name: 'Gemini', icon: '/image/icon_gemini.png' },
  { id: 'perplexity', name: 'Perplexity', icon: '/image/icon_perplexity.png' },
  
  // 코딩 AI
  { id: 'copilot', name: 'GitHub Copilot', icon: '/image/icon_gpt-4_code.png' },
  { id: 'cursor', name: 'Cursor', icon: '/image/icon_cursor-ai.png' },
  { id: 'replit', name: 'Replit', icon: '/image/icon_Replit.png' },
  { id: 'v0', name: 'v0', icon: '/image/icon_v0.png' },
  
  // 이미지 생성 AI
  { id: 'dalle', name: 'DALL-E', icon: '/image/icon_dall_e_3.png' },
  { id: 'midjourney', name: 'Midjourney', icon: '/image/icon_midjourney.png' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', icon: '/image/icon_Stable_Diffusion.png' },
  { id: 'leonardo', name: 'Leonardo AI', icon: '/image/icon_leonardo_ai.png' },
  
  // 비디오 생성 AI
  { id: 'runway', name: 'Runway', icon: '/image/icon_runway.png' },
  { id: 'pika', name: 'Pika Labs', icon: '/image/icon_PikaLabs.png' },
  { id: 'kling', name: 'Kling', icon: '/image/icon_kling.png' },
  { id: 'sora', name: 'Sora', icon: '/image/icon_Sora.png' },
  
  // 기타 AI 도구
  { id: 'elevenlabs', name: 'ElevenLabs', icon: '/image/icon_ElevenLabs.png' },
  { id: 'jasper', name: 'Jasper', icon: '/image/icon_jasper.png' },
  { id: 'copy-ai', name: 'Copy.ai', icon: '/image/icon_Copy-ai.png' },
  { id: 'other', name: '기타', icon: '🔧' },
];

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
    avatar_url?: string;
  };
  createdAt: string;
  date: string;
  rating?: number;
  userRating?: number;
  isPublic?: boolean;
  previewImage?: string;
  additionalImages?: string[];
  videoUrl?: string;
}

// 동영상 미리보기 컴포넌트
const VideoPreview = ({ url }: { url: string }) => {
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // YouTube URL 처리
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Vimeo URL 처리
  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return getYouTubeEmbedUrl(url);
    } else if (url.includes('vimeo.com')) {
      return getVimeoEmbedUrl(url);
    }
    return null;
  };

  const embedUrl = getEmbedUrl(url);
  const thumbnailUrl = getVideoThumbnail(url);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  if (videoError) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gray-400 mb-2">🎥</div>
          <p className="text-sm text-gray-500 mb-2">동영상을 불러올 수 없습니다</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            원본 링크로 이동
          </a>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gray-400 mb-2">🎥</div>
          <p className="text-sm text-gray-500 mb-2">지원되지 않는 동영상 형식입니다</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            원본 링크로 이동
          </a>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title="동영상 미리보기"
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => setVideoError(true)}
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group" onClick={handlePlay}>
      {thumbnailUrl ? (
        <>
          <Image
            src={thumbnailUrl}
            alt={getVideoTitle(url)}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized={true}
            onError={() => setVideoError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200">
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded">
              {getVideoTitle(url)}
            </p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-600">클릭하여 동영상 재생</p>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

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
      setImageError(false); // 이미지 에러 상태 초기화
    } catch (error: any) {
      setToastMessage(error.message);
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPrompt();
    }
  }, [id, fetchPrompt]);

  // 북마크 상태 업데이트
  useEffect(() => {
    if (prompt && bookmarks) {
      console.log('[DEBUG] Checking bookmark state for prompt:', prompt.id);
      console.log('[DEBUG] Current bookmarks:', bookmarks.map(b => ({ 
        bookmarkId: b.id, 
        promptId: b.prompt.id, 
        categoryId: b.categoryId 
      })));
      
      const isBookmarked = bookmarks.some(bookmark => bookmark.prompt.id === prompt.id);
      setLocalBookmarkState(isBookmarked);
      console.log('[DEBUG] Bookmark state updated:', { promptId: prompt.id, isBookmarked });
    }
  }, [prompt, bookmarks]);

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
        setLocalBookmarkState(false); // 즉시 로컬 상태 업데이트
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
    } catch (error: any) {
      console.error('[DEBUG] Bookmark toggle error:', error);
      setToastMessage(error.message || '북마크 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCategorySelect = async (categoryId: string | null) => {
    try {
      console.log('[DEBUG] Adding bookmark with category ID:', categoryId);
      console.log('[DEBUG] Prompt ID:', prompt.id, 'type:', typeof prompt.id);
      
      await addBookmark(prompt.id, categoryId);
      
      console.log('[DEBUG] Bookmark added successfully, updating local state');
      setToastMessage('북마크에 추가되었습니다!');
      setToastType('success');
      setShowToast(true);
      setLocalBookmarkState(true);
      
      // 북마크 목록 새로고침을 위해 잠시 후 상태 확인
      setTimeout(() => {
        console.log('[DEBUG] Checking bookmarks after add:', bookmarks);
      }, 1000);
    } catch (error: any) {
      console.error('[DEBUG] Add bookmark with category error:', error);
      setToastMessage(error.message || '북마크 추가 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(alt);
    setShowImageModal(true);
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setToastMessage('프롬프트 내용이 클립보드에 복사되었습니다!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('복사 실패:', error);
      setToastMessage('복사에 실패했습니다. 다시 시도해주세요.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
                  <div className="flex items-center gap-2">
                    {prompt.author.avatar_url ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={prompt.author.avatar_url}
                          alt={prompt.author.name}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <Image
                          src="/logo.png"
                          alt="프롬팟 로고"
                          width={24}
                          height={24}
                          className="w-full h-full object-contain"
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <span>{prompt.author.name}</span>
                  </div>
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
              {/* 미리보기 */}
              {prompt.previewImage && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">미리보기</h3>
                  <div 
                    className="relative w-full aspect-video bg-white rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleImageClick(prompt.previewImage!, prompt.title)}
                  >
                    {!imageError ? (
                      <>
                        <Image
                          src={prompt.previewImage}
                          alt={prompt.title}
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                          priority
                          unoptimized={true}
                          onError={() => {
                            console.error('[DEBUG] Image load error for:', prompt.previewImage);
                            setImageError(true);
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl text-gray-400 mb-2">🖼️</div>
                          <p className="text-sm text-gray-500">이미지를 불러올 수 없습니다</p>
                          <button
                            onClick={() => setImageError(false)}
                            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                          >
                            다시 시도
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 추가 이미지 */}
              {prompt.additionalImages && prompt.additionalImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">추가 이미지</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {prompt.additionalImages.map((imageUrl, index) => (
                      <AdditionalImageItem key={index} imageUrl={imageUrl} index={index} onImageClick={handleImageClick} />
                    ))}
                  </div>
                </div>
              )}

              {/* 동영상 */}
              {prompt.videoUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">동영상</h3>
                  <div className="relative w-full max-w-2xl mx-auto">
                    <VideoPreview url={prompt.videoUrl} />
                  </div>
                </div>
              )}

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

                {/* 프롬프트 내용 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">프롬프트 내용</h3>
                    <button
                      onClick={handleCopyContent}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="프롬프트 내용 복사"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap border border-gray-200">
                    {prompt.content}
                  </div>
                </div>

                {/* 카테고리, AI 모델, 공개 설정 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 카테고리 */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">카테고리</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {prompt.category === 'work' && '💼'}
                        {prompt.category === 'dev' && '💻'}
                        {prompt.category === 'design' && '🎨'}
                        {prompt.category === 'edu' && '📚'}
                        {prompt.category === 'image' && '🖼️'}
                      </span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-full text-sm font-medium shadow-sm">
                        {prompt.category === 'work' && '업무/마케팅'}
                        {prompt.category === 'dev' && '개발/코드'}
                        {prompt.category === 'design' && '디자인/브랜드'}
                        {prompt.category === 'edu' && '교육/학습'}
                        {prompt.category === 'image' && '이미지/아트'}
                      </span>
                    </div>
                  </div>
                  
                  {/* AI 모델 */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">AI 모델</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex-shrink-0">
                        {(() => {
                          const modelId = typeof prompt.aiModel === 'string' ? prompt.aiModel : prompt.aiModel?.id;
                          const model = aiModels.find(m => m.id === modelId);
                          if (model?.icon === '🔧') {
                            return <div className="text-2xl">{model.icon}</div>;
                          } else if (model?.icon) {
                            return (
                              <img 
                                src={model.icon} 
                                alt={model.name}
                                className="w-full h-full object-contain"
                              />
                            );
                          } else {
                            return <div className="text-2xl">🤖</div>;
                          }
                        })()}
                      </div>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-full text-sm font-medium shadow-sm">
                        {(() => {
                          const modelId = typeof prompt.aiModel === 'string' ? prompt.aiModel : prompt.aiModel?.id;
                          const model = aiModels.find(m => m.id === modelId);
                          return model?.name || (typeof prompt.aiModel === 'string' ? prompt.aiModel : prompt.aiModel?.name) || '기타';
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* 공개 설정 */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">공개 설정</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {prompt.isPublic ? '🌍' : '🔒'}
                      </span>
                      <span className={`px-3 py-2 rounded-full text-sm font-medium shadow-sm ${
                        prompt.isPublic 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prompt.isPublic ? '공개' : '비공개'}
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

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={modalImageUrl}
        alt={modalImageAlt}
      />
    </div>
  );
};

export default PromptDetailPage;
