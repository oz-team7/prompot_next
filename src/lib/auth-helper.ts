import { createSupabaseServiceClient } from '@/lib/supabase-server';

export async function verifyToken(token: string): Promise<{ userId: string; user: any } | null> {
  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth로 토큰 검증
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification error:', error);
      return null;
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    return {
      userId: user.id,
      user: profile
    };
  } catch (error) {
    console.error('Auth helper error:', error);
    return null;
  }
}

export async function getCurrentUser(token: string) {
  const result = await verifyToken(token);
  return result?.user || null;
}

export async function getCurrentUserId(token: string) {
  const result = await verifyToken(token);
  return result?.userId || null;
}
