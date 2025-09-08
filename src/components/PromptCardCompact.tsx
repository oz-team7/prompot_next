import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

interface PromptCardCompactProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number, categoryId?: number | null) => void;
  isBookmarked?: boolean;
}

interface PromptCardCompactProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number) => void;
  isBookmarked?: boolean;
}

const PromptCardCompact: React.FC<PromptCardCompactProps> = ({ prompt, onLike, onBookmark, isBookmarked = false }) => {
  const [showCategorySelector, setShowCategorySelector] = useState(false);

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

  const handleCategorySelect = (categoryId: number | null) => {
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
        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
          {prompt.description}
        </p>
        
        {/* Tags - Mobile Compact */}
        <div className="mb-2 flex flex-wrap gap-1">
          {prompt.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{prompt.tags.length - 2}</span>
          )}
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
            <button
              onClick={(e) => {
                e.preventDefault();
                onLike(prompt.id);
              }}
              className="flex items-center gap-1 hover:scale-110 transition-transform"
            >
              <svg
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  prompt.isLiked ? 'text-red-500 fill-current' : 'text-gray-400'
                }`}
                viewBox="0 0 20 20"
                fill={prompt.isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                />
              </svg>
              <span>{prompt.likes}</span>
            </button>
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