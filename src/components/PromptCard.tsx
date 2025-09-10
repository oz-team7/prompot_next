import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

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
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onLike, onBookmark, isBookmarked = false }) => {
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const handleBookmarkClick = () => {
    if (!onBookmark) return;
    
    if (isBookmarked) {
      // 이미 북마크된 경우 제거
      onBookmark(prompt.id);
    } else {
      // 북마크 추가 시 카테고리 선택 모달 표시
      setShowCategorySelector(true);
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    if (onBookmark) {
      onBookmark(prompt.id, categoryId);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-[450px] flex flex-col w-full mb-2 overflow-hidden">
      {/* 상단 고정 영역: 제목 + 미리보기 이미지 */}
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-lg font-semibold mb-3 line-clamp-1" title={prompt.title}>
          {prompt.title}
        </h3>
        
        {/* 미리보기 이미지 - 고정 높이 */}
        <div className="h-32 mb-3">
          {prompt.videoUrl && getVideoThumbnail(prompt.videoUrl) ? (
            <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={getVideoThumbnail(prompt.videoUrl)!}
                alt={getVideoTitle(prompt.videoUrl)}
                fill
                className="object-cover"
                unoptimized={true}
                onError={(e) => {
                  console.error('썸네일 로드 실패:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          ) : prompt.previewImage ? (
            <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={prompt.previewImage}
                alt={prompt.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={(e) => {
                  console.error('이미지 로드 실패:', prompt.previewImage, e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('이미지 로드 성공:', prompt.previewImage);
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
                unoptimized={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* 중간 가변 영역: 설명 */}
      <div className="flex-grow mb-4 min-h-[60px]">
        <div className="h-full">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {prompt.description}
          </p>
        </div>
      </div>

      {/* 하단 고정 영역: 태그 + 카테고리/AI모델/작성자 */}
      <div className="flex-shrink-0 space-y-3">
        {/* Tags - 고정 높이 */}
        <div className="h-6 flex items-center">
          {(() => {
            const { displayTags, remainingCount } = getDisplayTags(prompt.tags, 260); // 더 보수적인 카드 너비
            return displayTags.length > 0 || remainingCount > 0 ? (
              <div className="flex flex-nowrap gap-1 overflow-hidden">
                {displayTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0"
                  >
                    {tag}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0">
                    +{remainingCount}
                  </span>
                )}
              </div>
            ) : (
              <div className="h-6"></div>
            );
          })()}
        </div>
        
        {/* Footer - 카테고리/AI모델/작성자 */}
        <div className="space-y-2">
          {/* 첫 번째 줄: 카테고리와 AI 모델 */}
          <div className="flex items-center gap-2">
            {/* 카테고리 */}
            {prompt.category && (
              <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-medium">
                {prompt.category === 'work' && '업무/마케팅'}
                {prompt.category === 'dev' && '개발/코드'}
                {prompt.category === 'design' && '디자인/브랜드'}
                {prompt.category === 'edu' && '교육/학습'}
                  {prompt.category === 'image' && '이미지/동영상'}
                {!['work', 'dev', 'design', 'edu', 'image'].includes(prompt.category) && prompt.category}
              </span>
            )}
            {/* AI 모델 */}
            {prompt.aiModel && (
              <span className="inline-block bg-orange-100 text-black text-xs px-2 py-0.5 rounded font-medium">
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
              </span>
            )}
          </div>
          
          {/* 두 번째 줄: 작성자와 북마크 */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {prompt.author?.name || '익명'}
            </span>
            {/* 북마크 버튼 */}
            {onBookmark && (
              <button
                onClick={handleBookmarkClick}
                className="flex items-center hover:scale-110 transition-transform"
                title={isBookmarked ? '북마크 제거' : '북마크 추가'}
              >
                <svg
                  className={`w-4 h-4 ${
                    isBookmarked ? 'text-primary fill-current' : 'text-gray-500'
                  }`}
                  viewBox="0 0 24 24"
                  fill={isBookmarked ? 'currentColor' : 'none'}
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
      </div>

      {/* Bookmark Category Selector */}
      <BookmarkCategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
      />
    </div>
  );
};

export default PromptCard;