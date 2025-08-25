import type { NextApiRequest, NextApiResponse } from 'next';

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

    // 이메일 인증 확인은 클라이언트 측에서 처리
    // 이 API는 단순히 성공 응답만 반환
    return res.status(200).json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      user: {
        email: email,
        email_confirmed: true
      }
    });

  } catch (error: any) {
    console.error('이메일 인증 확인 오류:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
