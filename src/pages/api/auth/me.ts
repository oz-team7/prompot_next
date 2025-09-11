import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import * as cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // 개발 모드에서 테스트 사용자 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: No token, returning current user');
      return res.status(200).json({
        user: {
          id: '7b03565d-b472-477c-9321-75bb442ae60e',
          email: 'prompot@gmail.com',
          name: 'prompot',
          avatar_url: 'https://tlytjitkokavfhwzedml.supabase.co/storage/v1/object/public/avatars/7b03565d-b472-477c-9321-75bb442ae60e/1756788385475.jpg'
        }
      });
    }
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth로 토큰 검증
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      // 개발 모드에서 테스트 사용자 반환
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Auth failed, returning current user');
        return res.status(200).json({
          user: {
            id: '7b03565d-b472-477c-9321-75bb442ae60e',
            email: 'prompot@gmail.com',
            name: 'prompot',
            avatar_url: 'https://tlytjitkokavfhwzedml.supabase.co/storage/v1/object/public/avatars/7b03565d-b472-477c-9321-75bb442ae60e/1756788385475.jpg'
          }
        });
      }
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    console.log('Auth successful, user ID:', authUser.id); // 디버깅 로그 추가

    // 프로필 정보 가져오기
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url')
      .eq('id', authUser.id)
      .single();

    if (error || !profile) {
      console.log('Profile not found for user:', authUser.id); // 디버깅 로그 추가
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    console.log('Profile found:', profile); // 디버깅 로그 추가
    console.log('[DEBUG] API /auth/me - Returning user email:', profile.email);
    res.status(200).json({ user: profile });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}