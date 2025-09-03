import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServiceClient();

    // 테이블 구조 확인
    console.log('[DEBUG] Checking database tables...');

    // prompt_bookmarks 테이블 확인
    const { data: bookmarksTable, error: bookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .limit(1);

    console.log('[DEBUG] prompt_bookmarks table check:', { bookmarksTable, bookmarksError });

    // prompts 테이블 확인
    const { data: promptsTable, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .limit(1);

    console.log('[DEBUG] prompts table check:', { promptsTable, promptsError });

    // profiles 테이블 확인
    const { data: profilesTable, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    console.log('[DEBUG] profiles table check:', { profilesTable, profilesError });

    res.status(200).json({
      message: 'Database connection test',
      tables: {
        prompt_bookmarks: {
          exists: !bookmarksError,
          error: bookmarksError?.message,
          sample: bookmarksTable?.[0]
        },
        prompts: {
          exists: !promptsError,
          error: promptsError?.message,
          sample: promptsTable?.[0]
        },
        profiles: {
          exists: !profilesError,
          error: profilesError?.message,
          sample: profilesTable?.[0]
        }
      }
    });
  } catch (error) {
    console.error('[DEBUG] Database check error:', error);
    res.status(500).json({ 
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
