import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Test bookmark add API called');
  
  const userId = await getUserIdFromRequest(req);
  console.log('[DEBUG] Current user ID:', userId);
  
  if (!userId) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const supabase = createSupabaseServiceClient();
  
  try {
    // 테스트용 프롬프트 ID (실제 존재하는 프롬프트)
    const testPromptId = '1976139f-a316-42f4-bbca-c165b55a29fc';
    
    // 기존 북마크 확인
    const { data: existingBookmark, error: existingError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('prompt_id', testPromptId)
      .single();
    
    console.log('[DEBUG] Existing bookmark:', existingBookmark);
    console.log('[DEBUG] Existing error:', existingError);
    
    if (existingBookmark) {
      // 이미 북마크된 경우 삭제
      const { error: deleteError } = await supabase
        .from('prompt_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);
      
      console.log('[DEBUG] Delete result:', { error: deleteError });
      
      res.status(200).json({
        action: 'deleted',
        bookmarkId: existingBookmark.id,
        error: deleteError?.message
      });
    } else {
      // 북마크 추가
      const { data: newBookmark, error: insertError } = await supabase
        .from('prompt_bookmarks')
        .insert({
          user_id: userId,
          prompt_id: testPromptId,
        })
        .select()
        .single();
      
      console.log('[DEBUG] Insert result:', { newBookmark, error: insertError });
      
      res.status(200).json({
        action: 'added',
        bookmark: newBookmark,
        error: insertError?.message
      });
    }
  } catch (error) {
    console.error('[DEBUG] Test bookmark error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
