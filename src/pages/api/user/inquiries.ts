import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 인증 확인
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 사용자의 이메일로 문의 내역 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', authData.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // 이메일 또는 user_id로 문의 내역 조회
    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select('*')
      .or(`email.eq.${profile.email},user_id.eq.${authData.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(inquiries || []);
  } catch (error) {
    console.error('Error fetching user inquiries:', error);
    return res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
}