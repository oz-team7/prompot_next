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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">북마크 카테고리 관리</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 카테고리 목록 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">카테고리 목록</h4>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-sm text-primary hover:text-orange-600"
            >
              + 새 카테고리
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-sm">카테고리가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-gray-500">
                      ({category.bookmarkCount || 0}개)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="text-sm text-red-600 hover:text-red-700"
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
          <form onSubmit={handleSubmit} className="border-t pt-4">
            <h4 className="font-medium mb-3">
              {editingCategory ? '카테고리 수정' : '새 카테고리 생성'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="카테고리 이름을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  색상
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : (editingCategory ? '수정' : '생성')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookmarkCategoryManager;
