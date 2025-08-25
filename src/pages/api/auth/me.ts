import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Supabase 세션에서 사용자 정보 가져오기
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ message: '사용자 프로필을 가져올 수 없습니다.' });
    }

    res.status(200).json({ 
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}