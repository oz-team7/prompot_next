import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';
import { isAdmin, logAdminAction } from '@/lib/admin-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: '사용자 ID가 필요합니다.' });
  }

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

  // GET: 사용자 상세 정보 조회
  if (req.method === 'GET') {
    try {
      // 사용자 기본 정보
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userProfile) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      // 사용자 프롬프트 목록 (최근 10개)
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, title, category, is_public, created_at')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // 활동 통계
      const { count: promptCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      const { count: likeCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: bookmarkCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 최근 활동 (30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentPrompts } = await supabase
        .from('prompts')
        .select('created_at')
        .eq('author_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      const { data: recentLikes } = await supabase
        .from('likes')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // 제재 내역 조회
      const { data: sanctions } = await supabase
        .from('user_sanctions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      res.status(200).json({
        user: {
          ...userProfile,
          stats: {
            prompts: promptCount || 0,
            likes: likeCount || 0,
            bookmarks: bookmarkCount || 0,
          },
        },
        prompts: prompts || [],
        activities: {
          recentPrompts: (recentPrompts || []).length,
          recentLikes: (recentLikes || []).length,
          lastActivity: recentPrompts?.[0]?.created_at || recentLikes?.[0]?.created_at || userProfile.created_at,
        },
        sanctions: sanctions || [],
      });

    } catch (error) {
      console.error('Get user detail error:', error);
      res.status(500).json({ message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' });
    }
  }

  // PUT: 사용자 정보 수정 (차단/해제 등)
  else if (req.method === 'PUT') {
    try {
      const { action, data } = req.body;

      if (action === 'block') {
        // 사용자 차단 (is_blocked 필드가 있다고 가정)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            blocked_by: authUser.id
          })
          .eq('id', userId);

        if (updateError) throw updateError;

        // 어드민 로그 기록
        await logAdminAction(
          authUser.id,
          'BLOCK_USER',
          'user',
          userId,
          undefined,
          req
        );

        res.status(200).json({ message: '사용자가 차단되었습니다.' });
      }
      else if (action === 'unblock') {
        // 사용자 차단 해제
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_blocked: false,
            blocked_at: null,
            blocked_by: null
          })
          .eq('id', userId);

        if (updateError) throw updateError;

        // 어드민 로그 기록
        await logAdminAction(
          authUser.id,
          'UNBLOCK_USER',
          'user',
          userId,
          undefined,
          req
        );

        res.status(200).json({ message: '차단이 해제되었습니다.' });
      }
      else {
        res.status(400).json({ message: '유효하지 않은 액션입니다.' });
      }

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: '사용자 정보 수정 중 오류가 발생했습니다.' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}