// 동영상 플랫폼 타입 정의
export interface VideoPlatform {
  name: string;
  patterns: RegExp[];
  thumbnailUrl: (videoId: string) => string;
  embedUrl: (videoId: string) => string;
  isSupported: boolean;
}

// 동영상 플랫폼 설정
const VIDEO_PLATFORMS: VideoPlatform[] = [
  {
    name: 'youtube',
    patterns: [
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
      /^.*(youtube\.com\/shorts\/|youtu\.be\/)([^#&?]*).*/
    ],
    thumbnailUrl: (videoId: string) => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    embedUrl: (videoId: string) => `https://www.youtube.com/embed/${videoId}`,
    isSupported: true
  },
  {
    name: 'vimeo',
    patterns: [/vimeo\.com\/(\d+)/],
    thumbnailUrl: (videoId: string) => `https://vumbnail.com/${videoId}.jpg`,
    embedUrl: (videoId: string) => `https://player.vimeo.com/video/${videoId}`,
    isSupported: true
  }
];

// 직접 동영상 파일 확장자들
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];

// 특수 동영상 서비스들
const SPECIAL_VIDEO_SERVICES = [
  'videos.openai.com',
  'storage.googleapis.com',
  'amazonaws.com',
  'blob:'
];

// 동영상 ID 추출 함수
export const extractVideoId = (url: string): { platform: string; videoId: string } | null => {
  for (const platform of VIDEO_PLATFORMS) {
    for (const pattern of platform.patterns) {
      const match = url.match(pattern);
      if (match) {
        // YouTube의 경우 두 번째 캡처 그룹이 video ID
        const videoId = match[2] || match[1];
        if (videoId && videoId.length >= 8) { // 최소 길이 체크
          return { platform: platform.name, videoId };
        }
      }
    }
  }
  return null;
};

// 동영상 썸네일 URL 생성
export const getVideoThumbnail = (url: string): string | null => {
  const videoInfo = extractVideoId(url);
  if (videoInfo) {
    const platform = VIDEO_PLATFORMS.find(p => p.name === videoInfo.platform);
    return platform ? platform.thumbnailUrl(videoInfo.videoId) : null;
  }
  return null;
};

// 대체 썸네일 URL 생성 (maxresdefault 실패 시 사용)
export const getFallbackThumbnail = (url: string): string | null => {
  const videoInfo = extractVideoId(url);
  if (videoInfo && videoInfo.platform === 'youtube') {
    return `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
  }
  return null;
};

// 동영상 임베드 URL 생성
export const getVideoEmbedUrl = (url: string): string | null => {
  const videoInfo = extractVideoId(url);
  if (videoInfo) {
    const platform = VIDEO_PLATFORMS.find(p => p.name === videoInfo.platform);
    return platform ? platform.embedUrl(videoInfo.videoId) : null;
  }
  return null;
};

// 직접 동영상 파일 URL인지 확인
export const isDirectVideoUrl = (url: string): boolean => {
  // 확장자 체크
  const hasVideoExtension = DIRECT_VIDEO_EXTENSIONS.some(ext => 
    url.toLowerCase().includes(ext.toLowerCase())
  );
  
  // 특수 서비스 체크
  const isSpecialService = SPECIAL_VIDEO_SERVICES.some(service => 
    url.includes(service)
  );
  
  return hasVideoExtension || isSpecialService;
};

// 동영상 플랫폼 정보 가져오기
export const getVideoPlatformInfo = (url: string): { platform: string; title: string } | null => {
  const videoInfo = extractVideoId(url);
  if (videoInfo) {
    const platform = VIDEO_PLATFORMS.find(p => p.name === videoInfo.platform);
    if (platform) {
      return {
        platform: platform.name,
        title: platform.name === 'youtube' 
          ? (url.includes('shorts') ? 'YouTube Shorts' : 'YouTube 동영상')
          : platform.name === 'vimeo' 
          ? 'Vimeo 동영상'
          : '동영상'
      };
    }
  }
  
  if (isDirectVideoUrl(url)) {
    // OpenAI Videos 특별 처리
    if (url.includes('videos.openai.com')) {
      return { platform: 'openai', title: 'OpenAI Sora 동영상' };
    }
    return { platform: 'direct', title: '동영상' };
  }
  
  return null;
};

// 동영상 제목 가져오기 (하위 호환성 유지)
export const getVideoTitle = (url: string): string => {
  const platformInfo = getVideoPlatformInfo(url);
  return platformInfo?.title || '동영상';
};

// 동영상 URL 유효성 검사
export const isValidVideoUrl = (url: string): boolean => {
  try {
    new URL(url);
    return extractVideoId(url) !== null || isDirectVideoUrl(url);
  } catch {
    return false;
  }
};
