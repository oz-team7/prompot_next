// /src/pages/api/prompts/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { getAuthUser } from '@/lib/auth-utils'

const isValidId = (s: string) => {
  // UUID 형식인지 확인
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
  // 숫자 형식인지 확인 (프롬프트 ID는 SERIAL)
  const isNumeric = /^\d+$/.test(s)
  return isUUID || isNumeric
}

function json(res: NextApiResponse, status: number, body: any) {
  return res.status(status).json(body)
}

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String)
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {}
    return input.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

async function getUserIdFromRequest(req: NextApiRequest): Promise<string | null> {
  const user = await getAuthUser(req);
  return user?.id || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string' || !isValidId(id)) {
    return json(res, 400, { ok: false, error: 'INVALID_ID' })
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res, id)
    if (req.method === 'PUT') return await handlePut(req, res, id)
    if (req.method === 'DELETE') return await handleDelete(req, res, id)
    return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
  } catch (e) {
    console.error('[API /prompts/[id]] unexpected:', e)
    return json(res, 500, { ok: false, error: 'INTERNAL' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  const svc = createSupabaseServiceClient() // 서비스 롤: RLS 영향 안 받음

  // 1) 프롬프트 본문(조인 없이 단건)
  const { data: prompt, error } = await svc
    .from('prompts')
    .select('id,title,content,description,category,is_public,created_at,updated_at,author_id,tags,ai_model,preview_image,additional_images,video_url,views,result_type,text_result')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[GET prompts] select error:', error)
    return json(res, 500, { ok: false, error: 'DB_ERROR' })
  }
  if (!prompt) return json(res, 404, { ok: false, error: 'NOT_FOUND' })

  // 2) 접근 제어: 공개이거나 소유자만
  const requesterId = await getUserIdFromRequest(req)
  const isOwner = requesterId && prompt.author_id === requesterId
  if (!prompt.is_public && !isOwner) {
    // 보안상 404로 위장
    return json(res, 404, { ok: false, error: 'NOT_FOUND' })
  }

  // 3) 작성자 정보 가져오기
  const { data: author } = await svc
    .from('profiles')
    .select('id, name, email, avatar_url')
    .eq('id', prompt.author_id)
    .single()

  if (!author) {
    console.error('작성자 정보를 찾을 수 없음:', prompt.author_id)
    return json(res, 500, { ok: false, error: 'AUTHOR_NOT_FOUND' })
  }

  // 4) 좋아요/북마크/댓글 카운트 (조인 대신 count)
  const { count: likesCount } = await svc
    .from('prompt_likes')
    .select('user_id', { count: 'exact', head: true })
    .eq('prompt_id', id)

  const { count: bookmarksCount } = await svc
    .from('prompt_bookmarks')
    .select('user_id', { count: 'exact', head: true })
    .eq('prompt_id', id)
    
  const { count: commentsCount } = await svc
    .from('prompt_comments')
    .select('id', { count: 'exact', head: true })
    .eq('prompt_id', id)

  // 5) 현재 사용자의 좋아요 여부 확인
  let isLiked = false
  if (requesterId) {
    const { data: userLike } = await svc
      .from('prompt_likes')
      .select('id')
      .eq('prompt_id', id)
      .eq('user_id', requesterId)
      .single()
    
    isLiked = !!userLike
  }

  // 응답 데이터 구성
  return json(res, 200, {
    ok: true,
    prompt: {
      ...prompt,
      tags: parseTags(prompt.tags),
      author: {
        id: author.id,
        name: author.name,
        email: author.email,
        avatar_url: author.avatar_url
      },
      likes: likesCount ?? 0,
      likes_count: likesCount ?? 0, // 새로운 API 형식
      is_liked: isLiked, // 현재 사용자의 좋아요 여부
      views: prompt.views || 0, // 조회수
      bookmarks: bookmarksCount ?? 0,
      comment_count: commentsCount ?? 0, // 댓글 수
      rating: 0, // 항상 기본값 0 추가
      date: new Date(prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
      isOwner,
      previewImage: prompt.preview_image, // preview_image를 previewImage로 변환
      additionalImages: prompt.additional_images || [], // additional_images를 additionalImages로 변환 (필드가 없으면 빈 배열)
      videoUrl: prompt.video_url || null, // video_url을 videoUrl로 변환
      isPublic: prompt.is_public, // is_public을 isPublic으로 변환
      aiModel: prompt.ai_model, // ai_model을 aiModel로 변환
      resultType: prompt.result_type || 'image', // result_type을 resultType으로 변환
      textResult: prompt.text_result || null // text_result를 textResult로 변환
    }
  })
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  console.log('[DEBUG] PUT request headers:', req.headers);
  console.log('[DEBUG] PUT request body:', req.body);
  
  const userId = await getUserIdFromRequest(req)
  console.log('[DEBUG] Extracted user ID:', userId);
  
  if (!userId) {
    console.log('[DEBUG] No user ID found, returning UNAUTHORIZED');
    return json(res, 401, { ok: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' })
  }

  const svc = createSupabaseServiceClient()

  // 소유자 확인
  const { data: ownerRow, error: ownerErr } = await svc
    .from('prompts')
    .select('author_id')
    .eq('id', id)
    .single()

  if (ownerErr || !ownerRow) return json(res, 404, { ok: false, error: 'NOT_FOUND' })
  if (ownerRow.author_id !== userId) return json(res, 403, { ok: false, error: 'FORBIDDEN' })

  // 입력 정규화
  const {
    title,
    description,
    content,
    category,
    tags,
    aiModel,
    preview_image,
    additional_images,
    video_url,
    is_public,
    resultType,
    textResult,
  } = req.body ?? {}

  const payload: any = {
    updated_at: new Date().toISOString(),
  }
  if (typeof title === 'string') payload.title = title
  if (typeof description === 'string') payload.description = description
  if (typeof content === 'string') payload.content = content
  if (typeof category === 'string') payload.category = category
  if (aiModel) payload.ai_model = aiModel
  if (typeof is_public === 'boolean') payload.is_public = is_public
  if (preview_image === null || typeof preview_image === 'string') payload.preview_image = preview_image
  if (Array.isArray(additional_images)) payload.additional_images = additional_images
  if (video_url === null || typeof video_url === 'string') payload.video_url = video_url
  if (typeof resultType === 'string') payload.result_type = resultType
  if (typeof textResult === 'string') payload.text_result = textResult

  // tags 허용: 배열 또는 문자열("a,b")
  const tagsArr = parseTags(tags)
  if (tagsArr.length) payload.tags = tagsArr
  else if (tags === '' || tags === null) payload.tags = []

  const { data: updated, error } = await createSupabaseServiceClient()
    .from('prompts')
    .update(payload)
    .eq('id', id)
    .select('id,title,content,description,category,is_public,created_at,updated_at,author_id,tags,ai_model,preview_image,additional_images')
    .single()

  if (error) {
    console.error('[PUT prompts] update error:', error)
    return json(res, 500, { 
      ok: false, 
      error: 'DB_ERROR',
      message: error.message || '데이터베이스 오류가 발생했습니다.'
    })
  }

  if (!updated) {
    return json(res, 400, {
      ok: false,
      error: 'UPDATE_FAILED',
      message: '프롬프트 수정에 실패했습니다.'
    })
  }

  return json(res, 200, { 
    ok: true, 
    prompt: { ...updated, tags: parseTags(updated.tags) },
    message: '프롬프트가 성공적으로 수정되었습니다.'
  })
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  console.log('[DEBUG] DELETE request headers:', req.headers);
  console.log('[DEBUG] DELETE request query:', req.query);
  
  const userId = await getUserIdFromRequest(req)
  console.log('[DEBUG] Extracted user ID for DELETE:', userId);
  
  if (!userId) {
    console.log('[DEBUG] No user ID found for DELETE, returning UNAUTHORIZED');
    return json(res, 401, { message: '인증이 필요합니다.' })
  }

  const svc = createSupabaseServiceClient()

  // 소유자 확인
  const { data: ownerRow, error: ownerErr } = await svc
    .from('prompts')
    .select('author_id')
    .eq('id', id)
    .single()

  console.log('[DEBUG] Owner check result:', { ownerRow, ownerErr });

  if (ownerErr || !ownerRow) return json(res, 404, { message: '프롬프트를 찾을 수 없습니다.' })
  if (ownerRow.author_id !== userId) {
    console.log('[DEBUG] Owner mismatch:', { ownerId: ownerRow.author_id, userId });
    return json(res, 403, { message: '프롬프트 삭제 권한이 없습니다.' })
  }

  const { error } = await svc.from('prompts').delete().eq('id', id)
  if (error) {
    console.error('[DELETE prompts] error:', error)
    return json(res, 500, { message: '데이터베이스 오류가 발생했습니다.' })
  }
  
  console.log('[DEBUG] DELETE successful for prompt:', id);
  return json(res, 200, { message: '프롬프트가 삭제되었습니다.' })
}
