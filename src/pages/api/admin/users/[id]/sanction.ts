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
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(400).json({ message: '사용자 ID가 필요합니다.' });
  }

  // POST: 제재 적용
  if (req.method === 'POST') {
    try {
      const { sanctionType, reason, duration } = req.body;

      if (!sanctionType || !reason) {
        return res.status(400).json({ message: '제재 유형과 사유가 필요합니다.' });
      }

      // 제재 타입 검증
      if (!['warning', 'suspension', 'permanent_ban'].includes(sanctionType)) {
        return res.status(400).json({ message: '올바른 제재 유형이 아닙니다.' });
      }

      // 정지 기간 검증
      if (sanctionType === 'suspension' && ![7, 30].includes(duration)) {
        return res.status(400).json({ message: '정지 기간은 7일 또는 30일만 가능합니다.' });
      }

      // 제재 적용
      const { error } = await supabase.rpc('apply_user_sanction', {
        p_user_id: userId,
        p_sanction_type: sanctionType,
        p_reason: reason,
        p_duration: sanctionType === 'permanent_ban' ? null : duration,
        p_created_by: authUser.id
      });

      if (error) throw error;

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        `USER_${sanctionType.toUpperCase()}`,
        'user',
        userId,
        { reason, duration },
        req
      );

      res.status(200).json({ 
        message: sanctionType === 'warning' ? '경고가 적용되었습니다.' :
                 sanctionType === 'suspension' ? `${duration}일 정지가 적용되었습니다.` :
                 '영구 정지가 적용되었습니다.'
      });

    } catch (error) {
      console.error('Apply sanction error:', error);
      res.status(500).json({ message: '제재 적용 중 오류가 발생했습니다.' });
    }
  }

  // DELETE: 제재 해제
  else if (req.method === 'DELETE') {
    try {
      const { sanctionId } = req.query;

      if (!sanctionId) {
        return res.status(400).json({ message: '제재 ID가 필요합니다.' });
      }

      // 제재 해제
      const { error } = await supabase.rpc('revoke_user_sanction', {
        p_user_id: userId,
        p_sanction_id: sanctionId
      });

      if (error) throw error;

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        'USER_SANCTION_REVOKED',
        'user',
        userId,
        { sanctionId },
        req
      );

      res.status(200).json({ message: '제재가 해제되었습니다.' });

    } catch (error) {
      console.error('Revoke sanction error:', error);
      res.status(500).json({ message: '제재 해제 중 오류가 발생했습니다.' });
    }
  }

  // GET: 사용자 제재 내역 조회
  else if (req.method === 'GET') {
    try {
      const { data: sanctions, error } = await supabase
        .from('user_sanctions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ sanctions });

    } catch (error) {
      console.error('Get sanctions error:', error);
      res.status(500).json({ message: '제재 내역을 가져오는 중 오류가 발생했습니다.' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}