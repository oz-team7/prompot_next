import type { NextApiRequest } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import * as cookie from 'cookie';

export async function getAuthUser(req: NextApiRequest) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    return null;
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth로 토큰 검증
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function requireAuth(req: NextApiRequest) {
  const user = await getAuthUser(req);
  
  if (!user) {
    throw new Error('인증이 필요합니다.');
  }
  
  return user;
}