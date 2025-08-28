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

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth로 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (authError) {
      // 이메일 중복 체크
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
      }
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ message: '회원가입에 실패했습니다.' });
    }

    // profiles 테이블에 사용자 정보 추가
    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
        }
      ])
      .select()
      .single();

    if (createError || !profile) {
      // Auth에서 사용자 삭제 (롤백)
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw createError || new Error('프로필 생성 실패');
    }

    // 자동 로그인을 위해 세션 생성
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return res.status(201).json({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
        },
        message: '회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 로그인해주세요.'
      });
    }

    // 세션 토큰을 쿠키에 저장
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('auth-token', sessionData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/',
      })
    );

    res.status(201).json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}