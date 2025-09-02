import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] User bookmarks check API called');
  
  const userId = await getUserIdFromRequest(req);
  console.log('[DEBUG] Current user ID:', userId);
  
  if (!userId) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const supabase = createSupabaseServiceClient();
  
  try {
    // 현재 사용자의 북마크 확인
    const { data: userBookmarks, error: bookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .eq('user_id', userId);
    
    console.log('[DEBUG] User bookmarks:', userBookmarks);
    console.log('[DEBUG] Bookmarks error:', bookmarksError);
    
    // 전체 북마크 데이터 확인
    const { data: allBookmarks, error: allBookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .limit(10);
    
    console.log('[DEBUG] All bookmarks:', allBookmarks);
    console.log('[DEBUG] All bookmarks error:', allBookmarksError);
    
    // 사용자 프로필 확인
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('[DEBUG] User profile:', userProfile);
    console.log('[DEBUG] Profile error:', profileError);
    
    res.status(200).json({
      userId: userId,
      userBookmarks: userBookmarks || [],
      userBookmarksCount: userBookmarks?.length || 0,
      userBookmarksError: bookmarksError?.message,
      allBookmarks: allBookmarks || [],
      allBookmarksCount: allBookmarks?.length || 0,
      allBookmarksError: allBookmarksError?.message,
      userProfile: userProfile,
      profileError: profileError?.message
    });
  } catch (error) {
    console.error('[DEBUG] User bookmarks check error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
