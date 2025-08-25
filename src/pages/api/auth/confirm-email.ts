import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호가 필요합니다.' });
  }

  try {
    // 이메일 확인 상태 확인
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError || !user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 이메일 확인 완료 여부 확인
    if (!user.email_confirmed_at) {
      return res.status(400).json({ message: '이메일 확인이 완료되지 않았습니다.' });
    }

    // 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ 
        success: false,
        message: '로그인에 실패했습니다.',
        error: error.message
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
      .from('profiles')
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
      message: '이메일 확인이 완료되었습니다. 로그인되었습니다.',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      },
      session: data.session,
    });
  } catch (error: any) {
    console.error('Confirm email error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
