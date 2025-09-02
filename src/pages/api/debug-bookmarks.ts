import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const supabase = createSupabaseServiceClient();

  try {
    // 북마크 테이블 구조 확인
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    // 프롬프트 테이블 구조 확인
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .limit(5);

    // 프로필 테이블 구조 확인
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    res.status(200).json({
      userId,
      bookmarks: {
        data: bookmarks,
        error: bookmarksError?.message,
        count: bookmarks?.length || 0
      },
      prompts: {
        data: prompts,
        error: promptsError?.message,
        count: prompts?.length || 0
      },
      profiles: {
        data: profiles,
        error: profilesError?.message,
        count: profiles?.length || 0
      }
    });
  } catch (error) {
    console.error('Debug bookmarks error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
