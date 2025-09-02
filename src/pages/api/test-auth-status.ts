import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Auth status check API called');
  
  const supabase = createSupabaseServiceClient();
  
  try {
    // 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[DEBUG] Session check:', { session: !!session, error: sessionError });
    
    // 사용자 목록 확인 (관리자 권한 필요)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .limit(5);
    
    console.log('[DEBUG] Users check:', { users, error: usersError });
    
    res.status(200).json({
      hasSession: !!session,
      sessionError: sessionError?.message,
      usersCount: users?.length || 0,
      usersError: usersError?.message,
      sampleUsers: users?.slice(0, 3) || []
    });
  } catch (error) {
    console.error('[DEBUG] Auth status error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
