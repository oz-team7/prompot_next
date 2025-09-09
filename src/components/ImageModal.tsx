import React, { useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, alt }) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 모달 내용 */}
      <div 
        className="relative inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이미지 */}
        <div className="relative">
          <Image
            src={imageUrl}
            alt={alt}
            width={800}
            height={600}
            className="rounded-lg border-4 border-orange-200"
            style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' }}
            unoptimized={true}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
