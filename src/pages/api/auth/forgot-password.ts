import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

// 임시 비밀번호 생성 함수
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // 최소 8자, 최대 12자의 임시 비밀번호 생성
  const length = Math.floor(Math.random() * 5) + 8; // 8-12자
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { email, username } = req.body;

    // 입력값 검증
    if (!email || !username) {
      return res.status(400).json({ 
        message: '이메일과 사용자명을 모두 입력해주세요.' 
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: '올바른 이메일 형식이 아닙니다.' 
      });
    }

    // 사용자명 길이 검증
    if (username.length < 2) {
      return res.status(400).json({ 
        message: '사용자명은 2자 이상이어야 합니다.' 
      });
    }

    // profiles 테이블에서 사용자 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, is_suspended, suspension_end_date')
      .eq('email', email.toLowerCase().trim())
      .eq('name', username.trim())
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        message: '입력한 이메일과 사용자명에 해당하는 계정을 찾을 수 없습니다.' 
      });
    }

    // 사용자가 정지된 상태인지 확인
    if (profile.is_suspended && profile.suspension_end_date && new Date(profile.suspension_end_date) > new Date()) {
      return res.status(403).json({ 
        message: '정지된 계정입니다. 관리자에게 문의하세요.' 
      });
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword();
    
    // Supabase Admin API를 사용하여 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError);
      return res.status(500).json({ 
        message: '비밀번호 업데이트 중 오류가 발생했습니다.' 
      });
    }

    // 성공 응답 (임시 비밀번호를 클라이언트에 전달)
    return res.status(200).json({
      message: '임시 비밀번호가 생성되었습니다.',
      tempPassword: tempPassword,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name
      }
    });

  } catch (error) {
    console.error('비밀번호 찾기 오류:', error);
    return res.status(500).json({ 
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    });
  }
}
