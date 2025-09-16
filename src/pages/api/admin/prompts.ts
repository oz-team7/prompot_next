import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';
import { isAdmin, logAdminAction } from '@/lib/admin-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 인증 확인
  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  // 관리자 권한 확인
  if (!await isAdmin(authUser.id)) {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  
  const supabase = createSupabaseServiceClient();

  // GET: 프롬프트 목록 조회
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const category = req.query.category as string || '';
      const skip = (page - 1) * limit;

      // 기본 쿼리
      let query = supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          content,
          category,
          ai_model,
          is_public,
          created_at,
          updated_at,
          author_id,
          profiles!prompts_author_id_fkey (
            id,
            name,
            email
          )
        `, { count: 'exact' });

      // 검색 조건
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // 카테고리 필터
      if (category) {
        query = query.eq('category', category);
      }

      // 정렬 및 페이징
      query = query
        .order('created_at', { ascending: false })
        .range(skip, skip + limit - 1);

      const { data: prompts, error: promptsError, count } = await query;

      if (promptsError) {
        throw promptsError;
      }

      // 각 프롬프트의 통계 정보 추가
      const promptsWithStats = await Promise.all(
        (prompts || []).map(async (prompt) => {
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('prompt_id', prompt.id);

          const { count: bookmarksCount } = await supabase
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('prompt_id', prompt.id);

          return {
            ...prompt,
            author: prompt.profiles,
            _count: {
              likes: likesCount || 0,
              bookmarks: bookmarksCount || 0
            }
          };
        })
      );

      res.status(200).json({
        prompts: promptsWithStats,
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
      });

    } catch (error) {
      console.error('Admin prompts error:', error);
      res.status(500).json({ message: '프롬프트 목록을 가져오는 중 오류가 발생했습니다.' });
    }
  }

  // PUT: 프롬프트 수정
  else if (req.method === 'PUT') {
    try {
      const { promptId, updates } = req.body;

      if (!promptId) {
        return res.status(400).json({ message: '프롬프트 ID가 필요합니다.' });
      }

      // 허용된 필드만 업데이트
      const allowedFields = ['title', 'description', 'content', 'category', 'ai_model', 'is_public'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error: updateError } = await supabase
        .from('prompts')
        .update(updateData)
        .eq('id', promptId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        'UPDATE_PROMPT',
        'prompt',
        promptId,
        { updates: updateData },
        req
      );

      res.status(200).json({ 
        message: '프롬프트가 성공적으로 수정되었습니다.',
        prompt: data
      });

    } catch (error) {
      console.error('Update prompt error:', error);
      res.status(500).json({ message: '프롬프트 수정 중 오류가 발생했습니다.' });
    }
  }

  // DELETE: 프롬프트 삭제
  else if (req.method === 'DELETE') {
    try {
      const { promptId } = req.query;

      if (!promptId) {
        return res.status(400).json({ message: '프롬프트 ID가 필요합니다.' });
      }

      // 프롬프트 정보 먼저 조회 (로그용)
      const { data: promptData } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      // 관련 데이터 삭제 (likes, bookmarks는 cascade 삭제로 자동 처리됨)
      const { error: deleteError } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      if (deleteError) {
        throw deleteError;
      }

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        'DELETE_PROMPT',
        'prompt',
        promptId as string,
        { deletedPrompt: promptData },
        req
      );

      res.status(200).json({ message: '프롬프트가 성공적으로 삭제되었습니다.' });

    } catch (error) {
      console.error('Delete prompt error:', error);
      res.status(500).json({ message: '프롬프트 삭제 중 오류가 발생했습니다.' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}