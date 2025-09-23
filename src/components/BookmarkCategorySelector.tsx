import React, { useState, useEffect, useCallback } from 'react';
import { BookmarkCategory } from '@/types/prompt';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';

interface BookmarkCategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (categoryIds: (string | null)[]) => void;
  selectedCategoryIds?: (string | null)[];
  position?: { top: number; left: number; right?: number };
}

const BookmarkCategorySelector: React.FC<BookmarkCategorySelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCategoryIds = [],
  position,
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
    <>
      {/* Custom Checkbox Styles */}
      <style jsx>{`
        .custom-checkbox:checked {
          background-color: white !important;
          border-color: #fed7aa !important;
        }
        .custom-checkbox:checked:before {
          content: '✓';
          color: #f97316;
          font-size: 12px;
          font-weight: bold;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .custom-checkbox {
          position: relative;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: 1.5px solid #fed7aa !important;
          background-color: white !important;
        }
        .custom-checkbox:focus {
          outline: none !important;
          box-shadow: none !important;
          border-color: #fed7aa !important;
        }
      `}</style>
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl p-4 w-80 shadow-xl border border-orange-200 dark:border-orange-600"
        style={{
          top: position?.top ? `${position.top}px` : '50%',
          left: position?.left ? `${position.left}px` : '50%',
          transform: position ? 'translateY(-50%)' : 'translate(-50%, -50%)',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400 text-center">카테고리 선택</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-300">카테고리를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 카테고리 목록 */}
            <div className="mb-3">
              <div className="space-y-2">
                {/* 기본 카테고리 (카테고리 없음) */}
                <label 
                  className="group flex items-center p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-200 relative z-10"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(null)}
                    onChange={() => handleToggle(null)}
                    className="mr-4 w-4 h-4 border-orange-300 rounded focus:outline-none relative z-20 cursor-pointer custom-checkbox"
                  />
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-500 rounded-md mr-3 shadow-sm"></div>
                    <span className="text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">카테고리 없음</span>
                  </div>
                </label>

                {/* 사용자 정의 카테고리들 */}
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="group flex items-center p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-200 relative z-10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={() => handleToggle(category.id)}
                      className="mr-4 w-4 h-4 border-orange-300 rounded focus:outline-none relative z-20 cursor-pointer custom-checkbox"
                    />
                    <div className="flex items-center">
                      <div
                        className="w-5 h-5 rounded-md mr-3 shadow-sm border border-white/20"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">{category.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-orange-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              >
                선택
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default BookmarkCategorySelector;
