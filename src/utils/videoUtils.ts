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
  
  return null;
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
  }
  return '동영상';
};
