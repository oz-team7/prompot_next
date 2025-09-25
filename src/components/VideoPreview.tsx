import React, { useState, useCallback } from 'react';
import { 
  getVideoEmbedUrl, 
  isDirectVideoUrl, 
  getVideoPlatformInfo,
  isValidVideoUrl 
} from '@/utils/videoUtils';

interface VideoPreviewProps {
  url: string;
  className?: string;
  title?: string;
  onError?: (error: string) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  url, 
  className = '', 
  title = '동영상 미리보기',
  onError 
}) => {
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  // URL 유효성 검사
  if (!isValidVideoUrl(url)) {
    return (
      <div className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-sm text-gray-600 mb-2">지원되지 않는 동영상 URL입니다</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 text-sm underline"
            >
              원본 링크로 이동
            </a>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getVideoEmbedUrl(url);
  const platformInfo = getVideoPlatformInfo(url);
  const isDirectVideo = isDirectVideoUrl(url);

  // 에러 핸들러
  const handleVideoError = useCallback(() => {
    console.log('[DEBUG] Video error for URL:', url);
    setVideoError(true);
    setIsLoading(false);
    onError?.('동영상을 불러올 수 없습니다');
  }, [onError, url]);

  const handleThumbnailError = useCallback(() => {
    setThumbnailError(true);
  }, []);

  // 로딩 완료 핸들러
  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // OpenAI Videos URL 만료 감지
  const isOpenAIVideo = url.includes('videos.openai.com');
  const isExpiredOpenAIVideo = isOpenAIVideo && (() => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const expiryMatch = decodedUrl.match(/se=([^&]+)/);
      if (expiryMatch) {
        const expiryDate = new Date(expiryMatch[1]);
        return !isNaN(expiryDate.getTime()) && new Date() > expiryDate;
      }
    } catch (e) {
      console.log('[DEBUG] URL decoding error:', e);
    }
    return false;
  })();

  // 직접 동영상 파일인 경우 (OpenAI Videos 등)
  if (isDirectVideo && !embedUrl) {
    return (
      <div className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        {isExpiredOpenAIVideo ? (
          // 만료된 OpenAI Videos URL에 대한 특별한 처리
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">동영상 링크 만료</h3>
              <p className="text-sm text-gray-600 mb-4">
                이 OpenAI Sora 동영상의 링크가 만료되었습니다.
                <br />
                동영상은 일정 기간 후 자동으로 삭제됩니다.
              </p>
              <div className="flex flex-col gap-2">
                <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
                  만료 시간: {(() => {
                    try {
                      const decodedUrl = decodeURIComponent(url);
                      const expiryMatch = decodedUrl.match(/se=([^&]+)/);
                      return expiryMatch ? new Date(expiryMatch[1]).toLocaleString('ko-KR') : '알 수 없음';
                    } catch (e) {
                      return '알 수 없음';
                    }
                  })()}
                </div>
                <p className="text-xs text-gray-500">
                  새로운 동영상을 생성하거나 다른 동영상을 확인해보세요.
                </p>
              </div>
            </div>
          </div>
        ) : videoError ? (
          // 비디오 로딩 실패 시 대체 UI
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">🎥</div>
              <p className="text-sm text-gray-500 mb-2">동영상을 불러올 수 없습니다</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-700 underline"
              >
                원본 링크로 이동
              </a>
            </div>
          </div>
        ) : (
          // 비디오 태그로 직접 재생 시도
          <video
            src={url}
            controls
            className="w-full h-full object-contain"
            onLoadedData={handleLoad}
            onError={handleVideoError}
            preload="metadata"
          >
            <source src={url} type="video/mp4" />
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <p className="text-sm text-gray-600 mb-2">동영상을 재생할 수 없습니다</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-600 text-sm underline"
                >
                  원본 링크로 이동
                </a>
              </div>
            </div>
          </video>
        )}
        {isLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  // 임베드 가능한 동영상인 경우
  if (embedUrl) {
    return (
      <div className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {videoError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-sm text-gray-600 mb-2">동영상을 불러올 수 없습니다</p>
              <div className="flex flex-col gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-600 text-sm underline"
                >
                  원본 링크로 이동
                </a>
                <button
                  onClick={() => {
                    setVideoError(false);
                    setIsLoading(true);
                  }}
                  className="text-blue-500 hover:text-blue-600 text-sm underline"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoad}
            onError={handleVideoError}
          />
        )}
      </div>
    );
  }

  // 지원되지 않는 형식인 경우
  return (
    <div className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-2">🎬</div>
          <p className="text-sm text-gray-600 mb-2">
            {platformInfo?.title || '동영상'}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-600 text-sm underline"
          >
            원본 링크로 이동
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
