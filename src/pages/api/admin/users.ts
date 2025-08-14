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

  // 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.email !== 'admin@prompot.com') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    // 검색 조건
    const whereCondition = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    } : {};

    // 전체 사용자 수
    const totalCount = await prisma.user.count({
      where: whereCondition,
    });

    // 사용자 목록 조회
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            prompts: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 최근 30일 활동 확인
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const recentActivity = await prisma.user.findFirst({
          where: {
            id: user.id,
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
            ],
          },
        });

        return {
          ...user,
          isActive: !!recentActivity,
          joinDate: user.createdAt.toISOString().split('T')[0],
        };
      })
    );

    res.status(200).json({
      users: usersWithActivity,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: '사용자 목록을 가져오는 중 오류가 발생했습니다.' });
  }
}