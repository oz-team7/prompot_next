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
    console.error('[API /prompts/[id]/comments] unexpected:', e)
    return res.status(500).json({ ok: false, error: 'INTERNAL' })
  }
}

// 댓글 목록 조회
async function handleGet(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const svc = createSupabaseServiceClient()
  const page = Number(req.query.page) || 1
  const limit = 10
  const offset = (page - 1) * limit

  // 댓글 목록 조회 (삭제되지 않은 것만)
  const { data: comments, error, count } = await svc
    .from('prompt_comments')
    .select(`
      id,
      content,
      created_at,
      updated_at,
      user_id,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('prompt_id', promptId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[GET comments] select error:', error)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  return res.status(200).json({
    ok: true,
    comments,
    total: count || 0,
    totalCount: count || 0, // CommentSection에서 사용
    hasMore: count ? offset + limit < count : false
  })
}

// 댓글 작성
async function handlePost(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }

  const { content } = req.body
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'INVALID_CONTENT' })
  }

  const svc = createSupabaseServiceClient()

  const { data: comment, error } = await svc
    .from('prompt_comments')
    .insert({
      prompt_id: promptId,
      user_id: userId,
      content: content.trim()
    })
    .select(`
      id,
      content,
      created_at,
      updated_at,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('[POST comments] insert error:', error)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  return res.status(201).json({ ok: true, comment })
}

// 댓글 수정
async function handlePut(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }

  const { commentId, content } = req.body
  if (!commentId || !content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'INVALID_INPUT' })
  }

  const svc = createSupabaseServiceClient()

  // 댓글 소유자 확인
  const { data: existing } = await svc
    .from('prompt_comments')
    .select('user_id')
    .eq('id', commentId)
    .eq('prompt_id', promptId)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' })
  }

  if (existing.user_id !== userId) {
    return res.status(403).json({ ok: false, error: 'FORBIDDEN' })
  }

  const { data: comment, error } = await svc
    .from('prompt_comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
    .select(`
      id,
      content,
      created_at,
      updated_at,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('[PUT comments] update error:', error)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  return res.status(200).json({ ok: true, comment })
}

// 댓글 삭제 (소프트 딜리트)
async function handleDelete(req: NextApiRequest, res: NextApiResponse, promptId: string) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }

  const commentId = req.query.commentId as string
  if (!commentId) {
    return res.status(400).json({ ok: false, error: 'INVALID_INPUT' })
  }

  const svc = createSupabaseServiceClient()

  // 댓글 소유자 확인
  const { data: existing } = await svc
    .from('prompt_comments')
    .select('user_id')
    .eq('id', commentId)
    .eq('prompt_id', promptId)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' })
  }

  if (existing.user_id !== userId) {
    return res.status(403).json({ ok: false, error: 'FORBIDDEN' })
  }

  // 소프트 딜리트
  const { error } = await svc
    .from('prompt_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) {
    console.error('[DELETE comments] update error:', error)
    return res.status(500).json({ ok: false, error: 'DB_ERROR' })
  }

  return res.status(200).json({ ok: true })
}
