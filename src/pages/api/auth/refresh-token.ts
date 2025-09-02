import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 사용자 정보 확인
    const supabase = createSupabaseServiceClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다.' });
    }

    res.status(200).json({ 
      ok: true, 
      user,
      message: '토큰이 유효합니다.' 
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: '토큰 갱신에 실패했습니다.' });
  }
}
