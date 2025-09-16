import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import * as cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Supabase Auth로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 에러 타입에 따라 적절한 메시지 반환
      if (error.message.includes('Invalid login credentials')) {
        // 먼저 이메일이 존재하는지 확인
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        if (!profile) {
          return res.status(401).json({ message: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' });
        } else {
          return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
        }
      }
      
      return res.status(401).json({ message: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ message: '로그인에 실패했습니다.' });
    }

    // 사용자 정지 상태 확인
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_suspended, suspension_reason, suspension_end_date')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ message: '프로필 정보를 가져오는 중 오류가 발생했습니다.' });
    }

    // 정지된 사용자인 경우
    if (userProfile?.is_suspended) {
      // 로그아웃 처리
      await supabase.auth.signOut();
      
      let suspensionMessage = '계정이 정지되었습니다.';
      if (userProfile.suspension_reason) {
        suspensionMessage += `\n사유: ${userProfile.suspension_reason}`;
      }
      if (userProfile.suspension_end_date) {
        const endDate = new Date(userProfile.suspension_end_date);
        const now = new Date();
        
        if (endDate > now) {
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          suspensionMessage += `\n정지 해제까지 ${daysLeft}일 남았습니다.`;
        } else {
          // 정지 기간이 만료된 경우 정지 해제
          await supabase
            .from('profiles')
            .update({
              is_suspended: false,
              suspension_reason: null,
              suspension_end_date: null
            })
            .eq('id', data.user.id);
        }
      } else {
        suspensionMessage += '\n영구 정지 상태입니다.';
      }
      
      return res.status(403).json({ 
        message: suspensionMessage,
        isSuspended: true,
        suspensionReason: userProfile.suspension_reason,
        suspensionEndDate: userProfile.suspension_end_date
      });
    }

    // 프로필 정보 가져오기
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url')
      .eq('id', data.user.id)
      .single();

    if (profileFetchError || !profile) {
      return res.status(500).json({ message: '사용자 정보를 가져올 수 없습니다.' });
    }

    // 클라이언트에 토큰과 사용자 정보 전달
    res.status(200).json({
      ok: true,
      token: data.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}