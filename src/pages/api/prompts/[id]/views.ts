import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

// IP 주소 추출 함수
const getClientIp = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  
  // IPv6 localhost를 IPv4로 변환
  if (ip === '::1') return '127.0.0.1';
  
  return ip;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const promptId = id as string; // UUID로 처리

  if (!promptId) {
    return res.status(400).json({ error: 'Invalid prompt ID' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // 사용자 정보 가져오기
    const userId = await getUserIdFromRequest(req);
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    console.log('[Views] Track view:', { promptId, userId, clientIp });

    // 이미 조회한 기록이 있는지 확인
    if (userId) {
      // 로그인한 사용자는 user_id로 확인
      const { data: existingView } = await supabase
        .from('prompt_views')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .single();

      if (existingView) {
        console.log('[Views] User already viewed this prompt');
        // 이미 조회한 경우 현재 조회수만 반환
        const { data: prompt } = await supabase
          .from('prompts')
          .select('views')
          .eq('id', promptId)
          .single();
        
        return res.status(200).json({ 
          views: prompt?.views || 0,
          alreadyViewed: true 
        });
      }
    } else {
      // 비로그인 사용자는 IP로 확인
      const { data: existingView } = await supabase
        .from('prompt_views')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('viewer_ip', clientIp)
        .is('user_id', null)
        .single();

      if (existingView) {
        console.log('[Views] IP already viewed this prompt');
        // 이미 조회한 경우 현재 조회수만 반환
        const { data: prompt } = await supabase
          .from('prompts')
          .select('views')
          .eq('id', promptId)
          .single();
        
        return res.status(200).json({ 
          views: prompt?.views || 0,
          alreadyViewed: true 
        });
      }
    }

    // 조회 기록 저장
    const { error: insertError } = await supabase
      .from('prompt_views')
      .insert({
        prompt_id: promptId,
        user_id: userId || null,
        viewer_ip: clientIp,
        user_agent: userAgent.substring(0, 255) // 길이 제한
      });

    if (insertError) {
      console.error('[Views] Error inserting view record:', insertError);
      // 중복 에러인 경우 (동시 요청 등으로 인한)
      if (insertError.code === '23505') {
        const { data: prompt } = await supabase
          .from('prompts')
          .select('views')
          .eq('id', promptId)
          .single();
        
        return res.status(200).json({ 
          views: prompt?.views || 0,
          alreadyViewed: true 
        });
      }
    }

    // 조회수 증가
    const { data: currentPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('views')
      .eq('id', promptId)
      .single();

    if (fetchError) {
      console.error('[Views] Error fetching prompt:', fetchError);
      return res.status(404).json({ error: '프롬프트를 찾을 수 없습니다.' });
    }

    const newViews = (currentPrompt.views || 0) + 1;

    // 조회수 업데이트
    const { data: updateData, error: updateError } = await supabase
      .from('prompts')
      .update({ views: newViews })
      .eq('id', promptId)
      .select('views')
      .single();

    if (updateError) {
      console.error('[Views] Error incrementing views:', updateError);
      return res.status(500).json({ error: 'Failed to increment views' });
    }

    console.log(`[Views] Incremented for prompt ${promptId}: ${currentPrompt.views} -> ${updateData.views}`);

    return res.status(200).json({ 
      views: updateData.views,
      success: true,
      alreadyViewed: false
    });

  } catch (error) {
    console.error('[Views] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}