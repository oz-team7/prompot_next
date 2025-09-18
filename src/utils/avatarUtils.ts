// 기본 아바타 유틸리티

// 사용자 ID를 기반으로 고정된 기본 아바타 반환
export const getDefaultAvatar = (userId?: string): string => {
  // DiceBear API를 사용한 귀여운 아바타 생성
  // adventurer-neutral: 귀엽고 중성적인 캐릭터
  // identicon: 기하학적 패턴
  // bottts: 로봇 캐릭터
  // avataaars: 사람 캐릭터
  // fun-emoji: 재미있는 이모지
  
  // 사용자 ID가 있으면 해당 ID로 고정된 아바타 생성
  const seed = userId || 'default';
  
  // 여러 스타일 중에서 사용자별로 하나를 선택
  const styles = ['adventurer-neutral', 'bottts', 'fun-emoji', 'avataaars'];
  const styleIndex = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % styles.length;
  const selectedStyle = styles[styleIndex];
  
  // DiceBear API URL (version 7.x)
  return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=fef3c7,fde68a,fbbf24,f59e0b&backgroundType=gradientLinear`;
};

// 프로필 이미지가 있는지 확인하고 없으면 기본 아바타 반환
export const getAvatarUrl = (avatarUrl?: string | null, userId?: string): string => {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  return getDefaultAvatar(userId);
};