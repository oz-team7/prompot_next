import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      endpoint,
      method,
      status,
      responseTime,
      userId,
      requestBody,
      responseBody,
      errorMessage,
      apiType,
    } = req.body;

    const supabase = createSupabaseServiceClient();
    
    // IP 주소와 User Agent 추출
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // API 로그 저장
    const { error } = await supabase
      .from('api_monitor_logs')
      .insert({
        endpoint,
        method,
        status,
        response_time: responseTime,
        user_id: userId || null,
        request_body: requestBody,
        response_body: responseBody,
        error_message: errorMessage,
        api_type: apiType,
        ip_address: ipAddress.toString().split(',')[0], // 첫 번째 IP만 저장
        user_agent: userAgent,
      });

    if (error) {
      console.error('Failed to save API log:', error);
      // 로그 저장 실패해도 200 반환 (API 호출 자체에는 영향 없도록)
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API log handler error:', error);
    // 로그 저장 실패해도 200 반환
    res.status(200).json({ success: true });
  }
}