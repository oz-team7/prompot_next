import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 옵셔널 인증 확인 (로그인한 사용자의 좋아요/북마크 정보를 위해)
  const authUser = await getAuthUser(req);
  const userId = authUser?.id || null;

  try {
    const supabase = createSupabaseServiceClient();
    const { category, author, isPublic, sort = 'latest' } = req.query;

    // 기본 쿼리 시작 (별점 정보 포함)
    let query = supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!author_id (
          id,
          name,
          email
        ),
        ratings:prompt_ratings!prompt_id (
          rating
        )
      `);

    // 공개 프롬프트만 가져오기 (기본값)
    if (isPublic !== 'false') {
      query = query.eq('is_public', true);
    }

    // 특정 작성자의 프롬프트 (마이페이지용)
    if (author && userId) {
      query = query.eq('author_id', userId);
      // 본인의 프롬프트는 비공개도 모두 보여주기 위해 is_public 필터 제거
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: prompts, error } = await query;

    if (error) {
      throw error;
    }

    // 별점 계산 및 정렬
    const promptsWithRatings = prompts?.map(prompt => {
      const ratings = prompt.ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings 
        : 0;

      return {
        ...prompt,
        averageRating: Number(averageRating.toFixed(1)),
        totalRatings
      };
    }) || [];

    // 정렬 적용
    let sortedPrompts = [...promptsWithRatings];
    switch (sort) {
      case 'popular':
        // 인기순: 평균 별점 높은 순, 평가 수 많은 순, 최신순
        sortedPrompts.sort((a, b) => {
          if (a.averageRating !== b.averageRating) {
            return b.averageRating - a.averageRating;
          }
          if (a.totalRatings !== b.totalRatings) {
            return b.totalRatings - a.totalRatings;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
      case 'latest':
      default:
        // 최신순 (기본값)
        sortedPrompts.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    const formattedPrompts = sortedPrompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
      aiModel: prompt.ai_model,
      previewImage: prompt.preview_image,
      isPublic: prompt.is_public,
      author: prompt.author.name,
      authorId: prompt.author.id,
      date: new Date(prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
      likes: 0, // likes 테이블이 없으므로 임시로 0
      bookmarks: 0, // bookmarks 테이블이 없으므로 임시로 0
      isLiked: false,
      isBookmarked: false,
      rating: prompt.averageRating,
      totalRatings: prompt.totalRatings,
    }));

    res.status(200).json({ prompts: formattedPrompts });
  } catch (error: any) {
    console.error('Get prompts error:', error);
    res.status(500).json({ 
      message: '프롬프트 목록을 가져오는 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}