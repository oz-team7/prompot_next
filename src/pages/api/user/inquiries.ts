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
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No authorization header or invalid format');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  console.log('Token received:', token.substring(0, 20) + '...');
  
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !authData.user) {
    console.error('Auth error:', authError);
    console.error('Auth data:', authData);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('User authenticated:', authData.user.id);

  try {
    console.log('Fetching inquiries for user:', authData.user.id);
    
    // 사용자의 이메일로 문의 내역 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!profile) {
      console.error('User profile not found for ID:', authData.user.id);
      return res.status(404).json({ error: 'User profile not found' });
    }

    console.log('User email:', profile.email);

    // 이메일 또는 user_id로 문의 내역 조회
    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select('*')
      .or(`email.eq.${profile.email},user_id.eq.${authData.user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Inquiries query error:', error);
      throw error;
    }

    console.log('Found inquiries:', inquiries?.length || 0);
    return res.status(200).json(inquiries || []);
  } catch (error) {
    console.error('Error fetching user inquiries:', error);
    return res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
}