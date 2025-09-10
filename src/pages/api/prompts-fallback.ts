import type { NextApiRequest, NextApiResponse } from 'next';

// 간단한 목업 데이터 (Supabase 연결 실패 시 대체용)
const mockPrompts = [
  {
    id: 1,
    title: "테스트 프롬프트 1",
    content: "이것은 테스트용 프롬프트입니다.",
    description: "Supabase 연결 실패 시 표시되는 테스트 데이터입니다.",
    category: "work",
    author: {
      id: "test-user-1",
      name: "테스트 사용자",
      email: "test@example.com"
    },
    created_at: new Date().toISOString(),
    date: new Date().toISOString(),
    rating: 4.5,
    likes: 10,
    tags: ["테스트", "목업"],
    aiModel: {
      name: "ChatGPT",
      icon: "/image/icon_chatgpt.png"
    },
    isPublic: true,
    averageRating: 4.5,
    commentCount: 3
  },
  {
    id: 2,
    title: "테스트 프롬프트 2",
    content: "두 번째 테스트 프롬프트입니다.",
    description: "데이터베이스 연결 문제 시 사용되는 대체 데이터입니다.",
    category: "design",
    author: {
      id: "test-user-2",
      name: "테스트 사용자 2",
      email: "test2@example.com"
    },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1일 전
    date: new Date(Date.now() - 86400000).toISOString(),
    rating: 3.8,
    likes: 5,
    tags: ["디자인", "테스트"],
    aiModel: {
      name: "Claude",
      icon: "/image/icon_claude.png"
    },
    isPublic: true,
    averageRating: 3.8,
    commentCount: 1
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('[DEBUG] Fallback API called with query:', req.query);
    
    const { category, sort = 'latest', page = '1', limit = '20' } = req.query;
    
    // 페이지네이션 설정
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;
    
    // 카테고리 필터링
    let filteredPrompts = mockPrompts;
    if (category && category !== 'all') {
      filteredPrompts = mockPrompts.filter(prompt => prompt.category === category);
    }
    
    // 정렬
    switch (sort) {
      case 'latest':
        filteredPrompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'latest-desc':
        filteredPrompts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'popular':
      case 'popular-desc':
        filteredPrompts.sort((a, b) => sort === 'popular' ? a.likes - b.likes : b.likes - a.likes);
        break;
      case 'rating':
      case 'rating-desc':
        filteredPrompts.sort((a, b) => sort === 'rating' ? a.averageRating - b.averageRating : b.averageRating - a.averageRating);
        break;
    }
    
    // 페이지네이션 적용
    const paginatedPrompts = filteredPrompts.slice(offset, offset + limitNum);
    
    const response = {
      success: true,
      data: {
        prompts: paginatedPrompts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredPrompts.length,
          totalPages: Math.ceil(filteredPrompts.length / limitNum),
          hasNext: pageNum < Math.ceil(filteredPrompts.length / limitNum),
          hasPrev: pageNum > 1
        }
      },
      message: 'Fallback API - Mock data returned',
      warning: 'This is mock data. Database connection may be unavailable.'
    };
    
    console.log('[DEBUG] Fallback API response:', {
      promptsCount: paginatedPrompts.length,
      totalCount: filteredPrompts.length,
      page: pageNum
    });
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error('[DEBUG] Fallback API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Fallback API failed'
    });
  }
}
