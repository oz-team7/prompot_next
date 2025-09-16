import { createSupabaseServiceClient } from './supabase-server';

export async function isAdmin(userId: string): Promise<boolean> {
  // admin_users 테이블 캐시 문제로 임시로 하드코딩
  // TODO: admin_users 테이블 접근 가능할 때 수정
  return userId === '7b03565d-b472-477c-9321-75bb442ae60e';
  
  /*
  const supabase = createSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single();
  
  return !error && !!data;
  */
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  // admin_users 테이블 캐시 문제로 임시로 하드코딩
  return userId === '7b03565d-b472-477c-9321-75bb442ae60e';
  
  /*
  const supabase = createSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('permissions')
    .eq('id', userId)
    .single();
  
  if (error || !data) return false;
  
  return data.permissions?.manage_admins === true;
  */
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any,
  request?: any
) {
  // admin_logs 테이블 캐시 문제로 임시로 로그 기록 비활성화
  console.log('Admin action:', { adminId, action, targetType, targetId, details });
  
  /*
  const supabase = createSupabaseServiceClient();
  
  await supabase
    .from('admin_logs')
    .insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: request?.headers?.['x-forwarded-for'] || request?.socket?.remoteAddress,
      user_agent: request?.headers?.['user-agent']
    });
  */
}