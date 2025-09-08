import React, { useState } from 'react';
import Image from 'next/image';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

interface PromptCardProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number, categoryId?: number | null) => void;
  isBookmarked?: boolean;
}

interface PromptCardProps {
  prompt: Prompt;
  onLike: (id: number) => void;
  onBookmark?: (id: number) => void;
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

  const handleCategorySelect = (categoryId: number | null) => {
    if (onBookmark) {
      onBookmark(prompt.id, categoryId);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-1 line-clamp-1" title={prompt.title}>
        {prompt.title}
      </h3>
      <div className="text-sm text-gray-500 mb-2">
        {prompt.author?.name || '익명'} · {prompt.date}
      </div>
      
      {/* 동영상 썸네일 */}
      {prompt.videoUrl && getVideoThumbnail(prompt.videoUrl) && (
        <div className="mb-3">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
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
        </div>
      )}
      
      {/* 미리보기 이미지가 없고 동영상 썸네일도 없을 때 Prompot 로고 표시 */}
      {!prompt.previewImage && !(prompt.videoUrl && getVideoThumbnail(prompt.videoUrl)) && (
        <div className="mb-3">
          <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Prompot"
              width={64}
              height={64}
              className="w-16 h-16 object-contain opacity-70"
              unoptimized={true}
            />
          </div>
        </div>
      )}
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
        {prompt.description}
      </p>
      <div className="mb-3">
        {prompt.tags.map((tag, index) => (
          <span
            key={index}
            className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-1"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex justify-end items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span className="ml-1">{prompt.rating.toFixed(1)}</span>
          </span>
          <span className="text-gray-500">·</span>
          <button
            onClick={() => onLike(prompt.id)}
            className="flex items-center hover:scale-110 transition-transform"
          >
            <svg
              className={`w-4 h-4 ${
                prompt.isLiked ? 'text-red-500 fill-current' : 'text-gray-500'
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
            <span className="ml-1">{prompt.likes}</span>
          </button>
          {/* 북마크 버튼 추가 */}
          {onBookmark && (
            <>
              <span className="text-gray-500">·</span>
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
            </>
          )}
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