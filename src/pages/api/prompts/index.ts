import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { category, author, isPublic } = req.query;
    let userId: string | null = null;

    // 인증 토큰 확인 (옵셔널)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!authError && user) {
        userId = user.id;
      }
    }

    let query = supabase
      .from('prompts')
                   .select(`
               *,
               author:profiles(id, name, email),
               likes:prompt_likes(count),
               bookmarks:prompt_bookmarks(count)
             `);

    // 공개 프롬프트만 가져오기 (기본값)
    if (isPublic !== 'false') {
      query = query.eq('is_public', true);
    }

    // 특정 작성자의 프롬프트 (마이페이지용)
    if (author && userId) {
      query = query.eq('author_id', userId);
      // 본인의 프롬프트는 비공개도 볼 수 있음
      query = query.or('is_public.eq.true,author_id.eq.' + userId);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: prompts, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ message: '프롬프트 목록을 가져오는 중 오류가 발생했습니다.' });
    }

    // 사용자의 좋아요/북마크 상태 확인
    let userLikes: string[] = [];
    let userBookmarks: string[] = [];

    if (userId && prompts.length > 0) {
      const promptIds = prompts.map(p => p.id);
      
      // 좋아요 상태 확인
      const { data: likes } = await supabase
        .from('prompt_likes')
        .select('prompt_id')
        .eq('user_id', userId)
        .in('prompt_id', promptIds);

      // 북마크 상태 확인
      const { data: bookmarks } = await supabase
        .from('prompt_bookmarks')
        .select('prompt_id')
        .eq('user_id', userId)
        .in('prompt_id', promptIds);

      userLikes = likes?.map(l => l.prompt_id) || [];
      userBookmarks = bookmarks?.map(b => b.prompt_id) || [];
    }

    const formattedPrompts = prompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags || [],
      aiModel: prompt.ai_model,
      previewImage: prompt.preview_image,
      isPublic: prompt.is_public,
      author: prompt.author?.name || 'Unknown',
      authorId: prompt.author?.id,
      date: new Date(prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
      likes: prompt.likes?.[0]?.count || 0,
      bookmarks: prompt.bookmarks?.[0]?.count || 0,
      isLiked: userLikes.includes(prompt.id),
      isBookmarked: userBookmarks.includes(prompt.id),
      rating: 0, // 평점 기능은 추후 구현
    }));

    res.status(200).json({ prompts: formattedPrompts });
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({ message: '프롬프트 목록을 가져오는 중 오류가 발생했습니다.' });
  }
}