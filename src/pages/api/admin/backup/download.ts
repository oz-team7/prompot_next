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

  if (req.method !== 'GET') {
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

    // 파일 다운로드
    const fileStream = fs.createReadStream(filePath);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size.toString());
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading backup:', error);
    return res.status(500).json({ error: '백업 다운로드에 실패했습니다.' });
  }
}