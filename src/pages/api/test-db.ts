import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // 테이블 존재 확인
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('count')
      .limit(1);
    
    res.status(200).json({
      status: 'connected',
      tables: {
        profiles: profilesError ? `Error: ${profilesError.message}` : 'OK',
        prompts: promptsError ? `Error: ${promptsError.message}` : 'OK'
      },
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}