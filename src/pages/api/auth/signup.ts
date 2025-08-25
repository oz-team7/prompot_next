import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, getSiteUrl } from '@/lib/supabaseClient';

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

    // 먼저 profiles 테이블에서 이메일 중복 확인
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Profile check error:', profileCheckError);
      return res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.' 
      });
    }

    // 이미 가입된 이메일인 경우
    if (existingProfile) {
      return res.status(400).json({ 
        success: false,
        message: '이미 가입한 계정입니다. 로그인해주세요.',
        errorType: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // 동적으로 사이트 URL 가져오기
    const siteUrl = getSiteUrl();
    const emailRedirectTo = `${siteUrl}/confirm-email?email=${encodeURIComponent(email)}&type=signup`;
    
    console.log('이메일 리다이렉트 URL:', emailRedirectTo);

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: emailRedirectTo,
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      
      // 이메일 중복 오류 처리 (Supabase Auth 레벨)
      if (authError.message.includes('already registered') || 
          authError.message.includes('already exists') ||
          authError.message.includes('already been registered')) {
        return res.status(400).json({ 
          success: false,
          message: '이미 가입한 계정입니다. 로그인해주세요.',
          errorType: 'EMAIL_ALREADY_EXISTS'
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

    // 사용자 프로필 정보를 profiles 테이블에 저장
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: name,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // 프로필 생성 실패 시에도 사용자는 유지 (수동으로 정리 가능)
      console.log('프로필 생성 실패했지만 사용자는 생성됨. 수동 정리가 필요할 수 있습니다.');
      
      // 프로필 생성 실패 시에도 성공으로 응답 (사용자는 생성됨)
      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다! 이메일을 확인해주세요. (프로필 생성에 일시적 문제가 있을 수 있습니다.)',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
        },
        requiresEmailConfirmation: true,
        profileCreationWarning: true,
      });
      return;
    }

    console.log('프로필 생성 성공');

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다! 이메일을 확인해주세요.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      },
      requiresEmailConfirmation: true,
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