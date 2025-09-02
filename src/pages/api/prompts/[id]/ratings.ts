import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { getUserIdFromRequest } from '@/lib/auth-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const promptId = req.query.id as string
  
  // 상세한 요청 정보 로깅
  console.log('=== RATINGS API DEBUG START ===')
  console.log('[DEBUG] Request URL:', req.url)
  console.log('[DEBUG] Request method:', req.method)
  console.log('[DEBUG] PromptId:', promptId)
  console.log('[DEBUG] Headers:', JSON.stringify(req.headers, null, 2))
  console.log('[DEBUG] Query:', JSON.stringify(req.query, null, 2))
  console.log('[DEBUG] Body:', JSON.stringify(req.body, null, 2))
  
  try {
    // 1단계: 기본 유효성 검사
    if (!promptId) {
      console.log('[DEBUG] Missing promptId')
      return res.status(400).json({ ok: false, error: 'INVALID_ID' })
    }

    // UUID 형식 검증
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(promptId)) {
      console.log('[DEBUG] Invalid UUID format:', promptId)
      return res.status(400).json({ ok: false, error: 'INVALID_ID_FORMAT' })
    }

    console.log('[DEBUG] PromptId validation passed')

    // 2단계: 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('[DEBUG] Supabase URL exists:', !!supabaseUrl)
    console.log('[DEBUG] Service key exists:', !!serviceKey)
    
    if (!supabaseUrl || !serviceKey) {
      console.error('[DEBUG] Missing environment variables')
      return res.status(500).json({
        ok: false,
        error: 'MISSING_ENV_VARS',
        details: { url: !!supabaseUrl, key: !!serviceKey }
      })
    }

    // 3단계: Supabase 클라이언트 생성
    console.log('[DEBUG] Creating Supabase client...')
    const supabase = createSupabaseServiceClient()
    console.log('[DEBUG] Supabase client created successfully')

    // 4단계: 테이블 존재 확인
    console.log('[DEBUG] Checking table existence...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('prompt_ratings')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error('[DEBUG] Table check failed:', tableError)
      return res.status(500).json({ 
        ok: false, 
        error: 'TABLE_NOT_FOUND',
        details: tableError.message 
      })
    }
    
    console.log('[DEBUG] Table check passed:', tableCheck)

    // 5단계: 메서드별 처리
    if (req.method === 'GET') {
      console.log('[DEBUG] Processing GET request...')
      
      try {
        // 평균 별점과 총 평가 수 조회
        const { data: stats, error: statsError } = await supabase
          .from('prompt_ratings')
          .select('rating')
          .eq('prompt_id', promptId)
          .is('deleted_at', null)

        if (statsError) {
          console.error('[DEBUG] Stats query failed:', statsError)
          return res.status(500).json({ ok: false, error: 'DB_ERROR', details: statsError.message })
        }

        console.log('[DEBUG] Stats query successful:', stats)

        const average = stats.length > 0
          ? stats.reduce((sum, curr) => sum + curr.rating, 0) / stats.length
          : 0

        // 현재 사용자의 별점 조회
        console.log('[DEBUG] Getting user ID...')
        const userId = await getUserIdFromRequest(req)
        console.log('[DEBUG] User ID result:', userId)
        
        let userRating = null

        if (userId) {
          const { data: rating, error: ratingError } = await supabase
            .from('prompt_ratings')
            .select('rating')
            .eq('prompt_id', promptId)
            .eq('user_id', userId)
            .maybeSingle()

          if (ratingError) {
            console.error('[DEBUG] User rating query failed:', ratingError)
          } else {
            userRating = rating?.rating
            console.log('[DEBUG] User rating:', userRating)
          }
        }

        const response = {
          ok: true,
          average: Number(average.toFixed(1)),
          total: stats.length,
          userRating
        }
        
        console.log('[DEBUG] GET response:', response)
        console.log('=== RATINGS API DEBUG END ===')
        
        return res.status(200).json(response)
        
      } catch (getError) {
        console.error('[DEBUG] GET request error:', getError)
        return res.status(500).json({ 
          ok: false, 
          error: 'GET_ERROR',
          details: getError instanceof Error ? getError.message : 'Unknown error'
        })
      }
    }
    
    if (req.method === 'POST') {
      console.log('[DEBUG] Processing POST request...')
      
      try {
        const userId = await getUserIdFromRequest(req)
        console.log('[DEBUG] User ID for POST:', userId)
        
        if (!userId) {
          console.log('[DEBUG] User not authenticated')
          return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        const { rating } = req.body
        console.log('[DEBUG] Rating from body:', rating)
        
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
          console.log('[DEBUG] Invalid rating value:', rating)
          return res.status(400).json({ ok: false, error: 'INVALID_RATING' })
        }

        // upsert로 등록/수정 처리 (onConflict 옵션 추가)
        const { error } = await supabase
          .from('prompt_ratings')
          .upsert({
            prompt_id: promptId,
            user_id: userId,
            rating,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'prompt_id,user_id'
          })

        if (error) {
          console.error('[DEBUG] Upsert failed:', error)
          return res.status(500).json({ ok: false, error: 'DB_ERROR', details: error.message })
        }

        console.log('[DEBUG] POST request completed successfully')
        console.log('=== RATINGS API DEBUG END ===')
        
        return res.status(200).json({ ok: true })
        
      } catch (postError) {
        console.error('[DEBUG] POST request error:', postError)
        return res.status(500).json({ 
          ok: false, 
          error: 'POST_ERROR',
          details: postError instanceof Error ? postError.message : 'Unknown error'
        })
      }
    }
    
    console.log('[DEBUG] Method not allowed:', req.method)
    console.log('=== RATINGS API DEBUG END ===')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
    
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error)
    console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.log('=== RATINGS API DEBUG END ===')
    
    return res.status(500).json({ 
      ok: false, 
      error: 'INTERNAL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}