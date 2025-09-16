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
  // 관리자 인증 확인
  const authUser = await checkAdminAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { page = '1', limit = '10', status, type } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // 기본 쿼리
        let query = supabase
          .from('reports')
          .select(`
            *,
            reporter:profiles!reporter_id(id, name, email),
            resolved_by_admin:profiles!resolved_by(id, name, email)
          `, { count: 'exact' });

        // 필터 적용
        if (status && status !== '') {
          query = query.eq('status', status);
        }
        if (type && type !== '') {
          query = query.eq('content_type', type);
        }

        // 정렬 및 페이지네이션
        const { data: reports, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limitNum - 1);

        if (error) {
          console.error('Error fetching reports:', error);
          throw error;
        }

        // 신고된 콘텐츠 정보 추가
        const reportsWithDetails = await Promise.all(reports.map(async (report) => {
          let targetDetails = null;
          
          if (report.content_type === 'prompt') {
            const { data: promptData } = await supabase
              .from('prompts')
              .select('id, title, author_name')
              .eq('id', report.content_id)
              .single();
            targetDetails = promptData;
          } else if (report.content_type === 'user') {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, name, email')
              .eq('id', report.content_id)
              .single();
            targetDetails = userData;
          }

          return {
            ...report,
            targetDetails
          };
        }));

        return res.status(200).json({
          reports: reportsWithDetails,
          totalPages: Math.ceil((count || 0) / limitNum),
          currentPage: pageNum,
          totalCount: count
        });
      } catch (error) {
        console.error('Error in reports GET:', error);
        return res.status(500).json({ error: '신고 목록을 불러올 수 없습니다.' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}