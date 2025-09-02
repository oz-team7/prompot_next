import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const supabase = createSupabaseServiceClient();
    
    // 사용자 프로필 정보 가져오기 (avatar_url 포함)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ message: '프로필 정보를 가져오는데 실패했습니다.' });
    }

    // 현재 AuthContext에서 사용하는 사용자 정보 형식으로 반환
    const userInfo = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
    };

    res.status(200).json({ 
      user: userInfo,
      profile: profile,
      message: '현재 사용자 정보입니다.'
    });
  } catch (error) {
    console.error('Current user info error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
