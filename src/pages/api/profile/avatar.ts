import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    const { imageData, fileName } = req.body;
    
    if (!imageData || !fileName) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    const supabase = createSupabaseServiceClient();
    
    // Base64 이미지 데이터를 Buffer로 변환
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 파일 확장자 추출
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const filePath = `avatars/${userId}/${Date.now()}.${fileExtension}`;
    
    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: `image/${fileExtension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Avatar upload] Storage error:', uploadError);
      return res.status(500).json({ ok: false, error: 'UPLOAD_ERROR' });
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 프로필 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('[Avatar upload] Profile update error:', updateError);
      return res.status(500).json({ ok: false, error: 'UPDATE_ERROR' });
    }

    return res.status(200).json({ 
      ok: true, 
      avatarUrl: publicUrl 
    });

  } catch (error) {
    console.error('[Avatar upload] Unexpected error:', error);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
}
