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
    // 옵셔널 인증 확인 (로그인한 사용자의 좋아요/북마크 정보를 위해)
    const authUser = await getAuthUser(req);
    const userId = authUser?.id || null;

    const supabase = createSupabaseServiceClient();
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
        author:profiles!author_id (
          id,
          name,
          email
        ),
        aiModel:ai_models (
          id,
          name,
          icon
        ),
        comments:comments (
          id,
          content,
          created_at,
          author_name
        ),
        ratings:ratings (
          id,
          rating,
          created_at,
          author_name
        )
      `)
      .eq('is_deleted', false)
      .range(offset, offset + limitNum - 1);

    // 카테고리 필터
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 작성자 필터
    if (author) {
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
      case 'latest-desc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popular':
        // 댓글 수 기준으로 정렬 (오름차순)
        query = query.order('created_at', { ascending: false }); // 기본 정렬
        break;
      case 'popular-desc':
        // 댓글 수 기준으로 정렬 (내림차순)
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
      throw error;
    }

    if (!prompts) {
      return sendSuccess(res, [], '프롬프트가 없습니다.');
    }

    // 데이터 처리 및 최적화
    const processedPrompts = prompts.map(prompt => {
      // 평점 계산
      const ratings = prompt.ratings || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: any) => sum + rating.rating, 0) / ratings.length 
        : 0;

      // 댓글 수 계산
      const commentCount = prompt.comments ? prompt.comments.length : 0;

      return {
        ...prompt,
        averageRating: Math.round(averageRating * 10) / 10, // 소수점 둘째 자리까지
        commentCount,
        // 클라이언트에서 필요한 데이터만 포함
        comments: undefined, // 댓글 내용은 제거하고 개수만 유지
        ratings: undefined, // 평점 내용은 제거하고 평균만 유지
      };
    });

    // 인기순 정렬을 위한 추가 처리
    if (sort === 'popular' || sort === 'popular-desc') {
      processedPrompts.sort((a, b) => {
        const aComments = a.commentCount || 0;
        const bComments = b.commentCount || 0;
        return sort === 'popular' ? aComments - bComments : bComments - aComments;
      });
    }

    // 총 개수 조회 (페이지네이션을 위해)
    let countQuery = supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }
    if (author) {
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
    return handleError(res, error, '프롬프트 목록을 불러오는데 실패했습니다.');
  }
}