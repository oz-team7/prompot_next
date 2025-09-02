import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Prompt_bookmarks structure check API called');
  
  const supabase = createSupabaseServiceClient();
  
  try {
    // prompt_bookmarks 테이블 구조 확인
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .limit(5);
    
    console.log('[DEBUG] Prompt_bookmarks data:', bookmarks);
    console.log('[DEBUG] Prompt_bookmarks error:', bookmarksError);
    
    // 테이블 스키마 정보 확인 (첫 번째 레코드의 키들)
    const sampleRecord = bookmarks?.[0];
    const columns = sampleRecord ? Object.keys(sampleRecord) : [];
    
    res.status(200).json({
      tableExists: !bookmarksError,
      error: bookmarksError?.message,
      sampleData: bookmarks,
      columns: columns,
      recordCount: bookmarks?.length || 0
    });
  } catch (error) {
    console.error('[DEBUG] Structure check error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
