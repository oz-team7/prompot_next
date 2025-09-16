import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/auth-utils';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { promisify } from 'util';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 인증 확인
  const authUser = await checkAdminAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  switch (req.method) {
    case 'POST':
      try {
        const { type } = req.body; // 'full' or 'data-only'
        
        if (!type || !['full', 'data-only'].includes(type)) {
          return res.status(400).json({ error: '잘못된 백업 타입입니다.' });
        }

        // 백업 디렉토리 생성
        const backupDir = path.join(process.cwd(), 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupName = `prompot-backup-${type}-${timestamp}`;
        const tempDir = path.join(backupDir, backupName);

        try {
          await mkdir(backupDir, { recursive: true });
          await mkdir(tempDir, { recursive: true });
        } catch (error) {
          console.error('Error creating backup directory:', error);
        }

        // 데이터베이스 테이블 목록
        const tables = [
          'profiles',
          'prompts',
          'prompt_likes',
          'bookmarks',
          'bookmark_categories',
          'reports',
          'user_sanctions',
          'admin_activity_logs',
          'system_settings',
          'announcements'
        ];

        // 각 테이블 데이터 백업
        const backupData: any = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          type: type,
          tables: {}
        };

        for (const table of tables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*');
            
            if (error) {
              console.error(`Error backing up table ${table}:`, error);
              continue;
            }

            backupData.tables[table] = data || [];
          } catch (error) {
            console.error(`Error backing up table ${table}:`, error);
          }
        }

        // 백업 데이터를 JSON 파일로 저장
        const dataPath = path.join(tempDir, 'data.json');
        await writeFile(dataPath, JSON.stringify(backupData, null, 2));

        // 파일 백업 (full 타입인 경우만)
        if (type === 'full') {
          // TODO: 실제 파일 스토리지 백업 구현
          // Supabase Storage 또는 로컬 파일 시스템에서 파일 복사
        }

        // ZIP 파일 생성
        const output = fs.createWriteStream(path.join(backupDir, `${backupName}.zip`));
        const archive = archiver('zip', {
          zlib: { level: 9 } // 최대 압축
        });

        archive.on('error', (err) => {
          throw err;
        });

        archive.pipe(output);
        archive.directory(tempDir, false);
        await archive.finalize();

        // 임시 디렉토리 정리
        fs.rmSync(tempDir, { recursive: true, force: true });

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'create_backup',
            description: `${type === 'full' ? '전체' : '데이터'} 백업 생성`,
            metadata: { backup_name: backupName }
          });

        // 백업 파일 다운로드 URL 생성
        const downloadUrl = `/api/admin/backup/download?file=${backupName}.zip`;

        return res.status(200).json({
          message: '백업이 생성되었습니다.',
          backup: {
            name: backupName,
            type: type,
            size: backupData.tables ? Object.keys(backupData.tables).reduce((acc, table) => acc + backupData.tables[table].length, 0) : 0,
            created_at: new Date().toISOString(),
            download_url: downloadUrl
          }
        });
      } catch (error) {
        console.error('Error creating backup:', error);
        return res.status(500).json({ error: '백업 생성에 실패했습니다.' });
      }

    case 'GET':
      try {
        // 백업 목록 조회
        const backupDir = path.join(process.cwd(), 'backups');
        
        try {
          await mkdir(backupDir, { recursive: true });
        } catch (error) {
          // 디렉토리가 이미 존재하면 무시
        }

        const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.zip'));
        
        const backups = files.map(file => {
          const stats = fs.statSync(path.join(backupDir, file));
          const [, type, ...timestampParts] = file.replace('.zip', '').split('-');
          
          return {
            name: file.replace('.zip', ''),
            file: file,
            type: type === 'full' ? 'full' : 'data-only',
            size: stats.size,
            created_at: stats.mtime.toISOString(),
            download_url: `/api/admin/backup/download?file=${file}`
          };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return res.status(200).json({
          backups: backups
        });
      } catch (error) {
        console.error('Error listing backups:', error);
        return res.status(500).json({ error: '백업 목록 조회에 실패했습니다.' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}