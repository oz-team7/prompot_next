import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prompt } from '@/types/prompt';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';

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
  onRemoveBookmark: (id: number) => void;
}

const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
}) => {
  const { categories } = useBookmarkCategories();

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
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">내 북마크</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto h-[calc(100%-80px)]">
          {bookmarks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">아직 북마크한 프롬프트가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {bookmarks.map(bookmark => (
                <Link 
                  key={bookmark.id} 
                  href={`/prompt/${bookmark.prompt.id}`}
                  className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  onClick={onClose}
                >
                  <div className="flex">
                    {/* Preview Image */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {bookmark.prompt.previewImage ? (
                        <Image
                          src={bookmark.prompt.previewImage}
                          alt={bookmark.prompt.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
                          <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{bookmark.prompt.title}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{bookmark.prompt.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{getCategoryName(bookmark.categoryId)}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveBookmark(bookmark.prompt.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          제거
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookmarkPanel;