import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[DEBUG] Test API called');
    
    // 환경 변수 확인
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    
    console.log('[DEBUG] Environment variables:', envCheck);
    
    // Supabase 클라이언트 생성 테스트
    const supabase = createSupabaseServiceClient();
    console.log('[DEBUG] Supabase client created');
    
    // 간단한 쿼리 테스트
    const { data, error } = await supabase
      .from('prompts')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[DEBUG] Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Supabase query failed',
        details: error.message,
        envCheck 
      });
    }
    
    console.log('[DEBUG] Supabase query successful, data:', data);
    
    return res.status(200).json({ 
      success: true,
      message: 'Supabase connection successful',
      envCheck,
      queryResult: data
    });
    
  } catch (error: any) {
    console.error('[DEBUG] Test API error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}