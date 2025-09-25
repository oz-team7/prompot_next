import { createClient } from '@supabase/supabase-js';

// Service role client for server-side operations
export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[DEBUG] Creating Supabase service client...');
  console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
  console.log('[DEBUG] Supabase URL present:', !!supabaseUrl);
  console.log('[DEBUG] Service role key present:', !!serviceRoleKey);
  
  if (!supabaseUrl || !serviceRoleKey) {
    const errorMsg = 'Supabase 환경 변수가 설정되지 않았습니다.';
    
    console.error('[ERROR] Missing Supabase environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    console.error('- NODE_ENV:', process.env.NODE_ENV);
    
    throw new Error(errorMsg);
  }
  
  try {
    const client = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('[DEBUG] Supabase service client created successfully');
    return client;
  } catch (error) {
    console.error('[ERROR] Failed to create Supabase service client:', error);
    throw error;
  }
}
}