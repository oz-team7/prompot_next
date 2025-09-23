import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLike } from '@/hooks/useLike';
import { useSearch } from '@/contexts/SearchContext';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import CommentSection from '@/components/CommentSection';
import SharePrompt from '@/components/SharePrompt';
import BookmarkCategorySelector from '@/components/BookmarkCategorySelector';
import ImageModal from '@/components/ImageModal';
import FloatingHearts from '@/components/FloatingHearts';
import { mutate as swrMutate } from 'swr';
import { getVideoTitle, getVideoThumbnail, getFallbackThumbnail } from '@/utils/videoUtils';
import { createTextImage } from '@/utils/textToImage';

// 추가 이미지 컴포넌트
const AdditionalImageItem = ({ imageUrl, index, onImageClick }: { imageUrl: string; index: number; onImageClick: (imageUrl: string, alt: string) => void }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-1">🎬</div>
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
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-0 transition-all duration-200 flex items-center justify-center">
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
  isPublic?: boolean;
  previewImage?: string;
  additionalImages?: string[];
  videoUrl?: string;
  video_url?: string;
  views?: number;
  likes?: number;
  likes_count?: number;
  comments?: any[];
  commentCount?: number;
  resultType?: 'image' | 'text';
  textResult?: string;
}

// 동영상 미리보기 컴포넌트
const VideoPreview = ({ url }: { url: string }) => {
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  // YouTube URL 처리 (일반 동영상 및 숏츠 지원)
  const getYouTubeEmbedUrl = (url: string) => {
    // 일반 YouTube URL 패턴
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    // YouTube Shorts URL 패턴
    const shortsRegExp = /^.*(youtube\.com\/shorts\/|youtu\.be\/)([^#&?]*).*/;
    const shortsMatch = url.match(shortsRegExp);
    
    if (shortsMatch && shortsMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${shortsMatch[2]}`;
    }
    
    return null;
  };

  // Vimeo URL 처리
  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube.com/shorts')) {
      return getYouTubeEmbedUrl(url);
    } else if (url.includes('vimeo.com')) {
      return getVimeoEmbedUrl(url);
    }
    return null;
  };

  // 직접 동영상 파일 URL인지 확인
  const isDirectVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    // 확장자로 확인
    const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    
    // MIME 타입으로 확인 (URL에 포함된 경우)
    const hasVideoMimeType = videoMimeTypes.some(mime => url.toLowerCase().includes(mime));
    
    // 일반적인 동영상 호스팅 서비스 확인
    const videoHostingServices = [
      'videos.openai.com',
      'cdn.openai.com',
      'storage.googleapis.com',
      's3.amazonaws.com',
      'blob:',
      'data:video/'
    ];
    
    const isVideoHosting = videoHostingServices.some(service => url.includes(service));
    
    return hasVideoExtension || hasVideoMimeType || isVideoHosting;
  };

  const embedUrl = getEmbedUrl(url);
  const thumbnailUrl = getVideoThumbnail(url);
  const fallbackThumbnailUrl = getFallbackThumbnail(url);

  // 동영상 로드 실패 시 썸네일로 전환
  const handleVideoError = () => {
    setVideoError(true);
    setIsLoading(false);
    if (thumbnailUrl) {
      setShowThumbnail(true);
    }
  };

  // 썸네일 클릭 시 동영상 재생
  const handleThumbnailClick = () => {
    if (embedUrl) {
      setShowThumbnail(false);
      setVideoError(false);
      setIsLoading(true);
    }
  };

  // 썸네일 표시 (동영상 로드 실패 시 또는 embed URL이 없을 때)
  if (showThumbnail || (!embedUrl && !isDirectVideoUrl(url) && thumbnailUrl)) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group" onClick={handleThumbnailClick}>
        {thumbnailUrl && !thumbnailError ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={getVideoTitle(url) || '동영상 썸네일'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized={true}
              onError={() => {
                if (fallbackThumbnailUrl) {
                  setThumbnailError(false);
                } else {
                  setThumbnailError(true);
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all">
              <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            {getVideoTitle(url) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-medium truncate">{getVideoTitle(url)}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-2">🎥</div>
              <p className="text-sm text-gray-600 mb-2">동영상 미리보기</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-700 underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                동영상 보기
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 직접 동영상 파일 표시
  if (isDirectVideoUrl(url) && !videoError) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <video
          src={url}
          controls
          className="w-full h-full object-contain bg-black"
          onLoadedData={() => setIsLoading(false)}
          onError={handleVideoError}
          preload="metadata"
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
          <source src={url} type="video/ogg" />
          브라우저가 동영상을 지원하지 않습니다.
        </video>
      </div>
    );
  }

  // 동영상 iframe 표시 (YouTube, Vimeo 등)
  if (embedUrl && !videoError) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <iframe
          src={embedUrl}
          title="동영상 미리보기"
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={handleVideoError}
        />
      </div>
    );
  }

  // 최종 fallback
  return (
    <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-3">
      <div className="text-2xl">🎥</div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">동영상을 불러올 수 없습니다</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:text-blue-700 underline inline-flex items-center gap-1"
        >
          동영상 보기
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

const PromptDetailPage = () => {
  const router = useRouter();
  const rawId = router.query.id;
  const promptId = typeof rawId === 'string' ? rawId : rawId?.[0];
  const { setAuthorFilter, setSearchQuery } = useSearch();
  const { isAuthenticated, user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();

  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'bookmark'>('success');
  const [imageError, setImageError] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState<'spam' | 'offensive' | 'illegal' | 'other'>('other');
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isTextResultExpanded, setIsTextResultExpanded] = useState(false);
  const [textImageUrl, setTextImageUrl] = useState<string>('');
  
  // useLike 훅 사용
  const { isLiked, likesCount, toggle: toggleLike, isBusy: isLikeBusy } = useLike(promptId || '');

  const fetchPrompt = useCallback(async () => {
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || '프롬프트를 불러올 수 없습니다.');
      }
      
      setPrompt(data.prompt);
      // SWR 캐시에 초기 데이터 설정
      swrMutate(['like', String(promptId)], {
        isLiked: Boolean(data.prompt.is_liked || false),
        likesCount: Number(data.prompt.likes_count || data.prompt.likes || 0)
      }, false);
      setCommentCount(data.prompt.comment_count || data.prompt.comments?.length || 0);
      // console.log('[DEBUG] Fetched prompt data:', {
      //   id: data.prompt.id,
      //   title: data.prompt.title,
      //   previewImage: data.prompt.previewImage,
      //   hasPreviewImage: !!data.prompt.previewImage,
      //   additionalImages: data.prompt.additionalImages,
      //   hasAdditionalImages: !!(data.prompt.additionalImages && data.prompt.additionalImages.length > 0)
      // });
      setImageError(false); // 이미지 에러 상태 초기화
    } catch (error: any) {
      setToastMessage(error.message);
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  // 조회수 증가 함수
  const incrementViews = useCallback(async () => {
    try {
      await fetch(`/api/prompts/${promptId}/views`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }, [promptId]);

  // 좋아요 토글 함수
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    const prevLiked = isLiked;
    
    try {
      await toggleLike();
      
      // 좋아요를 눌렀을 때만 애니메이션 표시
      if (!prevLiked) {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 100); // 트리거 리셋
      }
      
      setToastMessage(!prevLiked ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating like:', error);
      setToastMessage('좋아요 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (promptId) {
      fetchPrompt();
      // 페이지 방문 시 조회수 증가
      incrementViews();
    }
  }, [promptId, fetchPrompt, incrementViews]);

  // 텍스트 결과를 이미지로 변환
  useEffect(() => {
    if (prompt?.resultType === 'text' && prompt?.textResult) {
      const generateTextImage = async () => {
        try {
          const imageUrl = await createTextImage(prompt.textResult);
          setTextImageUrl(imageUrl);
        } catch (error) {
          console.error('텍스트 이미지 생성 오류:', error);
        }
      };
      generateTextImage();
    } else {
      setTextImageUrl('');
    }
  }, [prompt?.textResult, prompt?.resultType]);


  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/20">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-orange-50/20">
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

  const isBookmarked = bookmarks.some(bookmark => 
    bookmark && bookmark.prompt && String(bookmark.prompt.id) === String(prompt?.id)
  );
  const isAuthor = user?.id === prompt?.author?.id;
  const isAdmin = user?.email === 'prompot7@gmail.com';

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
        await removeBookmark(prompt.id);
        setToastMessage('북마크가 제거되었습니다.');
        setToastType('bookmark');
        setShowToast(true);
      } else {
        // 북마크 추가 시 카테고리 선택 모달 표시
        setShowCategorySelector(true);
        return;
      }
    } catch (error: any) {
      console.error('[DEBUG] Bookmark toggle error:', error);
      setToastMessage(error.message || '북마크 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = () => {
    if (!prompt) return;
    const categoryLabel = getCategoryLabel(prompt.category);
    setSearchQuery(categoryLabel);
    router.push('/prompts');
  };

  // AI 모델 클릭 핸들러
  const handleAIModelClick = () => {
    if (!prompt) return;
    const aiModelName = typeof prompt.aiModel === 'object' ? prompt.aiModel.name : prompt.aiModel;
    setSearchQuery(aiModelName);
    router.push('/prompts');
  };

  // 태그 클릭 핸들러
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    router.push('/prompts');
  };

  // 카테고리 라벨 가져오기
  const getCategoryLabel = (category: string) => {
    const categoryLabels: { [key: string]: string } = {
      'work': '업무/마케팅',
      'dev': '개발/코드',
      'design': '디자인/브랜드',
      'edu': '교육/학습',
      'image': '이미지/동영상',
    };
    return categoryLabels[category] || category;
  };

  const handleCategorySelect = async (categoryIds: (string | null)[]) => {
    try {
      // 다중 카테고리 선택 시 첫 번째 카테고리만 사용 (기존 API 호환성 유지)
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
      
      // 실제 프롬프트 데이터를 전달하여 더 정확한 낙관적 업데이트
      await addBookmark(prompt.id, primaryCategoryId, prompt);
      
      setToastMessage('북마크에 추가되었습니다!');
      setToastType('bookmark');
      setShowToast(true);
      
      setShowCategorySelector(false);
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

  const handleReport = async () => {
    if (!reportReason.trim()) {
      setToastMessage('신고 사유를 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: 'prompt',
          contentId: prompt.id,
          category: reportCategory,
          reason: reportReason,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '신고 처리에 실패했습니다.');
      }

      setToastMessage('신고가 접수되었습니다.');
      setToastType('success');
      setShowToast(true);
      setShowReportModal(false);
      setReportReason('');
      setReportCategory('other');
    } catch (error: any) {
      setToastMessage(error.message);
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleAdminDelete = async () => {
    if (!confirm('정말로 이 프롬프트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '프롬프트 삭제에 실패했습니다.');
      }

      setToastMessage('프롬프트가 삭제되었습니다.');
      setToastType('success');
      setShowToast(true);
      
      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setToastMessage(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/20">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 px-6 pt-5 pb-6 relative">
            {/* Content header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-3 text-gray-900">{prompt.title}</h1>
                
                {/* 작성자 정보 */}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <button
                    onClick={() => {
                      const authorName = prompt.author?.name || '익명';
                      setAuthorFilter(authorName);
                      router.push('/');
                    }}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-orange-100 hover:bg-opacity-50 transition-all duration-200 group"
                  >
                    {prompt.author.avatar_url ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex-shrink-0">
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
                    <span className="font-medium group-hover:text-orange-600 transition-colors">{prompt.author.name}</span>
                  </button>
                  <span className="text-gray-400">•</span>
                  <time dateTime={prompt.createdAt} className="text-gray-500">{prompt.date}</time>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  {isAuthor && (
                    <>
                      <button
                        onClick={() => router.push(`/prompt/edit/${prompt.id}`)}
                        className="px-3 py-2 text-sm bg-white text-orange-600 border border-orange-500 rounded-lg hover:bg-orange-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
                        title="수정"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-3 py-2 text-sm bg-white text-red-600 border border-red-500 rounded-lg hover:bg-red-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={handleBookmarkToggle}
                        className={`w-10 h-10 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center
                          ${isBookmarked 
                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                            : 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-500'
                          }`}
                        title={isBookmarked ? '북마크 해제' : '북마크'}
                      >
                        <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      
                      {!isAuthor && (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
                          title="신고하기"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l8.5 15h-17l8.5-15z" />
                            <line x1="12" y1="10" x2="12" y2="13" strokeLinecap="round" />
                            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                          </svg>
                        </button>
                      )}
                      
                      {isAdmin && !isAuthor && (
                        <>
                          <button
                            onClick={() => router.push(`/prompt/edit/${prompt.id}`)}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            title="수정 (관리자)"
                          >
                            수정
                          </button>
                          <button
                            onClick={handleAdminDelete}
                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                            title="삭제 (관리자)"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                {/* 통계 정보 - 수정/삭제 버튼 하단 */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {/* 조회수 */}
                  <div className="flex items-center gap-1.5">
                    <svg 
                      className="w-4 h-4" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={2}
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>{prompt.views || 0}</span>
                  </div>
                  
                  {/* 좋아요 */}
                  <div className="relative">
                    <button
                      onClick={handleLikeToggle}
                      disabled={isLikeBusy}
                      className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`}
                        viewBox="0 0 24 24"
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      <span className={isLiked ? 'text-red-500' : ''}>{likesCount}</span>
                    </button>
                    <FloatingHearts trigger={showHeartAnimation} />
                  </div>
                  
                  {/* 댓글 */}
                  <div className="flex items-center gap-1.5">
                    <svg 
                      className="w-4 h-4" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={2}
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span>{commentCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt content */}
            <div className="mt-6">
              {/* 동영상 (우선 표시) */}
              {(prompt.videoUrl || prompt.video_url) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">동영상</h3>
                  <div className="relative w-full max-w-2xl mx-auto">
                    <VideoPreview url={prompt.videoUrl || prompt.video_url} />
                  </div>
                </div>
              )}

              {/* 미리보기 이미지 */}
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
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-0 transition-all duration-200 flex items-center justify-center">
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
                          <div className="text-4xl text-gray-400 mb-2">🎬</div>
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

              {/* 프롬프트 정보 섹션 */}
              <div className="mb-6 space-y-4">
                {/* 설명 */}
                {prompt.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      설명
                    </h3>
                    <div className="w-full p-3 border rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{prompt.description}</p>
                    </div>
                  </div>
                )}

                {/* 프롬프트 내용 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      프롬프트 내용
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyContent}
                        className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                        title="프롬프트 내용 복사"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className={`w-full p-3 border rounded-lg whitespace-pre-wrap ${!isAuthenticated ? 'blur-sm select-none' : ''}`}>
                      {prompt.content}
                    </div>
                    {!isAuthenticated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2 text-gray-800">로그인이 필요합니다</h3>
                          <p className="text-gray-600 mb-4">프롬프트 내용을 보려면 로그인하세요</p>
                          <Link 
                            href="/login" 
                            className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            로그인하기
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 텍스트 결과 */}
                {prompt.resultType === 'text' && prompt.textResult && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        프롬프트 결과
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(prompt.textResult || '');
                              setToastMessage('텍스트 결과가 클립보드에 복사되었습니다!');
                              setToastType('success');
                              setShowToast(true);
                            } catch (error) {
                              console.error('복사 실패:', error);
                              setToastMessage('복사에 실패했습니다. 다시 시도해주세요.');
                              setToastType('error');
                              setShowToast(true);
                            }
                          }}
                          className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                          title="텍스트 결과 복사"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className={`w-full border rounded-lg bg-white text-gray-800 leading-relaxed ${!isAuthenticated ? 'blur-sm select-none' : ''}`}>
                        {/* 텍스트 내용 */}
                        <div className={`p-4 whitespace-pre-wrap break-words overflow-wrap-anywhere transition-all duration-300 ${
                          !isTextResultExpanded && prompt.textResult && prompt.textResult.length > 500 
                            ? 'max-h-32 overflow-hidden' 
                            : ''
                        }`}>
                          {prompt.textResult}
                        </div>
                        
                        {/* 펼쳐보기/접어보기 버튼 */}
                        {prompt.textResult && prompt.textResult.length > 500 && (
                          <div className="px-4 pb-4">
                            <button
                              onClick={() => setIsTextResultExpanded(!isTextResultExpanded)}
                              className="flex items-center gap-2 text-orange-500 hover:text-orange-700 font-medium transition-colors"
                            >
                              <span>{isTextResultExpanded ? '접어보기' : '펼쳐보기'}</span>
                              <svg 
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isTextResultExpanded ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 카테고리, AI 모델, 공개 설정 및 태그 */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      정보
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* 카테고리 */}
                      {prompt.category && (
                        <button
                          onClick={handleCategoryClick}
                          className="inline-block bg-white text-orange-400 border border-orange-400 text-xs px-2 py-0.5 rounded font-medium hover:bg-orange-50 transition-colors cursor-pointer"
                        >
                          {prompt.category === 'work' && '⚡ 업무/마케팅'}
                          {prompt.category === 'dev' && '⚙️ 개발/코드'}
                          {prompt.category === 'design' && '✨ 디자인/브랜드'}
                          {prompt.category === 'edu' && '🎯 교육/학습'}
                          {prompt.category === 'image' && '🎬 이미지/동영상'}
                          {!['work', 'dev', 'design', 'edu', 'image'].includes(prompt.category) && prompt.category}
                        </button>
                      )}
                      
                      {/* AI 모델 */}
                      {prompt.aiModel && (
                        <button
                          onClick={handleAIModelClick}
                          className="inline-block bg-white text-orange-400 border border-orange-400 text-xs px-2 py-0.5 rounded font-medium hover:bg-orange-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const modelId = typeof prompt.aiModel === 'string' ? prompt.aiModel : prompt.aiModel?.id;
                              const model = aiModels.find(m => m.id === modelId);
                              if (model?.icon === '🔧') {
                                return <span>{model.icon}</span>;
                              } else if (model?.icon) {
                                return <img src={model.icon} alt={model.name} className="w-4 h-4 object-contain" />;
                              } else {
                                return <span>🤖</span>;
                              }
                            })()}
                            <span>
                              {(() => {
                                const modelId = typeof prompt.aiModel === 'string' ? prompt.aiModel : prompt.aiModel?.id;
                                const model = aiModels.find(m => m.id === modelId);
                                return model?.name || (typeof prompt.aiModel === 'string' ? prompt.aiModel : prompt.aiModel?.name) || '기타';
                              })()}
                            </span>
                          </div>
                        </button>
                      )}
                      
                      {/* 공개 설정 */}
                      <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium border ${
                        prompt.isPublic 
                          ? 'bg-white text-orange-400 border-orange-400' 
                          : 'bg-gray-100 text-gray-400 border-gray-300'
                      }`}>
                        {prompt.isPublic ? '🌐 공개' : '🔐 비공개'}
                      </span>

                      {/* 태그 */}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <>
                          <span className="text-gray-400 text-xs">|</span>
                          {prompt.tags.map((tag, index) => (
                            <button
                              key={index}
                              onClick={() => handleTagClick(tag)}
                              className="inline-block bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium hover:bg-orange-200 transition-colors cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <SharePrompt promptId={prompt.id} title={prompt.title} />
              </div>
            </div>

            {/* Comments */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">댓글</h3>
              <CommentSection 
                promptId={prompt.id} 
                onCommentCountUpdate={setCommentCount}
              />
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
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">프롬프트 신고</h2>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportCategory('other');
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 유형
              </label>
              <select
                value={reportCategory}
                onChange={(e) =>
                  setReportCategory(e.target.value as 'spam' | 'offensive' | 'illegal' | 'other')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="spam">스팸 / 광고</option>
                <option value="offensive">부적절한 내용</option>
                <option value="illegal">불법적인 내용</option>
                <option value="other">기타</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 사유
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="구체적인 신고 사유를 입력해주세요..."
              />
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              허위 신고는 제재를 받을 수 있습니다. 신중하게 신고해주세요.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportCategory('other');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReport}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptDetailPage;
