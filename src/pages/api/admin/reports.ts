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

  // GET: 신고 목록 조회
  if (req.method === 'GET') {
    try {
      const { page = '1', status = '', type = '' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limit = 10;
      const skip = (pageNum - 1) * limit;

      // 쿼리 빌더 초기화
      let query = supabase.from('reports').select('*', { count: 'exact' });

      // 필터 적용
      if (status) {
        query = query.eq('status', status);
      }
      
      if (type) {
        query = query.eq('reported_type', type);
      }

      // 정렬 및 페이징
      query = query
        .order('created_at', { ascending: false })
        .range(skip, skip + limit - 1);

      const { data: reports, error, count } = await query;

      if (error) {
        console.log('Reports 조회 에러로 빈 데이터 반환:', error);
        // 에러 발생 시 빈 데이터 반환
        res.status(200).json({
          reports: [],
          totalCount: 0,
          currentPage: pageNum,
          totalPages: 0,
        });
        return;
      }

      // reporter 정보와 신고 대상 정보 추가
      const reportsWithDetails = await Promise.all(
        (reports || []).map(async (report: any) => {
          // reporter 정보 가져오기
          let reporter = null;
          if (report.reporter_id) {
            const { data: reporterData } = await supabase
              .from('profiles')
              .select('id, name, email')
              .eq('id', report.reporter_id)
              .single();
            reporter = reporterData;
          }

          // 신고 대상 정보 가져오기 (타입에 따라)
          let targetDetails = null;
          if (report.reported_type === 'prompt' && report.reported_id) {
            const { data: promptData } = await supabase
              .from('prompts')
              .select('id, title, profiles(id, name, email)')
              .eq('id', report.reported_id)
              .single();
            targetDetails = promptData;
          } else if (report.reported_type === 'user' && report.reported_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, name, email')
              .eq('id', report.reported_id)
              .single();
            targetDetails = userData;
          }

          return {
            ...report,
            reporter,
            targetDetails
          };
        })
      );

      res.status(200).json({
        reports: reportsWithDetails,
        totalCount: count || 0,
        currentPage: pageNum,
        totalPages: Math.ceil((count || 0) / limit),
      });

    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ message: '신고 목록을 가져오는 중 오류가 발생했습니다.' });
    }
  }

  // PUT: 신고 상태 업데이트
  else if (req.method === 'PUT') {
    try {
      const { reportId, status, resolution_note } = req.body;

      if (!reportId || !status) {
        return res.status(400).json({ message: '신고 ID와 상태가 필요합니다.' });
      }

      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (resolution_note) {
        updates.resolution_note = resolution_note;
      }

      if (status === 'resolved' || status === 'rejected') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = authUser.id;
      }

      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        `REPORT_${status.toUpperCase()}`,
        'report',
        reportId,
        { status, resolution_note },
        req
      );

      res.status(200).json({ message: '신고가 처리되었습니다.' });

    } catch (error) {
      console.error('Update report error:', error);
      res.status(500).json({ message: '신고 처리 중 오류가 발생했습니다.' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}