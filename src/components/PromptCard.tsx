import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle, getFallbackThumbnail, isDirectVideoUrl } from '@/utils/videoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useSearch } from '@/contexts/SearchContext';
import Toast from '@/components/Toast';

// 태그 표시 유틸리티 함수 - 더 정확한 너비 계산
const getDisplayTags = (tags: string[], cardWidth: number = 280): { displayTags: string[]; remainingCount: number } => {
  if (tags.length === 0) return { displayTags: [], remainingCount: 0 };
  
  // 더 보수적인 태그 너비 계산 (한글 문자 고려)
  const getTagWidth = (tag: string) => {
    // 한글은 더 넓은 공간 필요 (한글 1자 = 약 12px, 영문 1자 = 약 6px)
    const koreanChars = (tag.match(/[가-힣]/g) || []).length;
    const otherChars = tag.length - koreanChars;
    const textWidth = koreanChars * 12 + otherChars * 6;
    
    const padding = 16; // px-2 (8px * 2) + 여유분
    const gap = 6; // gap-1 + 여유분
    return textWidth + padding + gap;
  };
  
  // + 표시 너비 (더 여유있게)
  const plusWidth = 30; // +숫자 표시 예상 너비 + 여유분
  
  let totalWidth = 0;
  let displayCount = 0;
  
  for (let i = 0; i < tags.length; i++) {
    const tagWidth = getTagWidth(tags[i]);
    
    // + 표시가 필요한지 확인 (다음 태그가 있으면)
    const needsPlus = i < tags.length - 1;
    const requiredWidth = totalWidth + tagWidth + (needsPlus ? plusWidth : 0);
    
    // 더 보수적인 계산 (카드 너비의 90%까지만 사용)
    const availableWidth = cardWidth * 0.9;
    
    if (requiredWidth <= availableWidth) {
      totalWidth += tagWidth;
      displayCount++;
    } else {
      break;
    }
  }
  
  const displayTags = tags.slice(0, displayCount);
  const remainingCount = Math.max(0, tags.length - displayCount);
  
  return { displayTags, remainingCount };
};

interface PromptCardProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number, categoryId?: string | null) => void;
  isBookmarked?: boolean;
  onCategoryClick?: (category: string) => void;
  onAIModelClick?: (aiModel: string) => void;
  onTagClick?: (tag: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ 
  prompt, 
  onLike, 
  onBookmark, 
  isBookmarked = false,
  onCategoryClick,
  onAIModelClick,
  onTagClick
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  // 최적화된 북마크 훅 사용
  const { bookmarks, addBookmark, removeBookmark, isBookmarked: checkIsBookmarked } = useBookmarks();
  const { setSearchQuery } = useSearch();
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'bookmark'>('success');
  const bookmarkButtonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | undefined>();
  
  // 단순화된 북마크 상태 (실시간 반영)
  const actualIsBookmarked = useMemo(() => {
    return checkIsBookmarked(prompt.id);
  }, [checkIsBookmarked, prompt.id]);

  const handleBookmarkClick = async () => {
    if (!isAuthenticated) {
      setToastMessage('로그인이 필요합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      if (actualIsBookmarked) {
        // 북마크 제거 (즉시 UI 반영됨)
        await removeBookmark(prompt.id);
        setToastMessage('북마크가 제거되었습니다.');
        setToastType('bookmark');
        setShowToast(true);
      } else {
        // 북마크 추가 시 카테고리 선택 모달 표시
        if (bookmarkButtonRef.current) {
          const rect = bookmarkButtonRef.current.getBoundingClientRect();
          setPopupPosition({
            top: rect.top + window.scrollY,
            left: rect.right + 10 // 아이콘 오른쪽으로 10px 간격
          });
        }
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
      // 첫 번째 카테고리 ID 사용 (기존 API 호환성)
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
      
      // 실제 프롬프트 데이터를 전달 (낙관적 업데이트를 위해)
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


  // 태그 클릭 핸들러
  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(tag);
    } else {
      setSearchQuery(tag);
      router.push('/prompts');
    }
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
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-6 pt-5 pb-6 h-[400px] flex flex-col w-full mb-2 overflow-hidden group">
      {/* 클릭 가능한 영역을 별도로 분리 */}
      <Link href={`/prompt/${prompt.id}`} className="block flex-1">
        <div className="h-full flex flex-col">
      {/* 상단 고정 영역: 제목 + 미리보기 이미지 */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between items-start mb-0">
          <h3 className="text-lg font-semibold line-clamp-1 flex-1 min-w-0 opacity-100 transition-opacity duration-300" title={prompt.title}>
            {prompt.title}
          </h3>
        </div>
        
        {/* 미리보기 이미지 - 최대 확장된 높이 */}
        <div className="h-48 mb-3">
          {(() => {
            const videoUrl = prompt.video_url || prompt.videoUrl;
            const thumbnailUrl = videoUrl ? getVideoThumbnail(videoUrl) : null;
            const isDirectVideo = videoUrl ? isDirectVideoUrl(videoUrl) : false;
            return (videoUrl && (thumbnailUrl || isDirectVideo));
          })() ? (
            <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
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
                        console.error('썸네일 로드 실패:', videoUrl, e);
                        // 대체 썸네일 시도
                        const fallbackUrl = getFallbackThumbnail(videoUrl);
                        if (fallbackUrl) {
                          e.currentTarget.src = fallbackUrl;
                          console.log('대체 썸네일 시도:', fallbackUrl);
                        } else {
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                      onLoad={() => {
                        console.log('썸네일 로드 성공:', videoUrl);
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
                      onLoadedData={(e) => {
                        console.log('동영상 로드 성공:', videoUrl);
                      }}
                      onError={(e) => {
                        console.error('동영상 로드 실패:', videoUrl, e);
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
                <div className="relative w-full h-full bg-white rounded-lg overflow-hidden group cursor-pointer">
                  <Image
                    src={imageUrl}
                    alt={prompt.title}
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'left top' }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={(e) => {
                      console.error('이미지 로드 실패:', imageUrl, e);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('이미지 로드 성공:', imageUrl);
                    }}
                  />
                </div>
              ) : (
                // 일반 이미지는 패딩 없이 전체 화면에 표시
                <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                  <Image
                    src={imageUrl}
                    alt={prompt.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    style={{ objectPosition: 'left top' }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={(e) => {
                      console.error('이미지 로드 실패:', imageUrl, e);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('이미지 로드 성공:', imageUrl);
                    }}
                  />
                </div>
              );
            })()
          ) : prompt.additional_images && prompt.additional_images.length > 0 ? (
            <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
              <Image
                src={prompt.additional_images[0]}
                alt={prompt.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                style={{ objectPosition: 'left top' }}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={(e) => {
                  console.error('추가 이미지 로드 실패:', prompt.additional_images?.[0], e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('추가 이미지 로드 성공:', prompt.additional_images?.[0]);
                }}
              />
            </div>
          ) : (
            <div className="relative w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Prompot"
                width={64}
                height={64}
                className="w-16 h-16 object-contain opacity-70"
              />
            </div>
          )}
        </div>
      </div>

      {/* 중간 고정 영역: 설명 */}
      <div className="flex-shrink-0 mb-3">
        <div className="h-12">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 opacity-100 transition-opacity duration-300">
            {prompt.description}
          </p>
        </div>
      </div>

          {/* 하단 고정 영역: 태그 */}
          <div className="flex-shrink-0 space-y-2">
            {/* Tags - 고정 높이 */}
            <div className="h-6 flex items-center">
              {(() => {
                const { displayTags, remainingCount } = getDisplayTags(prompt.tags, 260); // 더 보수적인 카드 너비
                return displayTags.length > 0 || remainingCount > 0 ? (
                  <div className="flex flex-nowrap gap-1 overflow-hidden opacity-100 transition-opacity duration-300">
                    {displayTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0"
                      >
                        {tag}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span className="inline-block bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0">
                        +{remainingCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-6"></div>
                );
              })()}
            </div>
          </div>
        </div>
      </Link>

      {/* 버튼 영역 - Link 밖에 배치 */}
      <div className="flex-shrink-0 space-y-2 opacity-100 transition-opacity duration-300">
        {/* 첫 번째 줄: 카테고리와 AI 모델 */}
        <div className="flex items-center gap-2">
          {/* 카테고리 */}
          {prompt.category && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('카테고리 버튼 클릭됨:', prompt.category);
                const categoryLabel = getCategoryLabel(prompt.category || '');
                setSearchQuery(categoryLabel);
                router.push('/prompts');
              }}
              className="inline-block bg-white text-orange-400 border border-orange-400 text-xs px-2 py-0.5 rounded font-medium hover:bg-orange-50 hover:border-orange-500 hover:text-orange-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-50 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
              title="카테고리로 필터링"
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const aiModelName = prompt.aiModel?.name || '';
                console.log('AI모델 버튼 클릭됨:', aiModelName);
                setSearchQuery(aiModelName);
                router.push('/prompts');
              }}
              className="inline-block bg-white text-orange-400 border border-orange-400 text-xs px-2 py-0.5 rounded font-medium hover:bg-orange-50 hover:border-orange-500 hover:text-orange-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-50 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 opacity-100 transition-opacity duration-300"
              title="AI 모델로 필터링"
            >
              <div className="flex items-center gap-1">
                {prompt.aiModel.icon && (
                  <img 
                    src={prompt.aiModel.icon} 
                    alt={prompt.aiModel.name}
                    className="w-3 h-3 object-contain"
                  />
                )}
                {prompt.aiModel.name}
              </div>
            </button>
          )}
        </div>
        
        {/* 두 번째 줄: 작성자와 통계 정보 */}
        <div className="flex justify-between items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const authorName = prompt.author?.name || '익명';
              console.log('작성자 버튼 클릭됨:', authorName);
              setSearchQuery(authorName);
              router.push('/prompts');
            }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-orange-100 hover:bg-opacity-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-50 transition-all duration-200 group cursor-pointer transform hover:scale-105 active:scale-95"
            title="작성자로 필터링"
          >
            {/* 작성자 프로필사진 */}
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white flex-shrink-0">
              {prompt.author?.avatar_url ? (
                <Image
                  src={prompt.author.avatar_url}
                  alt={prompt.author.name || '작성자'}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center rounded-full">
                  <span className="text-xs font-medium text-orange-600">
                    {(prompt.author?.name || '익명').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {/* 작성자 이름 */}
            <span className="text-xs text-gray-500 group-hover:text-orange-600 whitespace-nowrap min-w-0 flex-shrink-0 transition-colors">
              {prompt.author?.name || '익명'}
            </span>
          </button>
          
          {/* 통계 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>{prompt.views || 0}</span>
            </div>
            <div className="relative">
              <button 
                className="flex items-center gap-1.5 hover:text-red-500 hover:bg-red-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 rounded-lg px-1 py-0.5"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLike(prompt.id);
                }}
                title="좋아요"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
                </svg>
                <span>{prompt.likes_count || prompt.likes || 0}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
              </svg>
              <span>{prompt.comment_count || prompt.commentCount || prompt.comments?.length || 0}</span>
            </div>
            {/* 북마크 버튼 */}
            <button
              ref={bookmarkButtonRef}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBookmarkClick();
              }}
              className={`flex items-center gap-1.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-50 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 rounded-lg px-1 py-0.5 ${
                actualIsBookmarked 
                  ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' 
                  : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
              }`}
              title={actualIsBookmarked ? "북마크 제거" : "북마크 추가"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={actualIsBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bookmark Category Selector */}
      <BookmarkCategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
        position={popupPosition}
      />

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default PromptCard;