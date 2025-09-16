import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';

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

  const supabase = createSupabaseServiceClient();

  // POST: 신고 생성
  if (req.method === 'POST') {
    try {
      const { reported_type, reported_id, reason, details } = req.body;

      if (!reported_type || !reported_id || !reason) {
        return res.status(400).json({ 
          message: '신고 대상 타입, ID, 사유는 필수입니다.' 
        });
      }

      // 유효한 신고 타입 확인
      if (!['prompt', 'user', 'comment'].includes(reported_type)) {
        return res.status(400).json({ 
          message: '유효하지 않은 신고 타입입니다.' 
        });
      }

      // 중복 신고 확인
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', authUser.id)
        .eq('reported_type', reported_type)
        .eq('reported_id', reported_id)
        .eq('status', 'pending')
        .single();

      if (existingReport) {
        return res.status(400).json({ 
          message: '이미 처리 중인 신고가 있습니다.' 
        });
      }

      // 신고 생성
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: authUser.id,
          reported_type,
          reported_id,
          reason,
          details: details || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(200).json({ 
        message: '신고가 접수되었습니다.',
        report: data
      });

    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ 
        message: '신고 생성 중 오류가 발생했습니다.' 
      });
    }
  }

  // GET: 내 신고 목록 조회
  else if (req.method === 'GET') {
    try {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.status(200).json({ reports });

    } catch (error) {
      console.error('Get my reports error:', error);
      res.status(500).json({ 
        message: '신고 목록을 가져오는 중 오류가 발생했습니다.' 
      });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}