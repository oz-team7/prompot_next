import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

// API 응답 타입 정의
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 에러 핸들러
const handleError = (res: NextApiResponse, error: any, message: string = '서버 오류가 발생했습니다.') => {
  console.error('API Error:', error);
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : message
  };
  return res.status(500).json(response);
};

// 성공 응답 헬퍼
const sendSuccess = <T>(res: NextApiResponse, data: T, message?: string) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  return res.status(200).json(response);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    const supabase = createSupabaseServiceClient();
    
    // 최근 14일간의 게시물을 대상으로 함
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // 프롬프트 데이터 조회 (최근 14일간, 공개 게시물만)
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        author:profiles!author_id (
          id,
          name
        ),
        created_at,
        views,
        prompt_likes (
          id
        )
      `)
      .eq('is_public', true)
      .gte('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!prompts || prompts.length === 0) {
      return sendSuccess(res, [], '인기 프롬프트가 없습니다.');
    }

    // 북마크 수 조회
    const promptIds = prompts.map(p => p.id);
    const { data: bookmarkCounts, error: bookmarkError } = await supabase
      .from('prompt_bookmarks')
      .select('prompt_id')
      .in('prompt_id', promptIds);

    if (bookmarkError) {
      console.error('Bookmark count error:', bookmarkError);
    }

    // 북마크 수 집계
    const bookmarkCountMap: { [key: number]: number } = {};
    if (bookmarkCounts) {
      bookmarkCounts.forEach(bookmark => {
        bookmarkCountMap[bookmark.prompt_id] = (bookmarkCountMap[bookmark.prompt_id] || 0) + 1;
      });
    }

    // 인기 점수 계산 및 정렬
    const now = new Date().getTime();
    const trendingPrompts = prompts.map(prompt => {
      // 좋아요 수
      const likesCount = prompt.prompt_likes ? prompt.prompt_likes.length : 0;
      
      // 조회수
      const viewsCount = prompt.views || 0;
      
      // 북마크 수
      const bookmarkCount = bookmarkCountMap[prompt.id] || 0;
      
      // 경과 시간 (시간 단위)
      const createdAt = new Date(prompt.created_at).getTime();
      const hoursAgo = (now - createdAt) / (1000 * 60 * 60);
      
      // 시간 가중치 (최신일수록 높은 점수)
      // 24시간 이내: 1.0, 48시간: 0.7, 72시간: 0.5, 그 이상: 점진적 감소
      let timeWeight = 1;
      if (hoursAgo > 24) {
        timeWeight = Math.max(0.3, 1 - (hoursAgo - 24) / 168); // 1주일에 걸쳐 0.3까지 감소
      }
      
      // 인기 점수 계산
      // 좋아요: 3점, 북마크: 2점, 조회수: 0.01점
      const popularityScore = (
        (likesCount * 3) + 
        (bookmarkCount * 2) + 
        (viewsCount * 0.01)
      ) * timeWeight;
      
      return {
        id: prompt.id,
        title: prompt.title,
        author: prompt.author,
        created_at: prompt.created_at,
        views: viewsCount,
        likes_count: likesCount,
        bookmark_count: bookmarkCount,
        popularity_score: popularityScore,
        hours_ago: Math.floor(hoursAgo)
      };
    });

    // 인기 점수로 정렬하고 상위 10개만 반환
    trendingPrompts.sort((a, b) => b.popularity_score - a.popularity_score);
    const top10 = trendingPrompts.slice(0, 10);

    return sendSuccess(res, top10, '인기 프롬프트를 성공적으로 조회했습니다.');

  } catch (error: any) {
    return handleError(res, error, '인기 프롬프트 조회 중 오류가 발생했습니다.');
  }
}