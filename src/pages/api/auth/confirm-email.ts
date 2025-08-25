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
    return res.status(400).json({ 
      success: false,
      message: '이메일이 필요합니다.' 
    });
  }

  try {
    console.log('이메일 인증 확인 처리:', { email });

    // Supabase에서 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email);

    if (userError || !user) {
      console.error('사용자 조회 오류:', userError);
      return res.status(404).json({ 
        success: false,
        message: '사용자를 찾을 수 없습니다.' 
      });
    }

    // 이메일 인증 상태 확인
    if (user.email_confirmed_at) {
      console.log('이메일 인증 완료된 사용자:', user.id);
      
      // 자동 로그인을 위한 세션 생성
      const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://prompot-next-epeozctqv-prompots-projects.vercel.app'}/?login_success=true`,
        }
      });

      if (sessionError) {
        console.error('세션 생성 오류:', sessionError);
        return res.status(500).json({ 
          success: false,
          message: '자동 로그인에 실패했습니다.' 
        });
      }

      return res.status(200).json({
        success: true,
        message: '이메일 인증이 완료되었습니다. 자동 로그인을 시도합니다.',
        user: {
          id: user.id,
          email: user.email,
          email_confirmed: true
        }
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: '이메일 인증이 완료되지 않았습니다.' 
      });
    }

  } catch (error: any) {
    console.error('이메일 인증 확인 오류:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
