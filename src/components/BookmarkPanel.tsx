import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Prompt } from '@/types/prompt';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';
import BookmarkCategoryManager from './BookmarkCategoryManager';

interface BookmarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Array<{
    id: number;
    prompt: {
      id: number;
      title: string;
      description: string;
      content: string;
      category: string;
      tags: string[];
      aiModel: string;
      previewImage?: string;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      author: string;
      authorId?: string;
    };
    createdAt: string;
    categoryId?: string | null;
  }>;
  showCategoryManager?: boolean;
  onOpenCategoryManager?: () => void;
  onCloseCategoryManager?: () => void;
  onCategoryChange?: () => void;
}

const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  isOpen,
  onClose,
  bookmarks,
  showCategoryManager = false,
  onOpenCategoryManager,
  onCloseCategoryManager,
  onCategoryChange,
}) => {
  const router = useRouter();
  const { categories } = useBookmarkCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [internalShowCategoryManager, setInternalShowCategoryManager] = useState(false);

  // 카테고리 이름을 가져오는 함수
  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return '카테고리 없음';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '알 수 없는 카테고리';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-gradient-to-b from-orange-50 to-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-orange-100 bg-gradient-to-r from-orange-100 to-orange-50">
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">프롬프트 북마크</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose(); // 사이드바 닫기
                router.push('/mypage?tab=bookmarks'); // 마이페이지 북마크 탭으로 이동
              }}
              className="px-3 py-1.5 text-sm bg-white text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors font-medium shadow-sm"
            >
              북마크 관리
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors text-orange-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* 카테고리 필터 */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-orange-100">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-1 text-xs rounded-lg transition-all border ${
                  selectedCategory === null
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-md"
                    : "bg-white text-gray-700 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                }`}
              >
                전체 ({bookmarks.length})
              </button>
              {categories.map((category) => {
                const count = bookmarks.filter(b => b.categoryId === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-2 py-1 text-xs rounded-lg transition-all flex items-center gap-1 border ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-md"
                        : "bg-white text-gray-700 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-white/50"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-24 h-24 text-orange-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">아직 북마크한 프롬프트가 없습니다</h3>
              <p className="text-gray-500 text-sm">마음에 드는 프롬프트를 북마크해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks
                .filter((bookmark: any) => 
                  selectedCategory === null || 
                  bookmark.categoryId === selectedCategory
                )
                .map(bookmark => (
                  <Link 
                    key={bookmark.id} 
                    href={`/prompt/${bookmark.prompt.id}`}
                    className="block bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-orange-100 hover:border-orange-300 group"
                    onClick={onClose}
                  >
                    <div className="flex">
                      {/* Preview Image */}
                      <div className="relative w-28 h-28 flex-shrink-0">
                        {bookmark.prompt.previewImage ? (
                          <Image
                            src={bookmark.prompt.previewImage}
                            alt={bookmark.prompt.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="112px"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
                            <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4">
                        <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {bookmark.prompt.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bookmark.prompt.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {bookmark.prompt.author || '익명'}
                          </span>
                          <div className="flex items-center gap-1">
                            {bookmark.categoryId && (
                              <>
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: categories.find(c => c.id === bookmark.categoryId)?.color || '#ccc' }}
                                />
                                <span className="text-xs font-medium text-orange-600">
                                  {getCategoryName(bookmark.categoryId)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              {bookmarks.filter(b => selectedCategory === null || b.categoryId === selectedCategory).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">이 카테고리에 북마크가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 카테고리 관리 모달 */}
      <BookmarkCategoryManager
        isOpen={showCategoryManager || internalShowCategoryManager}
        onClose={() => {
          if (onCloseCategoryManager) {
            onCloseCategoryManager();
          } else {
            setInternalShowCategoryManager(false);
          }
        }}
        onCategoryChange={onCategoryChange}
      />
    </>
  );
};

export default BookmarkPanel;