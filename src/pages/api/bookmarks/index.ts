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
    // Supabase Auth로 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 사용자의 북마크 목록 가져오기
    const { data: bookmarks, error } = await supabase
      .from('prompt_bookmarks')
      .select(`
        *,
        prompt:prompts(
          id,
          title,
          description,
          content,
          category,
          tags,
          ai_model,
          preview_image,
          is_public,
          author_id,
          created_at,
          updated_at,
                           author:profiles(id, name, email)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ message: '북마크 목록을 가져오는 중 오류가 발생했습니다.' });
    }

    // 응답 데이터 구성
    const formattedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.id,
      promptId: bookmark.prompt_id,
      userId: bookmark.user_id,
      createdAt: bookmark.created_at,
      prompt: bookmark.prompt ? {
        id: bookmark.prompt.id,
        title: bookmark.prompt.title,
        description: bookmark.prompt.description,
        content: bookmark.prompt.content,
        category: bookmark.prompt.category,
        tags: bookmark.prompt.tags || [],
        aiModel: bookmark.prompt.ai_model,
        previewImage: bookmark.prompt.preview_image,
        isPublic: bookmark.prompt.is_public,
        authorId: bookmark.prompt.author_id,
        createdAt: bookmark.prompt.created_at,
        updatedAt: bookmark.prompt.updated_at,
        author: bookmark.prompt.author?.name || 'Unknown',
        date: new Date(bookmark.prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
        rating: 0,
        likes: 0,
        bookmarks: 0,
      } : null,
    }));

    res.status(200).json({
      bookmarks: formattedBookmarks,
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: '북마크 목록을 가져오는 중 오류가 발생했습니다.' });
  }
}
