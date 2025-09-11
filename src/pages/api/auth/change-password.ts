import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 인증 확인
  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const { currentPassword, newPassword } = req.body;

  // 유효성 검사
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // 현재 사용자의 이메일 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', authUser.id)
      .single();
    
    if (!profile) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    console.log('Attempting password verification for email:', profile.email);
    
    // 현재 비밀번호 검증을 위해 별도의 Supabase 클라이언트 사용
    const { createClient } = require('@supabase/supabase-js');
    const supabaseForAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 현재 비밀번호로 로그인 시도하여 검증
    const { error: signInError } = await supabaseForAuth.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      console.log('Password verification failed:', signInError.message);
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }
    
    console.log('Password verification successful');

    // 원래 사용자의 세션으로 새 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.log('Password update failed:', updateError.message);
      return res.status(500).json({ message: '비밀번호 변경에 실패했습니다.' });
    }

    console.log('Password update successful');
    res.status(200).json({ ok: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
}