import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReportRequest {
  contentType: 'prompt' | 'comment' | 'user';
  contentId: string | number;
  category: 'spam' | 'offensive' | 'illegal' | 'other';
  reason: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 인증 확인
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { contentType, contentId, category, reason } = req.body as ReportRequest;

    // 유효성 검사
    if (!contentType || !contentId || !category || !reason) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요.' });
    }

    if (!['prompt', 'comment', 'user'].includes(contentType)) {
      return res.status(400).json({ error: '유효하지 않은 신고 대상입니다.' });
    }

    if (!['spam', 'offensive', 'illegal', 'other'].includes(category)) {
      return res.status(400).json({ error: '유효하지 않은 신고 유형입니다.' });
    }

    // 중복 신고 확인
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('status', 'pending')
      .single();

    if (existingReport) {
      return res.status(400).json({ error: '이미 신고한 콘텐츠입니다.' });
    }

    // 신고 접수
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId.toString(),
        category,
        reason,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: '신고 접수에 실패했습니다.' });
    }

    // 신고된 콘텐츠 정보 가져오기 (프롬프트의 경우)
    let contentDetails = null;
    if (contentType === 'prompt') {
      const { data: promptData } = await supabase
        .from('prompts')
        .select('title, author_name')
        .eq('id', contentId)
        .single();
      
      contentDetails = promptData;
    }

    return res.status(201).json({
      message: '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.',
      report: {
        ...data,
        contentDetails
      }
    });
  } catch (error) {
    console.error('Error in report API:', error);
    return res.status(500).json({ error: '신고 처리 중 오류가 발생했습니다.' });
  }
}