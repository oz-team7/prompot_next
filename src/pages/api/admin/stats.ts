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

  // 관리자 권한 확인 (여기서는 특정 이메일로 체크)
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.email !== 'admin@prompot.com') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }

  try {
    // 전체 통계
    const totalUsers = await prisma.user.count();
    const totalPrompts = await prisma.prompt.count();
    const publicPrompts = await prisma.prompt.count({
      where: { isPublic: true },
    });
    const totalLikes = await prisma.like.count();
    const totalBookmarks = await prisma.bookmark.count();

    // 오늘 가입한 사용자
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 최근 30일 MAU 계산을 위한 데이터
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 최근 30일간 활성 사용자 (프롬프트 작성, 좋아요, 북마크 활동)
    const activeUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            prompts: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            likes: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            bookmarks: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const mau = activeUsers.length;

    // 카테고리별 프롬프트 통계
    const categoryStats = await prisma.prompt.groupBy({
      by: ['category'],
      _count: true,
    });

    // AI 모델별 통계
    const aiModelStats = await prisma.prompt.groupBy({
      by: ['aiModel'],
      _count: true,
    });

    // 최근 7일간 일별 신규 가입자 (차트용)
    const dailySignups = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailySignups.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // 최근 30일간 일별 활성 사용자 (MAU 차트용)
    const dailyActiveUsers = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const activeCount = await prisma.user.findMany({
        where: {
          OR: [
            {
              prompts: {
                some: {
                  createdAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              },
            },
            {
              likes: {
                some: {
                  createdAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      dailyActiveUsers.push({
        date: date.toISOString().split('T')[0],
        count: activeCount.length,
      });
    }

    res.status(200).json({
      totalUsers,
      totalPrompts,
      publicPrompts,
      totalLikes,
      totalBookmarks,
      todayUsers,
      mau,
      categoryStats,
      aiModelStats,
      dailySignups,
      dailyActiveUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: '통계 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
}