import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // prompt-images 버킷 생성
    const { data, error } = await supabase.storage.createBucket('prompt-images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });

    if (error) {
      console.error('Bucket creation error:', error);
      return res.status(500).json({ 
        message: '버킷 생성에 실패했습니다.',
        error: error.message 
      });
    }

    // 버킷 목록 확인
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Buckets list error:', bucketsError);
      return res.status(500).json({ 
        message: '버킷 목록을 가져오는데 실패했습니다.',
        error: bucketsError.message 
      });
    }

    res.status(200).json({ 
      message: 'prompt-images 버킷이 성공적으로 생성되었습니다.',
      buckets: buckets?.map(b => ({
        name: b.name,
        public: b.public,
        file_size_limit: b.file_size_limit,
        allowed_mime_types: b.allowed_mime_types
      })) || []
    });

  } catch (error) {
    console.error('Setup storage error:', error);
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
