import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // 모든 사용자 정보 조회
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('[DEBUG] All profiles:', profiles);
    
    // auth.users 테이블도 확인 (가능한 경우)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    res.status(200).json({ 
      profiles,
      authUsers: authUsers?.users || [],
      message: 'User info retrieved successfully'
    });
  } catch (error) {
    console.error('Debug user info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
