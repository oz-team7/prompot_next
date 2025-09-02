import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[DEBUG] Testing database connection...')
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('[DEBUG] Supabase URL exists:', !!supabaseUrl)
    console.log('[DEBUG] Service key exists:', !!serviceKey)
    
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        ok: false,
        error: 'MISSING_ENV_VARS',
        details: {
          url: !!supabaseUrl,
          key: !!serviceKey
        }
      })
    }
    
    // Supabase 클라이언트 생성
    const supabase = createSupabaseServiceClient()
    console.log('[DEBUG] Supabase client created successfully')
    
    // 기본 연결 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('[DEBUG] Database connection error:', error)
      return res.status(500).json({
        ok: false,
        error: 'DB_CONNECTION_ERROR',
        details: error.message
      })
    }
    
    console.log('[DEBUG] Database connection successful')
    
    return res.status(200).json({
      ok: true,
      message: 'Database connection successful',
      data
    })
    
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error)
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
