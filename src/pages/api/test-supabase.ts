import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    steps: [] as any[]
  };

  try {
    console.log('[DEBUG] Supabase connection test started');
    
    // Step 1: 환경 변수 확인
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    
    testResults.steps.push({
      step: 'Environment Variables',
      status: 'success',
      data: envCheck
    });
    
    console.log('[DEBUG] Environment variables:', envCheck);
    
    // Step 2: Supabase 클라이언트 생성 테스트
    let supabase;
    try {
      supabase = createSupabaseServiceClient();
      testResults.steps.push({
        step: 'Supabase Client Creation',
        status: 'success',
        data: 'Client created successfully'
      });
      console.log('[DEBUG] Supabase client created');
    } catch (clientError: any) {
      testResults.steps.push({
        step: 'Supabase Client Creation',
        status: 'error',
        error: clientError.message
      });
      throw clientError;
    }
    
    // Step 3: 기본 연결 테스트 (ping)
    try {
      const { data: pingData, error: pingError } = await supabase
        .from('prompts')
        .select('count')
        .limit(0);
      
      if (pingError) {
        testResults.steps.push({
          step: 'Database Ping',
          status: 'error',
          error: pingError.message,
          code: pingError.code
        });
        throw pingError;
      }
      
      testResults.steps.push({
        step: 'Database Ping',
        status: 'success',
        data: 'Connection successful'
      });
      console.log('[DEBUG] Database ping successful');
    } catch (pingError: any) {
      testResults.steps.push({
        step: 'Database Ping',
        status: 'error',
        error: pingError.message
      });
      throw pingError;
    }
    
    // Step 4: 실제 데이터 조회 테스트
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('id, title, created_at')
        .eq('is_deleted', false)
        .limit(5);
      
      if (error) {
        testResults.steps.push({
          step: 'Data Query',
          status: 'error',
          error: error.message,
          code: error.code
        });
        throw error;
      }
      
      testResults.steps.push({
        step: 'Data Query',
        status: 'success',
        data: {
          count: data?.length || 0,
          sample: data?.slice(0, 2) || []
        }
      });
      
      console.log('[DEBUG] Data query successful, found:', data?.length || 0, 'prompts');
    } catch (queryError: any) {
      testResults.steps.push({
        step: 'Data Query',
        status: 'error',
        error: queryError.message
      });
      throw queryError;
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'All Supabase tests passed',
      testResults
    });
    
  } catch (error: any) {
    console.error('[DEBUG] Supabase test error:', error);
    
    testResults.steps.push({
      step: 'Overall Test',
      status: 'error',
      error: error.message
    });
    
    return res.status(500).json({ 
      success: false,
      error: error.message,
      testResults,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}