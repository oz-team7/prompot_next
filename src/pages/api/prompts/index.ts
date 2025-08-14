import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 옵셔널 인증 확인 (로그인한 사용자의 좋아요/북마크 정보를 위해)
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies['auth-token'];
  let userId: string | null = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      userId = decoded.userId;
    }
  }

  try {
    const { category, author, isPublic } = req.query;

    const where: any = {};
    
    // 공개 프롬프트만 가져오기 (기본값)
    if (isPublic !== 'false') {
      where.isPublic = true;
    }

    // 특정 작성자의 프롬프트 (마이페이지용)
    if (author && userId) {
      where.authorId = userId;
      // 본인의 프롬프트는 비공개도 볼 수 있음
      delete where.isPublic;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const prompts = await prisma.prompt.findMany({
      where,
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
        likes: userId ? {
          where: {
            userId,
          },
        } : false,
        bookmarks: userId ? {
          where: {
            userId,
          },
        } : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedPrompts = prompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      tags: JSON.parse(prompt.tags),
      aiModel: prompt.aiModel,
      previewImage: prompt.previewImage,
      isPublic: prompt.isPublic,
      author: prompt.author.name,
      authorId: prompt.author.id,
      date: prompt.createdAt.toISOString().split('T')[0].replace(/-/g, '.'),
      likes: prompt._count.likes,
      bookmarks: prompt._count.bookmarks,
      isLiked: userId ? prompt.likes.length > 0 : false,
      isBookmarked: userId ? prompt.bookmarks.length > 0 : false,
      rating: 0, // 평점 기능은 추후 구현
    }));

    res.status(200).json({ prompts: formattedPrompts });
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({ message: '프롬프트 목록을 가져오는 중 오류가 발생했습니다.' });
  }
}