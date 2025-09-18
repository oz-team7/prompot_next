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

  const { authorId } = req.query;

  if (!authorId || typeof authorId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: '작성자 ID가 필요합니다.' 
    });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // 작성자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authorId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        success: false, 
        error: '작성자를 찾을 수 없습니다.' 
      });
    }

    // 작성자의 프롬프트 통계 조회
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        views,
        prompt_likes (
          id
        )
      `)
      .eq('author_id', authorId)
      .eq('is_public', true);

    if (promptsError) {
      console.error('Error fetching prompts stats:', promptsError);
    }

    // 통계 계산
    const promptCount = prompts?.length || 0;
    const totalViews = prompts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
    const totalLikes = prompts?.reduce((sum, p) => sum + (p.prompt_likes?.length || 0), 0) || 0;

    // 북마크 수 조회
    let totalBookmarks = 0;
    if (prompts && prompts.length > 0) {
      const promptIds = prompts.map(p => p.id);
      const { data: bookmarks, error: bookmarkError } = await supabase
        .from('prompt_bookmarks')
        .select('id')
        .in('prompt_id', promptIds);
      
      if (!bookmarkError && bookmarks) {
        totalBookmarks = bookmarks.length;
      }
    }

    // 작성자 정보와 통계를 합쳐서 반환
    const authorData = {
      id: profile.id,
      name: profile.name || '익명',
      email: profile.email,
      avatar_url: profile.avatar_url,
      bio: profile.bio || null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      prompt_count: promptCount,
      total_likes: totalLikes,
      total_views: totalViews,
      total_bookmarks: totalBookmarks,
    };

    return sendSuccess(res, authorData, '작성자 정보를 성공적으로 조회했습니다.');

  } catch (error: any) {
    return handleError(res, error, '작성자 정보 조회 중 오류가 발생했습니다.');
  }
}