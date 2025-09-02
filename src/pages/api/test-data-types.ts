import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== DATA TYPE CHECK ===')
  
  try {
    const supabase = createSupabaseServiceClient()
    
    // 1. prompts 테이블의 id 컬럼 타입 확인
    console.log('Checking prompts.id data type...')
    const { data: promptsType, error: promptsTypeError } = await supabase
      .rpc('get_column_info', {
        table_name: 'prompts',
        column_name: 'id'
      })
    
    console.log('Prompts ID type:', promptsType)
    console.log('Prompts type error:', promptsTypeError)
    
    // 2. prompt_ratings 테이블의 prompt_id 컬럼 타입 확인
    console.log('Checking prompt_ratings.prompt_id data type...')
    const { data: ratingsType, error: ratingsTypeError } = await supabase
      .rpc('get_column_info', {
        table_name: 'prompt_ratings',
        column_name: 'prompt_id'
      })
    
    console.log('Ratings prompt_id type:', ratingsType)
    console.log('Ratings type error:', ratingsTypeError)
    
    // 3. 실제 데이터 샘플 확인
    console.log('Checking actual data samples...')
    const { data: promptsSample, error: promptsError } = await supabase
      .from('prompts')
      .select('id, title')
      .limit(3)
    
    const { data: ratingsSample, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select('prompt_id, user_id, rating')
      .limit(3)
    
    console.log('Prompts sample:', promptsSample)
    console.log('Ratings sample:', ratingsSample)
    
    // 4. 특정 프롬프트 ID로 테스트
    const testPromptId = '3e9276bf-6059-45c0-ae12-ee2fc293df73'
    console.log('Testing specific prompt ID:', testPromptId)
    
    const { data: specificPrompt, error: specificError } = await supabase
      .from('prompts')
      .select('id, title')
      .eq('id', testPromptId)
      .limit(1)
    
    const { data: specificRatings, error: specificRatingsError } = await supabase
      .from('prompt_ratings')
      .select('prompt_id, user_id, rating')
      .eq('prompt_id', testPromptId)
      .limit(3)
    
    return res.status(200).json({
      ok: true,
      dataTypes: {
        prompts: {
          id: promptsType,
          error: promptsTypeError?.message
        },
        ratings: {
          prompt_id: ratingsType,
          error: ratingsTypeError?.message
        }
      },
      samples: {
        prompts: promptsSample,
        ratings: ratingsSample,
        promptsError: promptsError?.message,
        ratingsError: ratingsError?.message
      },
      specificTest: {
        prompt: specificPrompt,
        ratings: specificRatings,
        promptError: specificError?.message,
        ratingsError: specificRatingsError?.message
      }
    })
    
  } catch (error) {
    console.error('Data type check error:', error)
    return res.status(500).json({
      ok: false,
      error: 'DATA_TYPE_CHECK_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
