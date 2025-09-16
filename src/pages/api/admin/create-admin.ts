import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

// 이 API는 초기 어드민 계정 생성을 위한 일회성 엔드포인트입니다.
// 프로덕션에서는 환경 변수로 보호하거나 삭제해야 합니다.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 개발 환경에서만 실행 가능
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'This endpoint is disabled in production' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { secretKey } = req.body;

  // 간단한 시크릿 키 검증 (개발용)
  if (secretKey !== 'create-admin-2024') {
    return res.status(403).json({ message: 'Invalid secret key' });
  }

  try {
    const supabase = createSupabaseServiceClient();

    // 어드민 이메일과 비밀번호
    const adminEmail = 'admin@prompot.com';
    const adminPassword = 'Admin@123!'; // 프로덕션에서는 더 강력한 비밀번호 사용

    // 이미 어드민 계정이 있는지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingProfile) {
      return res.status(400).json({ message: '어드민 계정이 이미 존재합니다.' });
    }

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // 이메일 확인 스킵
      user_metadata: {
        name: 'PROMPOT Admin',
        role: 'admin'
      }
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return res.status(500).json({ message: '어드민 계정 생성 실패', error: authError?.message });
    }

    // profiles 테이블에 어드민 정보 추가
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: 'PROMPOT Admin',
        role: 'admin', // role 컬럼이 있다면
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Auth 사용자는 생성되었지만 프로필 생성 실패 시 Auth 사용자도 삭제
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ message: '프로필 생성 실패', error: profileError.message });
    }

    res.status(200).json({ 
      message: '어드민 계정이 성공적으로 생성되었습니다.',
      email: adminEmail,
      note: '비밀번호는 Admin@123! 입니다. 즉시 변경하세요.'
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: '어드민 계정 생성 중 오류가 발생했습니다.' });
  }
}