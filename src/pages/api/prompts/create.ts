import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as cookie from 'cookie';

// API body size 제한 설정 (4MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 인증 확인
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
  
  const { title, description, content, category, tags, aiModel, previewImage, isPublic } = req.body;

  // 유효성 검사
  if (!title || !description || !content || !category || !aiModel) {
    return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' });
  }

  try {
    const prompt = await prisma.prompt.create({
      data: {
        title,
        description,
        content,
        category,
        tags: JSON.stringify(tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []),
        aiModel,
        previewImage: previewImage || null,
        isPublic: isPublic ?? true,
        authorId: decoded.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    res.status(201).json({
      prompt: {
        ...prompt,
        tags: JSON.parse(prompt.tags),
        likes: prompt._count.likes,
        bookmarks: prompt._count.bookmarks,
        author: prompt.author.name,
        date: prompt.createdAt.toISOString().split('T')[0].replace(/-/g, '.'),
        rating: 0,
      },
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({ message: '프롬프트 생성 중 오류가 발생했습니다.' });
  }
}