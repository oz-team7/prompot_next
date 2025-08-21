// src/pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// 항상 JSON만 돌려주도록 래퍼
function sendJSON(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendJSON(res, 405, { ok: false, error: 'Method Not Allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return sendJSON(res, 500, { ok: false, error: 'Missing Supabase env (URL/ANON)' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return sendJSON(res, 400, { ok: false, error: 'email and password are required' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return sendJSON(res, 401, { ok: false, error: error.message });
    }

    // 필요하면 여기서 쿠키에 토큰 저장 로직 추가 가능
    // res.setHeader('Set-Cookie', ...)

    return sendJSON(res, 200, {
      ok: true,
      user: data.user,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  } catch (e: any) {
    return sendJSON(res, 500, { ok: false, error: e?.message || 'Login failed' });
  }
}
