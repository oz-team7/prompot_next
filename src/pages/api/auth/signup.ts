import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    console.log('회원가입 시도:', { email, name });

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      
      // 이메일 중복 오류 처리
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ 
          success: false,
          message: '이미 사용 중인 이메일입니다.' 
        });
      }
      
      return res.status(500).json({ 
        success: false,
        message: '회원가입에 실패했습니다.',
        error: process.env.NODE_ENV === 'development' ? authError.message : undefined
      });
    }

    if (!authData.user) {
      return res.status(500).json({ 
        success: false,
        message: '사용자 생성에 실패했습니다.' 
      });
    }

    console.log('사용자 생성 성공:', authData.user.id);

    // 사용자 프로필 정보를 users 테이블에 저장
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: name,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // 프로필 생성 실패 시 사용자 삭제
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ 
        success: false,
        message: '프로필 생성에 실패했습니다.',
        error: process.env.NODE_ENV === 'development' ? profileError.message : undefined
      });
    }

    console.log('프로필 생성 성공');

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      },
    });
  } catch (error: any) {
    console.error('Unexpected signup error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}