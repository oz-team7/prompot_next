import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    const { name, avatar_url } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
    }

    const supabase = createSupabaseServiceClient();
    
    const updateData: any = { name: name.trim() };
    if (avatar_url) {
      updateData.avatar_url = avatar_url;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, avatar_url')
      .single();

    if (error) {
      console.error('[Profile update] error:', error);
      return res.status(500).json({ ok: false, error: 'UPDATE_ERROR' });
    }

    return res.status(200).json({ 
      ok: true, 
      profile 
    });

  } catch (error) {
    console.error('[Profile update] Unexpected error:', error);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
}
