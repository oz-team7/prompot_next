import React, { useState } from 'react';
import { BookmarkCategory } from '@/types/prompt';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';

interface BookmarkCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChange?: () => void;
}

const BookmarkCategoryManager: React.FC<BookmarkCategoryManagerProps> = ({
  isOpen,
  onClose,
  onCategoryChange,
}) => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useBookmarkCategories();
  const [editingCategory, setEditingCategory] = useState<BookmarkCategory | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#FF7A00' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 프리셋 색상 (브랜드 컬러 기반)
  const presetColors = [
    '#FF7A00', // 메인 오렌지
    '#FFA500', // 밝은 오렌지
    '#FF8C00', // 다크 오렌지
    '#FFB347', // 피치
    '#FF6B35', // 레드 오렌지
    '#FFC080', // 라이트 오렌지
    '#E67E22', // 당근색
    '#F39C12', // 황금 오렌지
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData.name, formData.color);
        setEditingCategory(null);
      } else {
        await createCategory(formData.name, formData.color);
        setShowCreateForm(false);
      }
      setFormData({ name: '', color: '#FF7A00' });
      onCategoryChange?.();
    } catch (error) {
      console.error('Category operation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: BookmarkCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, color: category.color });
    setShowCreateForm(true);
  };

  const handleDelete = async (category: BookmarkCategory) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) return;

    try {
      await deleteCategory(category.id);
      onCategoryChange?.();
    } catch (error) {
      console.error('Category deletion failed:', error);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setShowCreateForm(false);
    setFormData({ name: '', color: '#FF7A00' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Custom Styles */}
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
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400 text-center">북마크 관리</h3>
        </div>

        {/* 카테고리 목록 */}
        <div className="mb-3">
          <div className="flex justify-end items-center mb-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              + 새 카테고리
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">카테고리를 불러오는 중...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📁</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">카테고리가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="group flex items-center justify-between p-3 bg-white border border-orange-300 rounded-lg hover:border-orange-500 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-orange-600">
                      {category.name}
                    </span>
                    <span className="text-xs text-orange-600 font-medium">
                      ({category.bookmarkCount || 0})
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-2.5 py-1 text-xs font-medium text-orange-600 hover:text-white bg-white border border-orange-300 hover:bg-orange-500 hover:border-orange-500 rounded transition-all duration-200"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-white bg-white border border-red-300 hover:bg-red-500 hover:border-red-500 rounded transition-all duration-200"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리 생성/수정 폼 */}
        {showCreateForm && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {editingCategory ? '카테고리 수정' : '새 카테고리 생성'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  카테고리 이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="카테고리 이름을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  색상 선택
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color 
                          ? 'border-gray-800 scale-110 shadow-md' 
                          : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="#FF7A00"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-medium"
              >
                {isSubmitting ? '처리 중...' : (editingCategory ? '수정' : '생성')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm bg-white text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookmarkCategoryManager;
