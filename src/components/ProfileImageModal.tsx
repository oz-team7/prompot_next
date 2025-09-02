import React from 'react';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  avatarUrl?: string | null;
  onEdit: () => void;
}

export default function ProfileImageModal({ 
  isOpen, 
  onClose, 
  user, 
  avatarUrl,
  onEdit 
}: ProfileImageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">프로필 이미지</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 이미지 영역 */}
        <div className="relative aspect-square w-full max-h-[70vh] mb-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user?.email || '프로필 이미지'}
              fill
              className="object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-6xl font-bold text-gray-400">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-orange-600 transition-colors"
          >
            이미지 수정
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
