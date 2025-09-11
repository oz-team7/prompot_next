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
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setFormData({ name: '', color: '#3B82F6' });
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
    setFormData({ name: '', color: '#3B82F6' });
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
          <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400 text-center">카테고리 관리</h3>
        </div>

        {/* 카테고리 목록 */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">카테고리 목록</h4>
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
                  className="group flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-md shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors font-medium">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({category.bookmarkCount || 0}개)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-2 py-1 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="px-2 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  색상
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors font-medium"
              >
                {isSubmitting ? '처리 중...' : (editingCategory ? '수정' : '생성')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
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
