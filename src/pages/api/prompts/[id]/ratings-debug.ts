import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const promptId = req.query.id as string
  
  console.log('=== PROBLEM PROMPT TEST ===')
  console.log('Problem PromptId:', promptId)
  console.log('Method:', req.method)
  
  try {
    // 1단계: 기본 검증
    if (!promptId) {
      console.log('Missing promptId')
      return res.status(400).json({ ok: false, error: 'INVALID_ID' })
    }

    // UUID 형식 검증
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(promptId)) {
      console.log('Invalid UUID format:', promptId)
      return res.status(400).json({ ok: false, error: 'INVALID_ID_FORMAT' })
    }

    console.log('PromptId validation passed')

    // 2단계: Supabase 클라이언트 생성
    const supabase = createSupabaseServiceClient()
    console.log('Supabase client created')

    // 3단계: prompts 테이블에서 해당 프롬프트 존재 확인
    console.log('Checking if prompt exists...')
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('id, title')
      .eq('id', promptId)
      .limit(1)

    if (promptError) {
      console.error('Prompt check error:', promptError)
      return res.status(500).json({ ok: false, error: 'PROMPT_CHECK_ERROR', details: promptError.message })
    }

    console.log('Prompt check result:', promptData)

    if (!promptData || promptData.length === 0) {
      console.log('Prompt not found in database')
      return res.status(404).json({ ok: false, error: 'PROMPT_NOT_FOUND' })
    }

    // 4단계: prompt_ratings 테이블에서 해당 프롬프트의 별점 확인
    console.log('Checking ratings for this prompt...')
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select('*')
      .eq('prompt_id', promptId)
      .is('deleted_at', null)

    if (ratingsError) {
      console.error('Ratings check error:', ratingsError)
      return res.status(500).json({ ok: false, error: 'RATINGS_CHECK_ERROR', details: ratingsError.message })
    }

    console.log('Ratings check result:', ratingsData)

    // 5단계: 응답
    const average = ratingsData.length > 0
      ? ratingsData.reduce((sum, curr) => sum + curr.rating, 0) / ratingsData.length
      : 0

    const response = {
      ok: true,
      prompt: promptData[0],
      average: Number(average.toFixed(1)),
      total: ratingsData.length,
      userRating: null,
      ratings: ratingsData
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
