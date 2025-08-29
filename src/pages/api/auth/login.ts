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

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 에러 타입에 따라 적절한 메시지 반환
      if (error.message.includes('Invalid login credentials')) {
        // 먼저 이메일이 존재하는지 확인
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        if (!profile) {
          return res.status(401).json({ message: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' });
        } else {
          return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
        }
      }
      
      return res.status(401).json({ message: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ message: '로그인에 실패했습니다.' });
    }

    // 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ message: '사용자 정보를 가져올 수 없습니다.' });
    }

    // 클라이언트에 토큰과 사용자 정보 전달
    res.status(200).json({
      ok: true,
      token: data.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}