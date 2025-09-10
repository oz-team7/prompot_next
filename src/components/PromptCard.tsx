import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prompt } from '@/types/prompt';
import BookmarkCategorySelector from './BookmarkCategorySelector';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

// 태그 표시 유틸리티 함수
const getDisplayTags = (tags: string[], maxCount: number = 3): { displayTags: string[]; remainingCount: number } => {
  const displayTags = tags.slice(0, maxCount);
  const remainingCount = Math.max(0, tags.length - maxCount);
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
            const { displayTags, remainingCount } = getDisplayTags(prompt.tags, 3);
            return displayTags.length > 0 || remainingCount > 0 ? (
              <div className="flex flex-wrap gap-1">
                {displayTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* 카테고리 */}
            {prompt.category && (
              <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-medium">
                {prompt.category === 'work' && '업무/마케팅'}
                {prompt.category === 'dev' && '개발/코드'}
                {prompt.category === 'design' && '디자인/브랜드'}
                {prompt.category === 'edu' && '교육/학습'}
                {prompt.category === 'image' && '이미지/아트'}
                {!['work', 'dev', 'design', 'edu', 'image'].includes(prompt.category) && prompt.category}
              </span>
            )}
            {/* AI 모델 */}
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
          <div className="flex items-center gap-2 min-w-0">
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