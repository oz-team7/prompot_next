import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseServiceClient();
    
    // 토큰 유효성 검사 및 사용자 정보 조회
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.status(401).json({ 
        error: 'Token expired or invalid',
        message: '인증이 만료되었습니다. 다시 로그인해주세요.'
      });
    }

    // 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        error: 'Profile not found',
        message: '사용자 프로필을 찾을 수 없습니다.'
      });
    }

    // 토큰이 유효하고 사용자 정보가 있으면 성공 응답
    res.status(200).json({ 
      success: true,
      user: profile,
      message: '토큰이 유효합니다.'
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: '토큰 검증 중 오류가 발생했습니다.'
    });
  }
}