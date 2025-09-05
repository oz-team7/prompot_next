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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 인증 확인 - 개발 모드에서 우회 가능
    let userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using current user for image upload');
        userId = '7b03565d-b472-477c-9321-75bb442ae60e'; // 현재 사용자 ID 사용
      } else {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }
    }

    const { imageData, fileName } = req.body;
    
    if (!imageData || !fileName) {
      return res.status(400).json({ message: '이미지 데이터와 파일명이 필요합니다.' });
    }

    // Base64 이미지 데이터를 Buffer로 변환
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 파일 크기 검증 (5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: '이미지 크기는 5MB 이하여야 합니다.' });
    }

    // 파일 확장자 추출
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const contentType = `image/${fileExtension}`;
    
    // 파일명 생성
    const finalFileName = `${userId}/${Date.now()}.${fileExtension}`;

    const supabase = createSupabaseServiceClient();

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('prompt-images')
      .upload(finalFileName, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('prompt-images')
      .getPublicUrl(finalFileName);

    res.status(200).json({ 
      message: '이미지 업로드 성공',
      imageUrl: publicUrl,
      fileName: finalFileName
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
