import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== SUPABASE CLIENT TEST ===')
  
  try {
    // 1단계: 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Service key exists:', !!serviceKey)
    
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        ok: false,
        error: 'MISSING_ENV_VARS',
        details: { url: !!supabaseUrl, key: !!serviceKey }
      })
    }
    
    // 2단계: Supabase 클라이언트 생성
    console.log('Creating Supabase client...')
    const supabase = createSupabaseServiceClient()
    console.log('Supabase client created successfully')
    
    // 3단계: 간단한 쿼리 테스트
    console.log('Testing simple query...')
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Query error:', error)
      return res.status(500).json({
        ok: false,
        error: 'SUPABASE_QUERY_ERROR',
        details: error.message
      })
    }
    
    console.log('Query successful:', data)
    
    return res.status(200).json({
      ok: true,
      message: 'Supabase client test successful',
      data: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Supabase client test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'SUPABASE_CLIENT_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
