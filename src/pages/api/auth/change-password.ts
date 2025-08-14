import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import * as cookie from 'cookie';

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

  const { currentPassword, newPassword } = req.body;

  // 유효성 검사
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
  }

  try {
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 현재 비밀번호 확인
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
}