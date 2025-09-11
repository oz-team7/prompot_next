import React, { useState, useEffect, useCallback } from 'react';
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

  // 팝업이 열릴 때만 초기값 설정 (사용자 선택 중에는 외부 props 무시)
  useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] BookmarkCategorySelector - popup opened, initializing with:', selectedCategoryIds);
      setSelectedIds(selectedCategoryIds);
    }
  }, [isOpen]); // 팝업 열릴 때만 초기화

  const handleToggle = useCallback((categoryId: string | null) => {
    console.log('[DEBUG] BookmarkCategorySelector - handleToggle called with:', categoryId);
    
    setSelectedIds(prev => {
      console.log('[DEBUG] Previous selectedIds:', prev);
      const isSelected = prev.includes(categoryId);
      
      let newIds: (string | null)[];
      if (isSelected) {
        // 체크 해제: 해당 ID 제거
        newIds = prev.filter(id => id !== categoryId);
        console.log('[DEBUG] Removing category:', categoryId);
      } else {
        // 체크: 해당 ID 추가
        newIds = [...prev, categoryId];
        console.log('[DEBUG] Adding category:', categoryId);
      }
      
      console.log('[DEBUG] Updated selectedIds:', newIds);
      return newIds;
    });
  }, []);

  const handleConfirm = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('[DEBUG] Confirming selection:', selectedIds);
    onSelect(selectedIds);
    onClose();
  }, [selectedIds, onSelect, onClose]);

  const handleCancel = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('[DEBUG] Canceling, resetting to initial:', selectedCategoryIds);
    setSelectedIds(selectedCategoryIds);
    onClose();
  }, [selectedCategoryIds, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">북마크 카테고리 선택 (다중 선택 가능)</h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
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
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors relative z-10"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(null)}
                    onChange={() => handleToggle(null)}
                    className="mr-3 relative z-20 cursor-pointer"
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
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors relative z-10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={() => handleToggle(category.id)}
                      className="mr-3 relative z-20 cursor-pointer"
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
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
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
