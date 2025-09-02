import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const supabase = createSupabaseServiceClient();
    
    // 사용자 프로필 정보 가져오기 (avatar_url 포함)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ message: '프로필 정보를 가져오는데 실패했습니다.' });
    }

    // Supabase Storage 버킷 정보 확인
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    console.log('Available buckets:', buckets);
    console.log('Bucket error:', bucketError);

    res.status(200).json({ 
      profile,
      storage: {
        buckets: buckets?.map(b => b.name) || [],
        bucketError: bucketError?.message || null
      }
    });
  } catch (error) {
    console.error('Test profile error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
