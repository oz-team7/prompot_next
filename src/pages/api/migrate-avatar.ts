import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // profiles 테이블에 avatar_url 컬럼 추가
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    });
    
    if (alterError) {
      console.error('Alter table error:', alterError);
      return res.status(500).json({
        ok: false,
        error: 'ALTER_ERROR',
        message: alterError.message
      });
    }

    // 프로필 업데이트 정책 추가
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
      `
    });

    if (policyError) {
      console.error('Policy creation error:', policyError);
      // 정책이 이미 존재할 수 있으므로 에러를 무시
    }

    // 현재 profiles 테이블 구조 확인
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('Profiles check error:', profilesError);
      return res.status(500).json({
        ok: false,
        error: 'PROFILES_CHECK_ERROR',
        message: profilesError.message
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Database migration completed successfully',
      profiles: profiles
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
