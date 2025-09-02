import { Prompt } from '@/types/prompt';

export const mockPrompts: Prompt[] = [
  {
    id: 1,
    title: '고객 응대 매뉴얼 작성',
    author: {
      id: '1',
      name: '이안녕',
      email: 'lee@example.com'
    },
    date: '2025.01.13',
    description: '자영업자를 위한 실용적인 매뉴얼...',
    tags: ['#자영업', '#고객응대'],
    rating: 0.0,
    likes: 120,
    isLiked: true,
    category: 'work',
    previewImage: 'https://picsum.photos/400/300?random=1',
    aiModel: {
      name: 'ChatGPT',
      icon: '/image/icon_chatgpt.png'
    }
  },
  {
    id: 2,
    title: '소설 플롯 생성기',
    author: {
      id: '2',
      name: '홍안녕',
      email: 'hong@example.com'
    },
    date: '2025.07.18',
    description: '장르별 맞춤 플롯 자동 생성...',
    tags: ['#소설', '#창작'],
    rating: 0.0,
    likes: 30,
    isLiked: false,
    category: 'edu',
    previewImage: 'https://picsum.photos/400/300?random=2',
    aiModel: {
      name: 'Claude',
      icon: '/image/icon_claude.png'
    }
  },
  {
    id: 3,
    title: '강의 노트 자동 정리',
    author: {
      id: '3',
      name: '김안녕',
      email: 'kim@example.com'
    },
    date: '2025.05.24',
    description: '강의 내용을 체계적으로 정리...',
    tags: ['#학습', '#노트'],
    rating: 0.0,
    likes: 344,
    isLiked: false,
    category: 'edu',
    previewImage: 'https://picsum.photos/400/300?random=3',
    aiModel: {
      name: 'Gemini',
      icon: '/image/icon_gemini.png'
    }
  },
  {
    id: 4,
    title: '코스메틱 광고 이미지',
    author: {
      id: '4',
      name: '박안녕',
      email: 'park@example.com'
    },
    date: '2025.07.18',
    description: '고급스러운 제품 광고 이미지...',
    tags: ['#광고', '#이미지'],
    rating: 0.0,
    likes: 15,
    isLiked: false,
    category: 'image',
    previewImage: 'https://picsum.photos/400/300?random=4',
    aiModel: {
      name: 'Midjourney',
      icon: '/image/icon_midjourney.png'
    }
  },
  {
    id: 5,
    title: '자동 코드 리뷰어',
    author: {
      id: '5',
      name: '황안녕',
      email: 'hwang@example.com'
    },
    date: '2025.02.27',
    description: '코드 품질 자동 분석 및 개선...',
    tags: ['#개발', '#리뷰'],
    rating: 0.0,
    likes: 157,
    isLiked: true,
    category: 'dev',
    previewImage: 'https://picsum.photos/400/300?random=5',
    aiModel: {
      name: 'Cursor',
      icon: '/image/icon_cursor-ai.png'
    }
  },
  {
    id: 6,
    title: '피규어 스타일 이미지',
    author: {
      id: '6',
      name: '정안녕',
      email: 'jung@example.com'
    },
    date: '2025.07.14',
    description: '캐릭터 피규어 스타일 생성...',
    tags: ['#피규어', '#이미지'],
    rating: 0.0,
    likes: 5,
    isLiked: false,
    category: 'image',
    previewImage: 'https://picsum.photos/400/300?random=6',
    aiModel: {
      name: 'DALL·E 3',
      icon: '/image/icon_dall_e_3.png'
    }
  }
];