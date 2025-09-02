import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserIdFromRequest } from '@/lib/auth-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[DEBUG] Testing authentication system...')
    
    // 요청 헤더 확인
    const authHeader = req.headers.authorization
    const cookies = req.headers.cookie
    
    console.log('[DEBUG] Auth header:', authHeader)
    console.log('[DEBUG] Cookies:', cookies)
    
    // 인증 함수 테스트
    const userId = await getUserIdFromRequest(req)
    
    console.log('[DEBUG] User ID result:', userId)
    
    return res.status(200).json({
      ok: true,
      auth: {
        hasAuthHeader: !!authHeader,
        hasCookies: !!cookies,
        userId: userId,
        isAuthenticated: !!userId
      }
    })
    
  } catch (error) {
    console.error('[DEBUG] Auth test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'AUTH_TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
