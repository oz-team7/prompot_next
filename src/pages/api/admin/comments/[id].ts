import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 관리자 권한 확인
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // 사용자 정보 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 관리자 권한 확인
  const { data: adminEmails, error: adminError } = await supabase
    .from('admin_emails')
    .select('email')
    .eq('email', user.email)
    .single();

  if (adminError || !adminEmails) {
    return res.status(403).json({ error: 'Forbidden - Admin access only' });
  }

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      // 댓글 삭제
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete comment error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete comment' });
      }

      return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}