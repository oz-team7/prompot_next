import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

// multipart/form-data 처리를 위한 설정
export const config = {
  api: {
    bodyParser: false,
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

    // multipart/form-data 처리
    const formData = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) {
          reject(new Error('No boundary found'));
          return;
        }
        
        // 간단한 multipart 파싱
        const parts = buffer.toString().split(`--${boundary}`);
        const filePart = parts.find(part => part.includes('Content-Type: image/'));
        
        if (!filePart) {
          reject(new Error('No image file found'));
          return;
        }
        
        const lines = filePart.split('\r\n');
        const contentType = lines.find(line => line.startsWith('Content-Type:'))?.split(': ')[1];
        const contentStart = filePart.indexOf('\r\n\r\n') + 4;
        const contentEnd = filePart.lastIndexOf('\r\n');
        const fileContent = filePart.slice(contentStart, contentEnd);
        
        resolve({
          content: Buffer.from(fileContent, 'binary'),
          type: contentType,
          size: fileContent.length
        });
      });
      req.on('error', reject);
    });

    const { content, type, size } = formData as any;
    
    // 파일 크기 검증 (5MB)
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: '이미지 크기는 5MB 이하여야 합니다.' });
    }

    // 파일 타입 검증
    if (!type || !type.startsWith('image/')) {
      return res.status(400).json({ message: '이미지 파일만 업로드 가능합니다.' });
    }

    const supabase = createSupabaseServiceClient();

    // 파일명 생성
    const fileExt = type.split('/')[1];
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('prompt-images')  // prompt-images 버킷 사용
      .upload(fileName, content, {
        contentType: type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('prompt-images')  // prompt-images 버킷 사용
      .getPublicUrl(fileName);

    res.status(200).json({ 
      message: '이미지 업로드 성공',
      imageUrl: publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
