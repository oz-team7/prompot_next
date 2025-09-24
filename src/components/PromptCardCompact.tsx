import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle, getFallbackThumbnail, isDirectVideoUrl } from '@/utils/videoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLike } from '@/hooks/useLike';
import { useSearch } from '@/contexts/SearchContext';
import Toast from '@/components/Toast';
import FloatingHearts from '@/components/FloatingHearts';

interface PromptCardCompactProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number, categoryId?: string | null) => void;
  isBookmarked?: boolean;
  onCategoryClick?: (category: string) => void;
  onAIModelClick?: (aiModel: string) => void;
  onTagClick?: (tag: string) => void;
}

const PromptCardCompact: React.FC<PromptCardCompactProps> = ({ 
  prompt, 
  onLike, 
  onBookmark, 
  isBookmarked = false,
  onCategoryClick,
  onAIModelClick,
  onTagClick
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark, isBookmarked: checkIsBookmarked } = useBookmarks();
  const { setSearchQuery, setAuthorFilter } = useSearch();
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'bookmark'>('success');
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  // 좋아요 상태 관리 - useLike 훅 사용
  const { isLiked, likesCount, toggle: toggleLike, isBusy } = useLike(prompt.id);
  
  // 초기값을 위한 효과 (서버에서 받은 값을 SWR 캐시에 저장)
  useEffect(() => {
    if (prompt.is_liked !== undefined || prompt.likes_count !== undefined) {
      // mutate를 통해 초기 데이터 설정
      import('swr').then(({ mutate }) => {
        mutate(['like', String(prompt.id)], {
          is_liked: prompt.is_liked || false,
          likes_count: prompt.likes_count || prompt.likes || 0
        }, false);
      });
    }
  }, [prompt.id, prompt.is_liked, prompt.likes, prompt.likes_count]);

  // 북마크 상태
  const actualIsBookmarked = useMemo(() => {
    return checkIsBookmarked(prompt.id);
  }, [checkIsBookmarked, prompt.id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      if (actualIsBookmarked) {
        await removeBookmark(prompt.id);
        setToastMessage('북마크가 제거되었습니다.');
        setToastType('bookmark');
        setShowToast(true);
      } else {
        setShowCategorySelector(true);
      }
    } catch (error: any) {
      console.error('[DEBUG] Bookmark toggle error:', error);
      setToastMessage(error.message || '북마크 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCategorySelect = async (categoryIds: (string | null)[]) => {
    try {
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
      await addBookmark(prompt.id, primaryCategoryId, prompt);
      
      setToastMessage('북마크에 추가되었습니다!');
      setToastType('bookmark');
      setShowToast(true);
    } catch (error: any) {
      console.error('[DEBUG] Add bookmark with category error:', error);
      setToastMessage(error.message || '북마크 추가 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setShowCategorySelector(false);
    }
  };

  // 좋아요 처리
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
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
    } catch (error) {
      console.error('Error updating like:', error);
      setToastMessage('좋아요 처리 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <>
      <Link href={`/prompt/${prompt.id}`} className="block">
        <div 
          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
          onClick={(e) => {
            if (showCategorySelector) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {/* 이미지 영역 */}
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {/* 카테고리와 AI 모델 표시 (왼쪽 상단) */}
            <div className="absolute top-3 left-3 z-10 opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-2">
                {/* 카테고리 */}
                {prompt.category && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center shadow-sm">
                    <span className="text-xs font-medium text-gray-700">
                      {prompt.category === 'work' && '💼 업무/생산성'}
                      {prompt.category === 'dev' && '💻 개발/프로그래밍'}
                      {prompt.category === 'design' && '🎨 디자인/크리에이티브'}
                      {prompt.category === 'edu' && '🎯 교육/학습'}
                      {prompt.category === 'image' && '🎬 이미지/동영상'}
                      {!['work', 'dev', 'design', 'edu', 'image'].includes(prompt.category) && prompt.category}
                    </span>
                  </div>
                )}
                {/* AI 모델 */}
                {prompt.aiModel && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-sm">
                    {prompt.aiModel.icon && (
                      <img 
                        src={prompt.aiModel.icon} 
                        alt={prompt.aiModel.name}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-xs font-medium text-gray-700">
                      {prompt.aiModel.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 북마크 버튼 (오른쪽 상단) */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={handleBookmarkClick}
                className="group/bookmark transition-all duration-300"
                title={actualIsBookmarked ? '북마크 제거' : '북마크 추가'}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm group-hover/bookmark:bg-white transition-colors opacity-100">
                  <svg
                    className={`w-5 h-5 ${
                      actualIsBookmarked ? 'text-orange-500 fill-current' : 'text-gray-600'
                    }`}
                    viewBox="0 0 24 24"
                    fill={actualIsBookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                </div>
              </button>
            </div>

            {/* 이미지 */}
            {(() => {
              const videoUrl = prompt.video_url || prompt.videoUrl;
              const thumbnailUrl = videoUrl ? getVideoThumbnail(videoUrl) : null;
              const isDirectVideo = videoUrl ? isDirectVideoUrl(videoUrl) : false;
              return (videoUrl && (thumbnailUrl || isDirectVideo));
            })() ? (
              <div className="relative w-full h-full">
                {(() => {
                  const videoUrl = prompt.video_url || prompt.videoUrl || '';
                  const thumbnailUrl = getVideoThumbnail(videoUrl);
                  const isDirectVideo = isDirectVideoUrl(videoUrl);
                  
                  if (thumbnailUrl) {
                    // YouTube, Vimeo 등 썸네일이 있는 경우
                    return (
                      <Image
                        src={thumbnailUrl}
                        alt={getVideoTitle(videoUrl)}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                        style={{ objectPosition: 'left top' }}
                        onError={(e) => {
                          const fallbackUrl = getFallbackThumbnail(videoUrl);
                          if (fallbackUrl) {
                            e.currentTarget.src = fallbackUrl;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    );
                  } else if (isDirectVideo) {
                    // 직접 동영상 파일인 경우 video 태그 사용
                    return (
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (prompt.thumbnail_image || prompt.preview_image) ? (
              // 썸네일 편집 이미지가 있으면 우선 사용, 없으면 원본 미리보기 이미지 사용
              (() => {
                const imageUrl = prompt.thumbnail_image || prompt.preview_image;
                if (!imageUrl) return null;
                
                // 텍스트 기반 이미지인지 확인 (resultType이 text이거나 base64 인코딩된 이미지)
                const isTextImage = prompt.resultType === 'text' || imageUrl.startsWith('data:image');
                
                return isTextImage ? (
                  <div className="w-full h-full bg-white">
                    <Image
                      src={imageUrl}
                      alt={prompt.title}
                      fill
                      className="object-cover"
                      style={{ objectPosition: 'left top' }}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  // 일반 이미지는 패딩 없이 전체 화면에 표시
                  <Image
                    src={imageUrl}
                    alt={prompt.title}
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'left top' }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                );
              })()
            ) : prompt.additional_images && prompt.additional_images.length > 0 ? (
              <Image
                src={prompt.additional_images[0]}
                alt={prompt.title}
                fill
                className="object-cover"
                style={{ objectPosition: 'left top' }}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Prompot"
                  width={60}
                  height={60}
                  className="object-contain opacity-50"
                />
              </div>
            )}

            {/* 하단 정보 오버레이 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 sm:p-4 opacity-100 transition-opacity duration-300">
              {/* 제목 */}
              <h3 className="font-semibold text-white text-base sm:text-lg mb-2 line-clamp-2 drop-shadow-lg" title={prompt.title}>
                {prompt.title}
              </h3>

              {/* 작성자 및 통계 정보 */}
              <div className="flex items-center justify-between">
                {/* 작성자 정보 */}
                <div className="flex items-center gap-2">
                  {prompt.author?.avatar_url ? (
                    <Image
                      src={prompt.author.avatar_url}
                      alt={prompt.author.name || '작성자'}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-cover rounded-full border border-white/30"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <span className="text-xs font-medium text-white">
                        {(prompt.author?.name || '익명').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm sm:text-base text-white/90 drop-shadow font-medium">
                    {prompt.author?.name || '익명'}
                  </span>
                </div>

                {/* 통계 정보 */}
                <div className="flex items-center gap-3">
                  {/* 댓글 */}
                  <div className="flex items-center gap-1.5 text-white/90">
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={2}
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span className="text-sm sm:text-base font-medium">{prompt.comment_count || prompt.commentCount || prompt.comments?.length || 0}</span>
                  </div>

                  {/* 조회수 */}
                  <div className="flex items-center gap-1.5 text-white/90">
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={2}
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-sm sm:text-base font-medium">{prompt.views || 0}</span>
                  </div>

                  {/* 좋아요 */}
                  <div className="relative">
                    <button
                      onClick={handleLikeClick}
                      className="flex items-center gap-1.5 text-white/90 hover:text-red-400 transition-colors"
                      disabled={isBusy}
                    >
                      <svg
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'text-red-400 fill-current' : ''}`}
                        viewBox="0 0 24 24"
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      <span className={`text-sm sm:text-base font-medium ${isLiked ? 'text-red-400' : ''}`}>
                        {likesCount}
                      </span>
                    </button>
                    <FloatingHearts trigger={showHeartAnimation} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Bookmark Category Selector */}
      <BookmarkCategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
      />

      {/* Toast */}
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

export default PromptCardCompact;