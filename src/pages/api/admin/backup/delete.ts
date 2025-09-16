import { NextApiRequest, NextApiResponse } from 'next';
import { checkAdminAuth } from '@/lib/auth-utils';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 인증 확인
  const authUser = await checkAdminAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file } = req.query;
    
    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: '파일명이 필요합니다.' });
    }

    // 보안: 파일명에 경로 분리자가 있는지 확인
    if (file.includes('/') || file.includes('\\') || file.includes('..')) {
      return res.status(400).json({ error: '잘못된 파일명입니다.' });
    }

    // 백업 파일 경로
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, file);

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '백업 파일을 찾을 수 없습니다.' });
    }

    // 파일 삭제
    fs.unlinkSync(filePath);

    return res.status(200).json({ message: '백업 파일이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return res.status(500).json({ error: '백업 삭제에 실패했습니다.' });
  }
}