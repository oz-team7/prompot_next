import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    // 검색 조건
    const whereCondition = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    } : {};

    // 전체 사용자 수
    let countQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { count: totalCount } = await countQuery;

    // 사용자 목록 조회 (정지 상태 정보 포함)
    let usersQuery = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);
    
    if (search) {
      usersQuery = usersQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { data: usersRaw, error: usersError } = await usersQuery;
    
    if (usersError) {
      console.error('Users query error:', usersError);
      throw new Error('사용자 목록을 가져올 수 없습니다.');
    }
    
    // 각 사용자의 통계를 별도로 가져오기
    const users = await Promise.all(
      (usersRaw || []).map(async (user) => {
        // 프롬프트 수 가져오기
        const { count: promptCount } = await supabase
          .from('prompts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id);
        
        // 좋아요 수 가져오기
        const { count: likeCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // 북마크 수 가져오기
        const { count: bookmarkCount } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: new Date(user.created_at),
          is_suspended: user.is_suspended || false,
          suspension_reason: user.suspension_reason || null,
          suspension_end_date: user.suspension_end_date || null,
          warning_count: user.warning_count || 0,
          _count: {
            prompts: promptCount || 0,
            likes: likeCount || 0,
            bookmarks: bookmarkCount || 0,
          }
        };
      })
    );

    // 최근 30일 활동 확인
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        // 최근 활동 확인
        const { data: recentPrompts } = await supabase
          .from('prompts')
          .select('id')
          .eq('author_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .limit(1);
        
        const { data: recentLikes } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .limit(1);
        
        const recentActivity = (recentPrompts && recentPrompts.length > 0) || 
                              (recentLikes && recentLikes.length > 0);

        return {
          ...user,
          isActive: !!recentActivity,
          joinDate: user.createdAt.toISOString().split('T')[0],
        };
      })
    );

    res.status(200).json({
      users: usersWithActivity,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil((totalCount || 0) / limit),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: '사용자 목록을 가져오는 중 오류가 발생했습니다.' });
  }
}