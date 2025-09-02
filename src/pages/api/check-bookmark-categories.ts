import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Check bookmark categories table API called');
  
  const supabase = createSupabaseServiceClient();
  
  try {
    // bookmark_categories 테이블 존재 확인
    const { data: categories, error: categoriesError } = await supabase
      .from('bookmark_categories')
      .select('*')
      .limit(1);
    
    console.log('[DEBUG] Bookmark categories table test:', { categories, error: categoriesError });
    
    // prompt_bookmarks 테이블의 category_id 컬럼 확인
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('id, category_id')
      .limit(1);
    
    console.log('[DEBUG] Prompt bookmarks category_id test:', { bookmarks, error: bookmarksError });
    
    res.status(200).json({
      bookmarkCategoriesExists: !categoriesError,
      bookmarkCategoriesError: categoriesError?.message,
      categoryIdColumnExists: !bookmarksError,
      categoryIdColumnError: bookmarksError?.message,
      sampleCategories: categories,
      sampleBookmarks: bookmarks
    });
  } catch (error) {
    console.error('[DEBUG] Check error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
