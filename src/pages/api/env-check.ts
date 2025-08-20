import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    has_URL: !!process.env.SUPABASE_URL,
    has_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    url_len: process.env.SUPABASE_URL?.length || 0,
    key_len: process.env.SUPABASE_SERVICE_ROLE?.length || 0,
  });
}
