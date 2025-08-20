// src/pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

type Json = { ok?: boolean; error?: string; userId?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  // 1) 메서드 가드
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' }); // ← JSON 보장
  }

  try {
    // 2) 바디 파싱 & 검증
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password가 필요합니다.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    }

    // 3) 환경변수 확인
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE; // 서버 전용 키
    if (!url || !serviceKey) {
      return res.status(500).json({ error: 'Server env not configured (SUPABASE_URL / SERVICE_ROLE)' });
    }

    // 4) 서비스 키로 Admin 클라이언트 생성
    const supabase = createClient(url, serviceKey);

    // 5) 유저 생성 (email_confirm true: 즉시 활성화)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createErr) {
      return res.status(400).json({ error: `auth createUser: ${createErr.message}` });
    }
    const userId = created?.user?.id;
    if (!userId) {
      return res.status(500).json({ error: '사용자 ID를 가져오지 못했습니다.' });
    }

    // 6) (선택) 프로필 테이블에 추가
    // 테이블/정책이 없다면 이 블록은 주석 처리해도 됩니다.
    // const { error: insertErr } = await supabase
    //   .from('profiles')
    //   .insert({ id: userId, name, email });
    // if (insertErr) {
    //   return res.status(400).json({ error: `profiles insert: ${insertErr.message}` });
    // }

    return res.status(200).json({ ok: true, userId });
  } catch (e: any) {
    // 예외도 JSON으로
    return res.status(500).json({ error: e?.message || 'unknown server error' });
  }
}
