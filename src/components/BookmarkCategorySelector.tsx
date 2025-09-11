import React, { useState, useEffect } from 'react';
import { BookmarkCategory } from '@/types/prompt';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';

interface BookmarkCategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (categoryIds: (string | null)[]) => void;
  selectedCategoryIds?: (string | null)[];
}

const BookmarkCategorySelector: React.FC<BookmarkCategorySelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCategoryIds = [],
}) => {
  const { categories, loading } = useBookmarkCategories();
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>(selectedCategoryIds);

  useEffect(() => {
    setSelectedIds(selectedCategoryIds);
  }, [selectedCategoryIds]);

  const handleToggle = (categoryId: string | null) => {
    console.log('[DEBUG] BookmarkCategorySelector - handleToggle called with:', categoryId);
    console.log('[DEBUG] Current selectedIds:', selectedIds);
    
    setSelectedIds(prev => {
      const isSelected = prev.includes(categoryId);
      if (isSelected) {
        // 이미 선택된 경우 제거
        const newIds = prev.filter(id => id !== categoryId);
        console.log('[DEBUG] Removing category, new selectedIds:', newIds);
        return newIds;
      } else {
        // 선택되지 않은 경우 추가
        const newIds = [...prev, categoryId];
        console.log('[DEBUG] Adding category, new selectedIds:', newIds);
        return newIds;
      }
    });
  };

  const handleConfirm = () => {
    console.log('[DEBUG] Confirming selection:', selectedIds);
    onSelect(selectedIds);
    onClose();
  };

  const handleCancel = () => {
    setSelectedIds(selectedCategoryIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">북마크 카테고리 선택 (다중 선택 가능)</h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">카테고리를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 카테고리 목록 */}
            <div className="mb-6">
              <div className="space-y-2">
                {/* 기본 카테고리 (카테고리 없음) */}
                <label 
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[DEBUG] 카테고리 없음 label clicked');
                    handleToggle(null);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(null)}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[DEBUG] 카테고리 없음 onChange triggered');
                      handleToggle(null);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[DEBUG] 카테고리 없음 onClick triggered');
                      handleToggle(null);
                    }}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded mr-3"></div>
                    <span className="text-gray-600">카테고리 없음</span>
                  </div>
                </label>

                {/* 사용자 정의 카테고리들 */}
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[DEBUG] Category label clicked:', category.id);
                      handleToggle(category.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[DEBUG] Category onChange triggered:', category.id);
                        handleToggle(category.id);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[DEBUG] Category onClick triggered:', category.id);
                        handleToggle(category.id);
                      }}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span>{category.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirm();
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600"
              >
                선택
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookmarkCategorySelector;
