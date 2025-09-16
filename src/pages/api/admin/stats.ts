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
    // 전체 통계
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalPrompts } = await supabase.from('prompts').select('*', { count: 'exact', head: true });
    const { count: publicPrompts } = await supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('is_public', true);
    const { count: totalLikes } = await supabase.from('likes').select('*', { count: 'exact', head: true });
    const { count: totalBookmarks } = await supabase.from('bookmarks').select('*', { count: 'exact', head: true });

    // 오늘 가입한 사용자
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 최근 30일 MAU 계산을 위한 데이터
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 최근 30일간 활성 사용자 (프롬프트 작성, 좋아요, 북마크 활동)
    // 각 활동에 대해 별도 쿼리 실행 후 중복 제거
    const { data: promptAuthors } = await supabase
      .from('prompts')
      .select('author_id')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    const { data: likeUsers } = await supabase
      .from('likes')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    const { data: bookmarkUsers } = await supabase
      .from('bookmarks')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    const activeUserIds = new Set([
      ...(promptAuthors || []).map(p => p.author_id),
      ...(likeUsers || []).map(l => l.user_id),
      ...(bookmarkUsers || []).map(b => b.user_id)
    ]);
    
    const mau = activeUserIds.size;

    // 카테고리별 프롬프트 통계
    const categories = ['marketing', 'business', 'writing', 'coding', 'education', 'other'];
    const categoryStats = [];
    
    for (const category of categories) {
      const { count } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('category', category);
      
      categoryStats.push({ category, _count: count || 0 });
    }

    // AI 모델별 통계
    const { data: aiModels } = await supabase
      .from('prompts')
      .select('ai_model');
    
    const aiModelCounts = new Map();
    (aiModels || []).forEach(p => {
      const model = p.ai_model;
      aiModelCounts.set(model, (aiModelCounts.get(model) || 0) + 1);
    });
    
    const aiModelStats = Array.from(aiModelCounts.entries()).map(([aiModel, count]) => ({
      aiModel,
      _count: count
    }));

    // 최근 7일간 일별 신규 가입자 (차트용)
    const dailySignups = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      dailySignups.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // 최근 30일간 일별 활성 사용자 (MAU 차트용)
    const dailyActiveUsers = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // 해당 날짜의 활동 사용자
      const { data: promptAuthorsDay } = await supabase
        .from('prompts')
        .select('author_id')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());
      
      const { data: likeUsersDay } = await supabase
        .from('likes')
        .select('user_id')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());
      
      const activeUserIdsDay = new Set([
        ...(promptAuthorsDay || []).map(p => p.author_id),
        ...(likeUsersDay || []).map(l => l.user_id)
      ]);

      dailyActiveUsers.push({
        date: date.toISOString().split('T')[0],
        count: activeUserIdsDay.size,
      });
    }

    res.status(200).json({
      totalUsers: totalUsers || 0,
      totalPrompts: totalPrompts || 0,
      publicPrompts: publicPrompts || 0,
      totalLikes: totalLikes || 0,
      totalBookmarks: totalBookmarks || 0,
      todayUsers: todayUsers || 0,
      mau,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        _count: stat._count
      })),
      aiModelStats: aiModelStats.map(stat => ({
        aiModel: stat.aiModel,
        _count: stat._count
      })),
      dailySignups,
      dailyActiveUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: '통계 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
}