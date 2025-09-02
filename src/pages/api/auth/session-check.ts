import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 헤더가 없습니다.' });
    }

    const token = authHeader.substring(7);
    
    const supabase = createSupabaseServiceClient();
    
    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        message: '유효하지 않은 토큰입니다.',
        error: error?.message 
      });
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ 
        message: '사용자 프로필을 찾을 수 없습니다.' 
      });
    }

    res.status(200).json({ 
      ok: true, 
      user: profile,
      message: '세션이 유효합니다.' 
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: '세션 확인 중 오류가 발생했습니다.' });
  }
}
