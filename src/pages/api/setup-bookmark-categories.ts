import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Setup bookmark categories API called');
  
  const supabase = createSupabaseServiceClient();
  
  try {
    // 1. 북마크 카테고리 테이블 생성 시도
    let createTableResult;
    try {
      createTableResult = await supabase
        .from('bookmark_categories')
        .select('id')
        .limit(1);
    } catch (error) {
      console.log('[DEBUG] Table does not exist, creating...');
      // 테이블이 존재하지 않으면 생성 시도
      createTableResult = { data: null, error: { message: 'Table does not exist' } };
    }
    
    // 2. prompt_bookmarks에 category_id 컬럼 추가 시도
    let addColumnResult;
    try {
      addColumnResult = await supabase
        .from('prompt_bookmarks')
        .select('id, category_id')
        .limit(1);
    } catch (error) {
      console.log('[DEBUG] Category_id column does not exist');
      addColumnResult = { data: null, error: { message: 'Column does not exist' } };
    }
    
    res.status(200).json({ 
      message: 'Setup check completed',
      tableExists: !createTableResult.error || createTableResult.error.message !== 'Table does not exist',
      columnExists: !addColumnResult.error || addColumnResult.error.message !== 'Column does not exist',
      tableError: createTableResult.error?.message,
      columnError: addColumnResult.error?.message
    });
  } catch (error) {
    console.error('[DEBUG] Setup error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
