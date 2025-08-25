import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.' 
      });
    }

    // Supabase Auth로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ 
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    if (!data.user) {
      return res.status(401).json({ 
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.' 
      });
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ 
        success: false,
        message: '사용자 프로필을 가져올 수 없습니다.' 
      });
    }

    res.status(200).json({
      success: true,
      message: '로그인이 완료되었습니다.',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      },
      session: data.session,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
