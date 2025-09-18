import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // 사용자 기본 정보
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 사용자 활동 통계
    const { count: promptsCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', id);

    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: bookmarksCount } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const stats = {
      prompts: promptsCount || 0,
      likes: likesCount || 0,
      bookmarks: bookmarksCount || 0,
      comments: commentsCount || 0
    };

    // 활동 점수 계산
    const activityScore = (stats.prompts * 5) + 
                         (stats.likes * 1) + 
                         (stats.bookmarks * 2) + 
                         (stats.comments * 3);

    return res.status(200).json({
      user,
      stats,
      activityScore
    });
  } catch (error) {
    console.error('User stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}