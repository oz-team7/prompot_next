import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const promptId = req.query.id as string
  
  console.log('=== SIMPLE RATINGS API ===')
  console.log('PromptId:', promptId)
  console.log('Method:', req.method)
  
  try {
    // 1단계: 기본 검증
    if (!promptId) {
      return res.status(400).json({ ok: false, error: 'INVALID_ID' })
    }

    // 2단계: Supabase 클라이언트 생성
    const supabase = createSupabaseServiceClient()
    console.log('Supabase client created')

    // 3단계: 간단한 쿼리만 실행
    const { data, error } = await supabase
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', promptId)
      .is('deleted_at', null)

    if (error) {
      console.error('Query error:', error)
      return res.status(500).json({ ok: false, error: 'DB_ERROR', details: error.message })
    }

    console.log('Query successful:', data)

    // 4단계: 간단한 응답
    const average = data.length > 0
      ? data.reduce((sum, curr) => sum + curr.rating, 0) / data.length
      : 0

    const response = {
      ok: true,
      average: Number(average.toFixed(1)),
      total: data.length,
      userRating: null
    }

    console.log('Response:', response)
    return res.status(200).json(response)
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ 
      ok: false, 
      error: 'INTERNAL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
