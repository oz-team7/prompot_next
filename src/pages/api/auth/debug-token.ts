import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth-helper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: '토큰이 필요합니다.' });
    }

    console.log('[DEBUG] Received token:', token.substring(0, 20) + '...');
    
    const result = await verifyToken(token);
    
    if (!result) {
      return res.status(401).json({ 
        message: '토큰 검증 실패',
        tokenPreview: token.substring(0, 20) + '...'
      });
    }

    res.status(200).json({ 
      ok: true, 
      user: result.user,
      message: '토큰 검증 성공',
      tokenPreview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('Debug token error:', error);
    res.status(500).json({ 
      message: '토큰 디버깅 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
