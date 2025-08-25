import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password, access_token } = req.body;

  if (!password || !access_token) {
    return res.status(400).json({ message: '새 비밀번호와 액세스 토큰이 필요합니다.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '비밀번호는 최소 6자 이상이어야 합니다.' });
  }

  try {
    console.log('비밀번호 업데이트 시도');

    // Supabase를 통해 새 비밀번호 설정
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Password update error:', error);
      return res.status(500).json({ 
        success: false,
        message: '비밀번호 업데이트에 실패했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (!data.user) {
      return res.status(500).json({ 
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.' 
      });
    }

    console.log('비밀번호 업데이트 성공');

    res.status(200).json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error: any) {
    console.error('Unexpected password update error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
