import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Token test API called');
  
  // Authorization 헤더 확인
  const authHeader = req.headers.authorization;
  console.log('[DEBUG] Authorization header:', authHeader);
  
  // 쿠키 확인
  const cookies = req.headers.cookie;
  console.log('[DEBUG] Cookies:', cookies);
  
  // 토큰 추출 시도
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    console.log('[DEBUG] Bearer token found:', token.substring(0, 20) + '...');
  }
  
  // 사용자 ID 가져오기
  const userId = await getUserIdFromRequest(req);
  console.log('[DEBUG] User ID from request:', userId);
  
  res.status(200).json({
    hasAuthHeader: !!authHeader,
    hasCookies: !!cookies,
    hasToken: !!token,
    userId: userId,
    authHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
    token: token ? token.substring(0, 20) + '...' : null
  });
}
