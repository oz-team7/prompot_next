import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Run migration API called');
  
  const supabase = createSupabaseServiceClient();
  
  try {
    // 북마크 카테고리 테이블 생성
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bookmark_categories (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, name)
        );
      `
    });
    
    if (createTableError) {
      console.error('[DEBUG] Create table error:', createTableError);
    }
    
    // prompt_bookmarks에 category_id 컬럼 추가
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE prompt_bookmarks 
        ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES bookmark_categories(id) ON DELETE SET NULL;
      `
    });
    
    if (addColumnError) {
      console.error('[DEBUG] Add column error:', addColumnError);
    }
    
    // 인덱스 생성
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_bookmark_categories_user_id ON bookmark_categories(user_id);
        CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_category_id ON prompt_bookmarks(category_id);
      `
    });
    
    if (indexError) {
      console.error('[DEBUG] Index error:', indexError);
    }
    
    // RLS 활성화
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE bookmark_categories ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.error('[DEBUG] RLS error:', rlsError);
    }
    
    // 정책 생성
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can view their own bookmark categories" ON bookmark_categories
          FOR SELECT USING (auth.uid()::text = user_id::text);
        
        CREATE POLICY IF NOT EXISTS "Users can manage their own bookmark categories" ON bookmark_categories
          FOR ALL USING (auth.uid()::text = user_id::text);
      `
    });
    
    if (policyError) {
      console.error('[DEBUG] Policy error:', policyError);
    }
    
    res.status(200).json({ 
      message: 'Migration completed',
      errors: {
        createTable: createTableError?.message,
        addColumn: addColumnError?.message,
        index: indexError?.message,
        rls: rlsError?.message,
        policy: policyError?.message
      }
    });
  } catch (error) {
    console.error('[DEBUG] Migration error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
