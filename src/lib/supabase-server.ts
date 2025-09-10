import { createClient } from '@supabase/supabase-js';

// Service role client for server-side operations
export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    const errorMsg = 'Supabase 환경 변수가 설정되지 않았습니다.';
    
    // 프로덕션 환경에서는 상세한 로그를 남기지 않음
    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR] Missing Supabase environment variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    } else {
      console.error('[ERROR] Supabase environment variables not configured');
    }
    
    throw new Error(errorMsg);
  }
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}