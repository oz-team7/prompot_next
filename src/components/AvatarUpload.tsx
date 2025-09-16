import React, { useState, useRef } from 'react';
// import Image from 'next/image'; // 주석 처리

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarChange: (avatarUrl: string) => void;
  className?: string;
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  userName, 
  onAvatarChange, 
  className = '' 
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData: previewUrl,
          fileName: 'avatar.jpg',
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        onAvatarChange(data.avatarUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('프로필 사진 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 아바타 표시 */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/logo.png';
              }}
            />
          ) : (
            <img
              src="/logo.png"
              alt="PROMPOT Logo"
              className="w-full h-full object-cover p-4"
            />
          )}
        </div>
        
        {/* 업로드 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
          disabled={isUploading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 미리보기 및 업로드 버튼 */}
      {previewUrl && (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
