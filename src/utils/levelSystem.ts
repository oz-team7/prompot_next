// 레벨 시스템 유틸리티

interface LevelInfo {
  level: number;
  currentScore: number;
  currentLevelMinScore: number;
  nextLevelScore: number;
  progress: number; // 0-100%
  title: string;
}

// 레벨업 난이도 곡선 (지수함수 사용)
// 레벨 1: 0점
// 레벨 2: 200점
// 레벨 3: 500점
// 레벨 4: 900점
// ... 점진적으로 어려워짐
// 레벨 100: 매우 높은 점수 필요
export const getLevelRequiredScore = (level: number): number => {
  if (level <= 1) return 0;
  if (level === 2) return 200;
  if (level === 3) return 500;
  if (level === 4) return 900;
  if (level === 5) return 1400;
  
  // 레벨 6부터는 지수 함수로 계산 (점차 어려워짐)
  // 기본 공식: baseScore * (1.15 ^ (level - 5)) + previousTotal
  const baseIncrement = 500;
  let totalScore = 1400; // 레벨 5까지의 누적 점수
  
  for (let i = 6; i <= level; i++) {
    const increment = Math.floor(baseIncrement * Math.pow(1.15, i - 5));
    totalScore += increment;
  }
  
  return Math.floor(totalScore);
};

// 활동 점수로 레벨 정보 계산
export const calculateLevel = (activityScore: number): LevelInfo => {
  let level = 1;
  
  // 최대 레벨은 100
  for (let i = 1; i <= 100; i++) {
    if (activityScore >= getLevelRequiredScore(i)) {
      level = i;
    } else {
      break;
    }
  }
  
  const currentLevelMinScore = getLevelRequiredScore(level);
  const nextLevelScore = level < 100 ? getLevelRequiredScore(level + 1) : currentLevelMinScore;
  const scoreInCurrentLevel = activityScore - currentLevelMinScore;
  const scoreNeededForNextLevel = nextLevelScore - currentLevelMinScore;
  const progress = level < 100 
    ? Math.floor((scoreInCurrentLevel / scoreNeededForNextLevel) * 100)
    : 100;
  
  return {
    level,
    currentScore: activityScore,
    currentLevelMinScore,
    nextLevelScore,
    progress,
    title: getLevelTitle(level)
  };
};

// 레벨별 타이틀
export const getLevelTitle = (level: number): string => {
  if (level >= 100) return '🌟 전설의 프롬프터';
  if (level >= 90) return '🔥 프롬프트 마스터';
  if (level >= 80) return '💎 다이아몬드';
  if (level >= 70) return '🏆 플래티넘';
  if (level >= 60) return '🥇 골드';
  if (level >= 50) return '🥈 실버';
  if (level >= 40) return '🥉 브론즈';
  if (level >= 30) return '⭐ 숙련자';
  if (level >= 20) return '🌱 성장하는 프롬프터';
  if (level >= 10) return '🔰 초보 프롬프터';
  if (level >= 5) return '🌿 새싹';
  return '🥚 입문자';
};

// 레벨에 따른 색상 클래스
export const getLevelColorClass = (level: number): string => {
  if (level >= 100) return 'text-purple-600 bg-purple-100';
  if (level >= 90) return 'text-red-600 bg-red-100';
  if (level >= 80) return 'text-cyan-600 bg-cyan-100';
  if (level >= 70) return 'text-indigo-600 bg-indigo-100';
  if (level >= 60) return 'text-yellow-600 bg-yellow-100';
  if (level >= 50) return 'text-gray-600 bg-gray-100';
  if (level >= 40) return 'text-orange-600 bg-orange-100';
  if (level >= 30) return 'text-blue-600 bg-blue-100';
  if (level >= 20) return 'text-green-600 bg-green-100';
  if (level >= 10) return 'text-teal-600 bg-teal-100';
  return 'text-gray-500 bg-gray-100';
};

// 활동 점수 계산 (서버와 동일한 로직)
export const calculateActivityScore = (stats: {
  prompts: number;
  likes: number;
  bookmarks: number;
  comments: number;
}): number => {
  return (stats.prompts * 5) + 
         (stats.likes * 1) + 
         (stats.bookmarks * 2) + 
         (stats.comments * 3);
};