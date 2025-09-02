import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // Storage 버킷 목록 확인
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Storage buckets error:', bucketsError);
      return res.status(500).json({
        ok: false,
        error: 'STORAGE_ERROR',
        message: bucketsError.message
      });
    }

    // avatars 버킷 존재 확인
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      return res.status(200).json({
        ok: false,
        message: 'avatars 버킷이 존재하지 않습니다. Supabase 대시보드에서 생성해주세요.',
        buckets: buckets?.map(b => b.name) || []
      });
    }

    // 버킷 내 파일 목록 확인 (테스트용)
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 5 });

    if (filesError) {
      console.error('Storage files error:', filesError);
      return res.status(500).json({
        ok: false,
        error: 'FILES_ERROR',
        message: filesError.message
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Storage 연결 성공',
      bucket: {
        name: avatarsBucket.name,
        public: avatarsBucket.public,
        file_size_limit: avatarsBucket.file_size_limit,
        allowed_mime_types: avatarsBucket.allowed_mime_types
      },
      files: files || []
    });

  } catch (error) {
    console.error('Storage test error:', error);
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
