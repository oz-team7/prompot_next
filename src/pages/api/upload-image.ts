import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

// API 응답 타입 정의
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 파일 크기 제한 설정
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// 허용된 이미지 타입
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 에러 핸들러
const handleError = (res: NextApiResponse, error: any, message: string = '서버 오류가 발생했습니다.') => {
  console.error('Image Upload Error:', error);
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : message
  };
  return res.status(500).json(response);
};

// 성공 응답 헬퍼
const sendSuccess = <T>(res: NextApiResponse, data: T, message?: string) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  return res.status(200).json(response);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // 인증 확인
    let userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using current user for image upload');
        userId = '7b03565d-b472-477c-9321-75bb442ae60e'; // 개발용 사용자 ID
      } else {
        return res.status(401).json({ 
          success: false, 
          error: '인증이 필요합니다.' 
        });
      }
    }

    const { imageData, fileName, folder = 'prompts', resultType } = req.body;

    if (!imageData) {
      return res.status(400).json({ 
        success: false, 
        error: '이미지 데이터가 필요합니다.' 
      });
    }

    // Base64 데이터 검증
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    if (!base64Data) {
      return res.status(400).json({ 
        success: false, 
        error: '유효하지 않은 이미지 데이터입니다.' 
      });
    }

    // 파일 크기 검증
    const fileSize = (base64Data.length * 3) / 4; // Base64 to bytes 대략적 계산
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        success: false, 
        error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.` 
      });
    }

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName ? fileName.split('.').pop() : 'jpg';
    const finalFileName = `${timestamp}_${randomString}.${fileExtension}`;

    // 이미지 버퍼 생성
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Sharp 사용 시 에러 처리 강화
    let processedImage: Buffer;
    try {
      // 동적으로 sharp 임포트 (Vercel 환경 대응)
      const sharp = (await import('sharp')).default;
      
      // 텍스트 유형이 아닌 경우에만 워터마크 추가
      if (resultType !== 'text') {
        const watermarkText = 'Prompot';
        processedImage = await sharp(imageBuffer)
          .metadata()
          .then(async (metadata) => {
            const width = metadata.width || 800;
            const height = metadata.height || 600;
            
            // 워터마크 SVG 생성 (우측 하단)
            const fontSize = Math.max(16, Math.min(24, width / 40)); // 이미지 크기에 따른 폰트 크기
            const padding = Math.max(10, width / 100); // 이미지 크기에 따른 패딩
            
            const watermarkSVG = Buffer.from(`
              <svg width="${width}" height="${height}">
                <text 
                  x="${width - padding}" 
                  y="${height - padding}" 
                  text-anchor="end" 
                  font-family="Arial, sans-serif" 
                  font-size="${fontSize}" 
                  font-weight="bold"
                  fill="white" 
                  stroke="black" 
                  stroke-width="1"
                  opacity="0.8"
                >
                  ${watermarkText}
                </text>
              </svg>
            `);

            return sharp(imageBuffer)
              .composite([
                {
                  input: watermarkSVG,
                  top: 0,
                  left: 0,
                },
              ])
              .toBuffer();
          });
      } else {
        // 텍스트 유형인 경우 워터마크 없이 처리
        processedImage = imageBuffer;
      }
    } catch (sharpError: any) {
      console.error('Sharp 처리 중 에러:', sharpError);
      console.error('Sharp 에러 상세:', sharpError.stack);
      // Sharp 에러 시 원본 이미지 사용
      console.log('워터마크 없이 원본 이미지 업로드를 진행합니다.');
      processedImage = imageBuffer;
    }

    // Supabase Storage에 업로드
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from('prompt-images')
      .upload(`${folder}/${finalFileName}`, processedImage, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('이미지 업로드에 실패했습니다.');
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('prompt-images')
      .getPublicUrl(`${folder}/${finalFileName}`);

    if (!urlData?.publicUrl) {
      throw new Error('이미지 URL 생성에 실패했습니다.');
    }

    const response = {
      url: urlData.publicUrl,
      fileName: finalFileName,
      path: `${folder}/${finalFileName}`,
      size: fileSize,
      uploadedAt: new Date().toISOString()
    };

    return sendSuccess(res, response, '이미지가 성공적으로 업로드되었습니다.');

  } catch (error: any) {
    return handleError(res, error, '이미지 업로드에 실패했습니다.');
  }
}