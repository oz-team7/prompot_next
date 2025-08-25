import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: '이메일을 입력해주세요.' });
  }

  try {
    console.log('비밀번호 재설정 요청:', { email });

    // Supabase 비밀번호 재설정 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/confirm-email?email=${encodeURIComponent(email)}&type=recovery`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ 
        success: false,
        message: '비밀번호 재설정 이메일 발송에 실패했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log('비밀번호 재설정 이메일 발송 성공');

    res.status(200).json({
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.',
    });
  } catch (error: any) {
    console.error('Unexpected password reset error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
