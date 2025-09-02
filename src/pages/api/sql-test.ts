import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== SQL QUERY TEST ===')
  
  try {
    const supabase = createSupabaseServiceClient()
    
    // 1. prompt_ratings 테이블 구조 확인
    console.log('[DEBUG] Testing prompt_ratings table...')
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select('*')
      .limit(3)
    
    console.log('[DEBUG] Ratings query result:', { data: ratingsData, error: ratingsError })
    
    // 2. 특정 prompt_id로 조회 테스트
    const testPromptId = 'ab88a3eb-c4f8-4b19-a262-f24e1fca2188'
    console.log('[DEBUG] Testing specific prompt_id query...')
    
    const { data: specificData, error: specificError } = await supabase
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', testPromptId)
      .is('deleted_at', null)
    
    console.log('[DEBUG] Specific query result:', { data: specificData, error: specificError })
    
    // 3. 평균 계산 테스트
    let average = 0
    if (specificData && specificData.length > 0) {
      average = specificData.reduce((sum, curr) => sum + curr.rating, 0) / specificData.length
      console.log('[DEBUG] Average calculation:', average)
    }
    
    // 4. prompts 테이블 확인
    console.log('[DEBUG] Testing prompts table...')
    const { data: promptsData, error: promptsError } = await supabase
      .from('prompts')
      .select('id, title')
      .eq('id', testPromptId)
      .limit(1)
    
    console.log('[DEBUG] Prompts query result:', { data: promptsData, error: promptsError })
    
    return res.status(200).json({
      ok: true,
      message: 'SQL query test completed',
      results: {
        ratings: {
          data: ratingsData,
          error: ratingsError?.message,
          count: ratingsData?.length || 0
        },
        specific: {
          data: specificData,
          error: specificError?.message,
          count: specificData?.length || 0,
          average: Number(average.toFixed(1))
        },
        prompts: {
          data: promptsData,
          error: promptsError?.message,
          exists: !!promptsData?.length
        }
      }
    })
    
  } catch (error) {
    console.error('[DEBUG] SQL test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'SQL_TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
