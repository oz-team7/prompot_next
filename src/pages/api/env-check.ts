import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    has_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    url_len: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    anon_key_len: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    service_role_len: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4) : null,
  });
}
