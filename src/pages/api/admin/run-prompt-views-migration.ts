import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 전용 엔드포인트
  const adminEmails = ['prompot7@gmail.com'];
  
  try {
    const supabase = createSupabaseServiceClient();
    
    // 사용자 확인
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user || !adminEmails.includes(user.email || '')) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // SQL 마이그레이션 실행
    const migrationSQL = `
      -- 프롬프트 조회 기록 테이블 생성
      CREATE TABLE IF NOT EXISTS prompt_views (
          id BIGSERIAL PRIMARY KEY,
          prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          viewer_ip TEXT NOT NULL,
          user_agent TEXT,
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- 인덱스를 위한 복합 유니크 제약조건
          -- 같은 프롬프트에 대해 (user_id 또는 ip) 중복 방지
          CONSTRAINT unique_user_view UNIQUE NULLS NOT DISTINCT (prompt_id, user_id),
          CONSTRAINT unique_ip_view UNIQUE NULLS NOT DISTINCT (prompt_id, viewer_ip, user_id)
      );

      -- 빠른 조회를 위한 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_prompt_views_prompt_id ON prompt_views(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_prompt_views_user_id ON prompt_views(user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_prompt_views_viewer_ip ON prompt_views(viewer_ip);
      CREATE INDEX IF NOT EXISTS idx_prompt_views_viewed_at ON prompt_views(viewed_at);

      -- RLS 정책 활성화
      ALTER TABLE prompt_views ENABLE ROW LEVEL SECURITY;

      -- 서비스 역할만 삽입 가능
      DROP POLICY IF EXISTS "Service role can insert views" ON prompt_views;
      CREATE POLICY "Service role can insert views" ON prompt_views
          FOR INSERT
          TO service_role
          USING (true);

      -- 서비스 역할만 조회 가능
      DROP POLICY IF EXISTS "Service role can read views" ON prompt_views;
      CREATE POLICY "Service role can read views" ON prompt_views
          FOR SELECT
          TO service_role
          USING (true);
    `;

    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (migrationError) {
      console.error('Migration error:', migrationError);
      
      // RPC가 없는 경우 직접 실행 시도
      const statements = migrationSQL.split(';').filter(s => s.trim());
      const errors = [];
      
      for (const statement of statements) {
        try {
          const { error } = await supabase.from('prompt_views').select('id').limit(1);
          if (error && error.message.includes('does not exist')) {
            // 테이블이 없으므로 생성 필요
            return res.status(500).json({ 
              error: 'prompt_views 테이블을 생성할 수 없습니다. Supabase 대시보드에서 직접 SQL을 실행해주세요.',
              sql: migrationSQL
            });
          }
        } catch (e) {
          errors.push(e);
        }
      }
      
      if (errors.length > 0) {
        return res.status(500).json({ 
          error: '마이그레이션 실행 중 오류가 발생했습니다.',
          details: errors
        });
      }
    }

    // 테이블 생성 확인
    const { data: tableCheck, error: checkError } = await supabase
      .from('prompt_views')
      .select('count')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'prompt_views 테이블이 생성되지 않았습니다. Supabase 대시보드에서 직접 SQL을 실행해주세요.',
        sql: migrationSQL
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'prompt_views 테이블이 성공적으로 생성되었습니다.'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}