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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 관리자 인증 확인
    const authUser = await checkAdminAuth(req);
    if (!authUser) {
      return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
    }

    const { id } = req.query;
    const { action, adminNote } = req.body;

    // 유효성 검사
    if (!action || !['reviewing', 'resolved', 'dismissed'].includes(action)) {
      return res.status(400).json({ error: '유효하지 않은 처리 상태입니다.' });
    }

    // 신고 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return res.status(404).json({ error: '신고를 찾을 수 없습니다.' });
    }

    // 신고 상태 업데이트
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: action,
        resolved_at: action === 'resolved' || action === 'dismissed' ? new Date().toISOString() : null,
        resolved_by: authUser.id,
        admin_note: adminNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report:', updateError);
      return res.status(500).json({ error: '신고 처리에 실패했습니다.' });
    }

    // 신고가 해결된 경우 추가 조치
    if (action === 'resolved' && report.content_type === 'prompt') {
      // 프롬프트를 비공개로 전환하거나 삭제하는 등의 추가 조치 가능
      // 여기서는 일단 로깅만 수행
      console.log(`Prompt ${report.content_id} reported and resolved`);
    }

    // 활동 로그 기록
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: authUser.id,
        action: 'process_report',
        description: `신고 #${id}를 ${action} 상태로 처리`,
        metadata: {
          report_id: id,
          action,
          admin_note: adminNote
        }
      });

    return res.status(200).json({
      message: '신고가 처리되었습니다.',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error processing report:', error);
    return res.status(500).json({ error: '신고 처리 중 오류가 발생했습니다.' });
  }
}