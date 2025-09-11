import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle, getFallbackThumbnail } from '@/utils/videoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useSearch } from '@/contexts/SearchContext';
import Toast from '@/components/Toast';

// 태그 표시 유틸리티 함수 - 더 정확한 너비 계산
const getDisplayTags = (tags: string[], cardWidth: number = 250): { displayTags: string[]; remainingCount: number } => {
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
  const { isAuthenticated } = useAuth();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  const { setSearchQuery } = useSearch();
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'bookmark'>('success');

  // 실제 북마크 상태 확인 (프롬프트 보기 페이지와 동일)
  // 북마크 상태를 실시간으로 확인 (useBookmarks 훅의 상태 사용)
  const actualIsBookmarked = bookmarks.some(bookmark => 
    bookmark && bookmark.prompt && bookmark.prompt.id === prompt.id
  );

  const getCategoryLabel = (category: string) => {
    const categoryLabels: { [key: string]: string } = {
      'work': '⚡ 업무/마케팅',
      'dev': '⚙️ 개발/코드',
      'design': '✨ 디자인/브랜드',
      'edu': '🎯 교육/학습',
      'image': '🎬 이미지/동영상',
    };
    return categoryLabels[category] || category;
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setToastMessage('로그인이 필요합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    console.log('[DEBUG] Bookmark toggle - prompt ID:', prompt.id, 'type:', typeof prompt.id);
    console.log('[DEBUG] Bookmark toggle - isBookmarked:', actualIsBookmarked);
    console.log('[DEBUG] Bookmark toggle - current bookmarks:', bookmarks);

    try {
      if (actualIsBookmarked) {
        console.log('[DEBUG] Removing bookmark for prompt ID:', prompt.id);
        await removeBookmark(prompt.id);
        setToastMessage('북마크가 제거되었습니다.');
        setToastType('bookmark');
        setShowToast(true);
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

  const handleCategorySelect = async (categoryIds: (string | null)[]) => {
    try {
      console.log('[DEBUG] Adding bookmark with category IDs:', categoryIds);
      console.log('[DEBUG] Prompt ID:', prompt.id, 'type:', typeof prompt.id);
      
      // 다중 카테고리 선택 시 첫 번째 카테고리만 사용 (기존 API 호환성 유지)
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
      
      // 실제 프롬프트 데이터를 전달하여 더 정확한 낙관적 업데이트
      await addBookmark(prompt.id, primaryCategoryId, prompt);
      
      console.log('[DEBUG] Bookmark added successfully, updating local state');
      setToastMessage('북마크에 추가되었습니다!');
      setToastType('bookmark');
      setShowToast(true);
      
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
    setShowCategorySelector(false);
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!prompt.category) return;
    if (onCategoryClick) {
      onCategoryClick(prompt.category);
    } else {
      const categoryLabel = getCategoryLabel(prompt.category);
      setSearchQuery(categoryLabel);
      router.push('/prompts');
    }
  };

  // AI 모델 클릭 핸들러
  const handleAIModelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const aiModelName = prompt.aiModel?.name || '';
    if (onAIModelClick) {
      onAIModelClick(aiModelName);
    } else {
      setSearchQuery(aiModelName);
      router.push('/prompts');
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
  return (
    <Link href={`/prompt/${prompt.id}`} className="block">
      <div 
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-[350px] flex flex-col w-full mb-2 overflow-hidden"
        onClick={(e) => {
          // 북마크 카테고리 선택기가 열려있을 때는 페이지 이동 방지
          if (showCategorySelector) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* 상단 고정 영역: 제목 + 미리보기 이미지 */}
        <div className="flex-shrink-0">
          <div className="px-3 sm:px-4 pt-3 pb-2">
            <div className="flex justify-between items-start mb-0">
              <h3 className="text-sm sm:text-base font-semibold line-clamp-1 flex-1 min-w-0" title={prompt.title}>
                {prompt.title}
              </h3>
              {isAuthenticated && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleBookmarkClick(e);
                  }}
                  className="flex items-center hover:scale-110 transition-transform ml-2 flex-shrink-0"
                  title={actualIsBookmarked ? '북마크 제거' : '북마크 추가'}
                >
                  <svg
                    className={`w-5 h-5 ${
                      actualIsBookmarked ? 'text-primary fill-current' : 'text-gray-500'
                    }`}
                    viewBox="0 0 24 24"
                    fill={actualIsBookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* 미리보기 이미지 - 최대 확장된 높이 */}
          <div className="h-40 mx-3 sm:mx-4 mb-3">
            {prompt.video_url && getVideoThumbnail(prompt.video_url) ? (
              <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={getVideoThumbnail(prompt.video_url)!}
                  alt={getVideoTitle(prompt.video_url)}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('썸네일 로드 실패:', prompt.video_url, e);
                    // 대체 썸네일 시도
                    const fallbackUrl = prompt.video_url ? getFallbackThumbnail(prompt.video_url) : null;
                    if (fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                      console.log('대체 썸네일 시도:', fallbackUrl);
                    } else {
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                  onLoad={() => {
                    console.log('썸네일 로드 성공:', prompt.video_url);
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            ) : prompt.preview_image ? (
              <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                <Image
                  src={prompt.preview_image}
                  alt={prompt.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onError={(e) => {
                    console.error('이미지 로드 실패:', prompt.preview_image, e);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('이미지 로드 성공:', prompt.preview_image);
                  }}
                />
              </div>
            ) : prompt.additional_images && prompt.additional_images.length > 0 ? (
              <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                <Image
                  src={prompt.additional_images[0]}
                  alt={prompt.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
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
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain opacity-70"
                />
              </div>
            )}
          </div>
        </div>

        {/* 중간 고정 영역: 설명 */}
        <div className="flex-shrink-0 px-3 sm:px-4 mb-3">
          <div className="h-10">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
              {prompt.description}
            </p>
          </div>
        </div>

        {/* 하단 고정 영역: 태그 + 카테고리/AI모델/작성자 */}
        <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
          {/* Tags - 고정 높이 */}
          <div className="h-5 flex items-center">
            {(() => {
              const { displayTags, remainingCount } = getDisplayTags(prompt.tags, 220); // 더 보수적인 컴팩트 카드 너비
              return displayTags.length > 0 || remainingCount > 0 ? (
                <div className="flex flex-nowrap gap-1 overflow-hidden">
                  {displayTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleTagClick(e, tag)}
                      className="inline-block bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 hover:bg-orange-200 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                  {remainingCount > 0 && (
                    <span className="inline-block bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0">
                      +{remainingCount}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-5"></div>
              );
            })()}
          </div>
          
          {/* Footer - 카테고리/AI모델/작성자 */}
          <div className="space-y-2">
            {/* 첫 번째 줄: 카테고리와 AI 모델 */}
            <div className="flex items-center gap-2">
              {/* 카테고리 */}
              {prompt.category && (
                <button
                  onClick={handleCategoryClick}
                  className="inline-block bg-orange-100 text-orange-700 border border-orange-400 text-xs px-2 py-0.5 rounded font-medium hover:bg-orange-200 transition-colors cursor-pointer"
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
            
            {/* 두 번째 줄: 작성자 */}
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                {/* 작성자 프로필사진 */}
                <div className="w-4 h-4 rounded-full overflow-hidden bg-white flex-shrink-0">
                  {prompt.author?.avatar_url ? (
                    <Image
                      src={prompt.author.avatar_url}
                      alt={prompt.author.name || '작성자'}
                      width={16}
                      height={16}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-orange-600">
                        {(prompt.author?.name || '익명').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* 작성자 이름 */}
                <span className="text-xs text-gray-500 whitespace-nowrap min-w-0 flex-shrink-0">{prompt.author?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </Link>
  );
};

export default PromptCardCompact;