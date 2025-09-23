import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-utils';

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
    // 프로덕션 환경에서는 디버그 로그 최소화
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] API /api/prompts called with query:', req.query);
      console.log('[DEBUG] Environment check:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    
    // 옵셔널 인증 확인 (로그인한 사용자의 좋아요/북마크 정보를 위해)
    const authUser = await getAuthUser(req);
    const userId = authUser?.id || null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Authenticated user ID:', userId);
    }

    const supabase = createSupabaseServiceClient();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Supabase client created successfully');
    }
    
    const { category, author, isPublic, sort = 'latest', page = '1', limit = '20' } = req.query;

    // 페이지네이션 설정
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // 최대 100개로 제한
    const offset = (pageNum - 1) * limitNum;

    // 기본 쿼리 시작 (별점 및 댓글 정보 포함)
    let query = supabase
      .from('prompts')
      .select(`
        *,
        author:profiles (
          id,
          name,
          email,
          avatar_url
        ),
        comments:prompt_comments (
          id,
          content,
          created_at,
          user_id
        ),
        ratings:prompt_ratings (
          id,
          rating,
          created_at,
          user_id
        ),
        prompt_likes (
          id,
          user_id
        )
      `)
      .range(offset, offset + limitNum - 1);

    // 카테고리 필터
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 작성자 필터 (author=true인 경우 현재 사용자의 프롬프트만 조회)
    if (author === 'true') {
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: '로그인이 필요합니다.' 
        });
      }
      query = query.eq('author_id', userId);
    } else if (author && author !== 'true') {
      // 특정 사용자 ID로 필터링하는 경우
      query = query.eq('author_id', author);
    }

    // 공개 여부 필터
    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic === 'true');
    }

    // 정렬 설정
    switch (sort) {
      case 'latest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'likes':
        // 좋아요 수는 집계 후 처리
        query = query.order('created_at', { ascending: false }); // 기본 정렬
        break;
      case 'views':
        query = query.order('views', { ascending: false });
        break;
      case 'bookmarks':
        // 북마크 수는 집계 후 처리
        query = query.order('created_at', { ascending: false }); // 기본 정렬
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: true });
        break;
      case 'rating-desc':
        query = query.order('average_rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: prompts, error } = await query;

    if (error) {
      console.error('[ERROR] Supabase query error:', error);
      throw error;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Retrieved prompts count:', prompts?.length || 0);
    }

    if (!prompts) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] No prompts found');
      }
      return sendSuccess(res, [], '프롬프트가 없습니다.');
    }

    // 프롬프트별 북마크 수 계산
    const promptIds = prompts.map(p => p.id);
    const { data: bookmarkCounts } = await supabase
      .from('prompt_bookmarks')
      .select('prompt_id')
      .in('prompt_id', promptIds);

    // 프롬프트별 북마크 수 집계
    const bookmarkCountMap = bookmarkCounts?.reduce((acc: Record<number, number>, bookmark: any) => {
      const promptId = bookmark.prompt_id;
      acc[promptId] = (acc[promptId] || 0) + 1;
      return acc;
    }, {}) || {};

    // 데이터 처리 및 최적화
    const processedPrompts = prompts.map(prompt => {
      // 평점 계산
      const ratings = prompt.ratings || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: any) => sum + rating.rating, 0) / ratings.length 
        : 0;

      // 댓글 수 계산
      const commentCount = prompt.comments ? prompt.comments.length : 0;

      // 북마크 수 계산
      const bookmarkCount = bookmarkCountMap[prompt.id] || 0;

      // 좋아요 수 계산 및 현재 사용자의 좋아요 여부 확인
      const likes = prompt.prompt_likes || [];
      const likesCount = likes.length;
      const isLiked = userId ? likes.some((like: any) => like.user_id === userId) : false;

      return {
        ...prompt,
        averageRating: Math.round(averageRating * 10) / 10, // 소수점 둘째 자리까지
        commentCount,
        bookmarkCount,
        likes_count: likesCount,
        is_liked: isLiked,
        views: prompt.views || 0, // 조회수
        comment_count: commentCount,
        videoUrl: prompt.video_url || null, // video_url을 videoUrl로 변환
        // 클라이언트에서 필요한 데이터만 포함
        comments: undefined, // 댓글 내용은 제거하고 개수만 유지
        ratings: undefined, // 평점 내용은 제거하고 평균만 유지
        prompt_likes: undefined, // 좋아요 상세 정보는 제거
      };
    });

    // 정렬 처리 (좋아요, 북마크는 집계 후 처리)
    if (sort === 'likes') {
      processedPrompts.sort((a, b) => {
        const aLikes = a.likes_count || 0;
        const bLikes = b.likes_count || 0;
        return bLikes - aLikes; // 내림차순
      });
    } else if (sort === 'bookmarks') {
      processedPrompts.sort((a, b) => {
        const aBookmarks = a.bookmarkCount || 0;
        const bBookmarks = b.bookmarkCount || 0;
        return bBookmarks - aBookmarks; // 내림차순
      });
    }

    // 총 개수 조회 (페이지네이션을 위해)
    let countQuery = supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true });

    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }
    if (author === 'true') {
      if (userId) {
        countQuery = countQuery.eq('author_id', userId);
      }
    } else if (author && author !== 'true') {
      countQuery = countQuery.eq('author_id', author);
    }
    if (isPublic !== undefined) {
      countQuery = countQuery.eq('is_public', isPublic === 'true');
    }

    const { count } = await countQuery;

    const response = {
      prompts: processedPrompts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
        hasNext: pageNum < Math.ceil((count || 0) / limitNum),
        hasPrev: pageNum > 1
      }
    };

    return sendSuccess(res, response, '프롬프트 목록을 성공적으로 조회했습니다.');

  } catch (error: any) {
    // 상세한 에러 로깅 (개발 환경에서만)
    console.error('[ERROR] Prompts API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Supabase 관련 오류인지 확인
    if (error.message?.includes('Supabase') || error.message?.includes('environment')) {
      console.error('[ERROR] Supabase/Environment error detected');
    }
    
    // 데이터베이스 관련 오류인지 확인
    if (error.message?.includes('relation') || error.message?.includes('table')) {
      console.error('[ERROR] Database schema error detected');
    }
    
    // 네트워크 관련 오류인지 확인
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      console.error('[ERROR] Network error detected');
    }
    
    return handleError(res, error, '프롬프트 목록을 불러오는데 실패했습니다.');
  }
}