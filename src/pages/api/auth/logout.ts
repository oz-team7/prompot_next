import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import * as cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth에서 로그아웃
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase logout error:', error);
    }

    // 쿠키 삭제
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      })
    );

    res.status(200).json({ message: '로그아웃되었습니다.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
  }
}