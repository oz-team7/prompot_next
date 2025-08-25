import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    const { promptId } = req.body;

    if (!promptId) {
      return res.status(400).json({ message: '프롬프트 ID가 필요합니다.' });
    }

    // 기존 북마크 확인
    const { data: existingBookmark, error: checkError } = await supabase
      .from('prompt_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('prompt_id', promptId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Bookmark check error:', checkError);
      return res.status(500).json({ message: '북마크 상태를 확인하는 중 오류가 발생했습니다.' });
    }

    if (existingBookmark) {
      // 북마크 제거
      const { error: deleteError } = await supabase
        .from('prompt_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) {
        console.error('Bookmark delete error:', deleteError);
        return res.status(500).json({ message: '북마크 제거 중 오류가 발생했습니다.' });
      }

      res.status(200).json({
        success: true,
        message: '북마크가 제거되었습니다.',
        isBookmarked: false,
      });
    } else {
      // 북마크 추가
      const { error: insertError } = await supabase
        .from('prompt_bookmarks')
        .insert({
          user_id: user.id,
          prompt_id: promptId,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Bookmark insert error:', insertError);
        return res.status(500).json({ message: '북마크 추가 중 오류가 발생했습니다.' });
      }

      res.status(200).json({
        success: true,
        message: '북마크가 추가되었습니다.',
        isBookmarked: true,
      });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ message: '북마크 토글 중 오류가 발생했습니다.' });
  }
}
