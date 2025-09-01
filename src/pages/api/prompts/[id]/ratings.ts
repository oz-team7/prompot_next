import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { getUserIdFromRequest } from '@/lib/auth-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const promptId = req.query.id as string
  if (!promptId) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' })
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res, promptId)
    if (req.method === 'POST') return await handlePost(req, res, promptId)
    if (req.method === 'PUT') return await handlePut(req, res, promptId)
    if (req.method === 'DELETE') return await handleDelete(req, res, promptId)
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  } catch (e) {
    console.error('[API /prompts/[id]/ratings] unexpected:', e)
    return res.status(500).json({ ok: false, error: 'INTERNAL' })
  }
}

// 별점 조회
async function handleGet(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const svc = createSupabaseServiceClient()
  
  // 평균 별점과 총 평가 수 조회
  const { data: stats, error: statsError } = await svc
    .from('prompt_ratings')
    .select('id, rating')
    .eq('prompt_id', promptId)
    .is('deleted_at', null)

  if (statsError) {
    console.error('[GET ratings] stats error:', statsError)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  const average = stats.length > 0
    ? stats.reduce((sum, curr) => sum + curr.rating, 0) / stats.length
    : 0

  // 현재 사용자의 별점 조회
  const userId = await getUserIdFromRequest(req)
  let userRating = null

  if (userId) {
    const { data: rating } = await svc
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .maybeSingle()

    userRating = rating?.rating
  }

  return res.status(200).json({
    ok: true,
    average: Number(average.toFixed(1)),
    total: stats.length,
    userRating
  })
}

// 별점 등록/수정
async function handlePost(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }

  const { rating } = req.body
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ ok: false, error: 'INVALID_RATING' })
  }

  const svc = createSupabaseServiceClient()

  // upsert로 등록/수정 처리
  const { error } = await svc
    .from('prompt_ratings')
    .upsert({
      prompt_id: promptId,
      user_id: userId,
      rating,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('[POST ratings] upsert error:', error)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  return res.status(200).json({ ok: true })
}

// 별점 삭제
async function handleDelete(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }

  const svc = createSupabaseServiceClient()

  const { error } = await svc
    .from('prompt_ratings')
    .delete()
    .eq('prompt_id', promptId)
    .eq('user_id', userId)

  if (error) {
    console.error('[DELETE ratings] delete error:', error)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  return res.status(200).json({ ok: true })
}

// PUT 메서드는 POST와 동일하게 처리
const handlePut = handlePost
