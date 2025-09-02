import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Database schema check API called');
  
  const supabase = createSupabaseServiceClient();
  
  try {
    // 모든 테이블 목록 확인
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('[DEBUG] All tables:', tables);
    
    // bookmarks 관련 테이블 확인
    const { data: bookmarksTable, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(1);
    
    console.log('[DEBUG] Bookmarks table test:', { bookmarksTable, error: bookmarksError });
    
    // prompt_bookmarks 테이블 확인 (힌트에서 제안된 테이블)
    const { data: promptBookmarksTable, error: promptBookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .limit(1);
    
    console.log('[DEBUG] Prompt_bookmarks table test:', { promptBookmarksTable, error: promptBookmarksError });
    
    // profiles 테이블 확인
    const { data: profilesTable, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    console.log('[DEBUG] Profiles table test:', { profilesTable, error: profilesError });
    
    res.status(200).json({
      allTables: tables?.map(t => t.table_name) || [],
      tablesError: tablesError?.message,
      bookmarksExists: !bookmarksError,
      bookmarksError: bookmarksError?.message,
      promptBookmarksExists: !promptBookmarksError,
      promptBookmarksError: promptBookmarksError?.message,
      profilesExists: !profilesError,
      profilesError: profilesError?.message
    });
  } catch (error) {
    console.error('[DEBUG] Schema check error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
