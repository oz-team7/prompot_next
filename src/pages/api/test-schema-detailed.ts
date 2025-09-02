import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== DATABASE SCHEMA TEST ===')
  
  try {
    const supabase = createSupabaseServiceClient()
    
    // 1. prompts 테이블 구조 확인
    console.log('Checking prompts table structure...')
    const { data: promptsSample, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .limit(3)
    
    console.log('Prompts sample:', promptsSample)
    console.log('Prompts error:', promptsError)
    
    // 2. prompt_ratings 테이블 구조 확인
    console.log('Checking prompt_ratings table structure...')
    const { data: ratingsSample, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select('*')
      .limit(3)
    
    console.log('Ratings sample:', ratingsSample)
    console.log('Ratings error:', ratingsError)
    
    // 3. 특정 프롬프트 ID 타입 확인
    const testPromptId = '3e9276bf-6059-45c0-ae12-ee2fc293df73'
    console.log('Testing specific prompt ID:', testPromptId)
    
    const { data: specificPrompt, error: specificError } = await supabase
      .from('prompts')
      .select('id, title')
      .eq('id', testPromptId)
      .limit(1)
    
    console.log('Specific prompt result:', specificPrompt)
    console.log('Specific prompt error:', specificError)
    
    return res.status(200).json({
      ok: true,
      prompts: {
        sample: promptsSample,
        error: promptsError?.message,
        count: promptsSample?.length || 0
      },
      ratings: {
        sample: ratingsSample,
        error: ratingsError?.message,
        count: ratingsSample?.length || 0
      },
      specificPrompt: {
        data: specificPrompt,
        error: specificError?.message,
        exists: !!specificPrompt?.length
      }
    })
    
  } catch (error) {
    console.error('Schema test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'SCHEMA_TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
