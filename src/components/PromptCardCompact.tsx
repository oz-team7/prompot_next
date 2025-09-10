import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

// 태그 표시 유틸리티 함수
const getDisplayTags = (tags: string[], maxCount: number = 5): { displayTags: string[]; remainingCount: number } => {
  const displayTags = tags.slice(0, maxCount);
  const remainingCount = Math.max(0, tags.length - maxCount);
  return { displayTags, remainingCount };
};

interface PromptCardCompactProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number, categoryId?: string | null) => void;
  isBookmarked?: boolean;
}

const PromptCardCompact: React.FC<PromptCardCompactProps> = ({ prompt, onLike, onBookmark, isBookmarked = false }) => {
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const getCategoryLabel = (category: string) => {
    const categoryLabels: { [key: string]: string } = {
      'work': '업무/마케팅',
      'dev': '개발/코드',
      'design': '디자인/브랜드',
      'edu': '교육/학습',
      'image': '이미지/아트',
    };
    return categoryLabels[category] || category;
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    <Link href={`/prompt/${prompt.id}`} className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer">
      {/* Preview Image or Video Thumbnail */}
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        {prompt.videoUrl && getVideoThumbnail(prompt.videoUrl) ? (
          // 동영상 썸네일 우선 표시
          <>
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
          </>
        ) : prompt.previewImage ? (
          // 기존 미리보기 이미지
          <Image
            src={prompt.previewImage}
            alt={prompt.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          // 기본 Prompot 로고
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
            <Image
              src="/logo.png"
              alt="Prompot"
              width={48}
              height={48}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain opacity-70"
              unoptimized={true}
            />
          </div>
        )}
        
        {/* Bookmark Button */}
        {onBookmark && (
          <button
            onClick={handleBookmarkClick}
            className="absolute top-2 right-2 p-1.5 sm:p-2 bg-white/90 hover:bg-white rounded-full shadow-sm hover:shadow-md transition-all"
            aria-label="북마크"
          >
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isBookmarked ? 'fill-primary text-primary' : 'text-gray-600'}`} 
              fill={isBookmarked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
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

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold mb-1 line-clamp-1" title={prompt.title}>
          {prompt.title}
        </h3>
        <div className="relative mb-2">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            {prompt.description}
          </p>
        </div>
        
        {/* Category and AI Model */}
        <div className="mb-2 flex flex-wrap gap-1">
          {prompt.category && (
            <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-medium">
              {getCategoryLabel(prompt.category)}
            </span>
          )}
          {prompt.aiModel && (
            <span className="inline-flex items-center gap-1 bg-white text-yellow-600 text-xs px-2 py-0.5 rounded font-medium border border-yellow-200">
              {prompt.aiModel.icon && (
                <img 
                  src={prompt.aiModel.icon} 
                  alt={prompt.aiModel.name}
                  className="w-3 h-3 object-contain"
                />
              )}
              {prompt.aiModel.name}
            </span>
          )}
        </div>

        {/* Tags - Mobile Compact */}
        <div className="mb-2 flex flex-wrap gap-1">
          {(() => {
            const { displayTags, remainingCount } = getDisplayTags(prompt.tags, 5);
            return (
              <>
                {displayTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="text-xs text-gray-500">+{remainingCount}</span>
                )}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span>{prompt.rating?.toFixed(1) || '0.0'}</span>
              {prompt.totalRatings && prompt.totalRatings > 0 && (
                <span className="text-gray-500">({prompt.totalRatings})</span>
              )}
            </span>
          </div>
          <span className="text-xs text-gray-500">{prompt.author?.name}</span>
        </div>
      </div>

      {/* Bookmark Category Selector */}
      <BookmarkCategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
      />
    </Link>
  );
};

export default PromptCardCompact;