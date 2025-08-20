import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: '이름/이메일/비밀번호는 필수입니다.' });
  }

  try {
    // 1) 서버에서 안전하게 유저 생성 (이메일 확인을 건너뛰고 바로 사용하려면 email_confirm: true)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증 생략하고 즉시 활성화 (원하면 false로)
      user_metadata: { name },
    });

    if (error) return res.status(400).json({ message: error.message });

    // 2) (선택) profiles 같은 RLS 테이블에 프로필 행 만들어두기
    //    Supabase에서 profiles 테이블 만들고 RLS ON + 정책 구성했다면:
    // const { error: profileErr } = await supabaseAdmin
    //   .from('profiles')
    //   .insert({ id: data.user?.id, name });
    // if (profileErr) console.warn('profiles insert error', profileErr);

    return res.status(201).json({ ok: true, user: data.user });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message ?? '서버 오류' });
  }
}
