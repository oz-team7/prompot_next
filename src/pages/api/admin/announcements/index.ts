import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method;

  switch (method) {
    case 'GET':
      try {
        const { page = '1', limit = '10', status } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
          .from('announcements')
          .select('*', { count: 'exact' });

        // 상태 필터
        if (status && status !== '') {
          if (status === 'active') {
            query = query.eq('is_active', true);
          } else if (status === 'inactive') {
            query = query.eq('is_active', false);
          }
        }

        // 정렬 및 페이지네이션
        const { data: announcements, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limitNum - 1);

        if (error) {
          console.error('Error fetching announcements:', error);
          throw error;
        }

        return res.status(200).json({
          announcements: announcements || [],
          totalPages: Math.ceil((count || 0) / limitNum),
          currentPage: pageNum,
          totalCount: count
        });
      } catch (error) {
        console.error('Error in announcements GET:', error);
        return res.status(500).json({ error: '공지사항을 불러올 수 없습니다.' });
      }

    case 'POST':
      // 관리자 인증 확인
      const authUser = await checkAdminAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
      }

      try {
        const { title, content, is_active = true } = req.body;

        // 유효성 검사
        if (!title || !content) {
          return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
        }

        const { data, error } = await supabase
          .from('announcements')
          .insert({
            title,
            content,
            is_active,
            created_by: authUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating announcement:', error);
          throw error;
        }

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'create_announcement',
            description: `공지사항 생성: ${title}`,
            metadata: { announcement_id: data.id, title }
          });

        return res.status(201).json({
          message: '공지사항이 등록되었습니다.',
          announcement: data
        });
      } catch (error) {
        console.error('Error in announcement POST:', error);
        return res.status(500).json({ error: '공지사항 등록에 실패했습니다.' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}