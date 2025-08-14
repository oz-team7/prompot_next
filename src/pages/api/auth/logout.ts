import type { NextApiRequest, NextApiResponse } from 'next';
import * as cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 쿠키 삭제
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })
  );

  res.status(200).json({ message: '로그아웃되었습니다.' });
}