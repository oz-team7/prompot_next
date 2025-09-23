// 동영상 썸네일 유틸리티 함수
export const getVideoThumbnail = (url: string): string | null => {
  // YouTube URL 처리 (일반 동영상 및 숏츠 지원)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // 일반 YouTube URL 패턴
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }
    
    // YouTube Shorts URL 패턴
    const shortsRegExp = /^.*(youtube\.com\/shorts\/|youtu\.be\/)([^#&?]*).*/;
    const shortsMatch = url.match(shortsRegExp);
    
    if (shortsMatch && shortsMatch[2].length === 11) {
      return `https://img.youtube.com/vi/${shortsMatch[2]}/maxresdefault.jpg`;
    }
  }
  
  // Vimeo URL 처리
  if (url.includes('vimeo.com')) {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    if (match) {
      // Vimeo는 API를 통해 썸네일을 가져와야 하므로 임시로 기본 이미지 사용
      return `https://vumbnail.com/${match[1]}.jpg`;
    }
  }
  
  // 직접 동영상 파일 URL 처리 (MP4, WebM 등)
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi')) {
    // 직접 동영상 파일의 경우 썸네일을 생성할 수 없으므로 null 반환
    // 프론트엔드에서 video 태그를 사용하여 첫 번째 프레임을 썸네일로 사용
    return null;
  }
  
  // OpenAI 동영상 URL 처리
  if (url.includes('videos.openai.com')) {
    // OpenAI 동영상의 경우 썸네일을 생성할 수 없으므로 null 반환
    // 프론트엔드에서 video 태그를 사용하여 첫 번째 프레임을 썸네일로 사용
    return null;
  }
  
  return null;
};

// 대체 썸네일 URL 생성 (maxresdefault 실패 시 사용)
export const getFallbackThumbnail = (url: string): string | null => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    
    const shortsRegExp = /^.*(youtube\.com\/shorts\/|youtu\.be\/)([^#&?]*).*/;
    const shortsMatch = url.match(shortsRegExp);
    
    if (shortsMatch && shortsMatch[2].length === 11) {
      return `https://img.youtube.com/vi/${shortsMatch[2]}/hqdefault.jpg`;
    }
  }
  
  return null;
};

// 직접 동영상 파일 URL인지 확인
export const isDirectVideoUrl = (url: string): boolean => {
  return url.includes('.mp4') || 
         url.includes('.webm') || 
         url.includes('.mov') || 
         url.includes('.avi') ||
         url.includes('videos.openai.com') ||
         url.includes('storage.googleapis.com') ||
         url.includes('amazonaws.com') ||
         url.includes('blob:');
};

// 동영상 제목 가져오기 (선택사항)
export const getVideoTitle = (url: string): string => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('youtube.com/shorts')) {
      return 'YouTube Shorts';
    }
    return 'YouTube 동영상';
  } else if (url.includes('vimeo.com')) {
    return 'Vimeo 동영상';
  } else if (isDirectVideoUrl(url)) {
    return '동영상';
  }
  return '동영상';
};
