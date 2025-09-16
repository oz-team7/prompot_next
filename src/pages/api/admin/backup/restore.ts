import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/auth-utils';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import formidable from 'formidable';
import AdmZip from 'adm-zip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 인증 확인
  const authUser = await checkAdminAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'temp'),
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.backup) ? files.backup[0] : files.backup;

    if (!uploadedFile) {
      return res.status(400).json({ error: '백업 파일이 필요합니다.' });
    }

    // ZIP 파일 추출
    const zip = new AdmZip(uploadedFile.filepath);
    const zipEntries = zip.getEntries();

    let backupData: any = null;

    // data.json 파일 찾기 및 읽기
    for (const entry of zipEntries) {
      if (entry.entryName === 'data.json') {
        const content = entry.getData().toString('utf8');
        backupData = JSON.parse(content);
        break;
      }
    }

    if (!backupData) {
      return res.status(400).json({ error: '유효한 백업 파일이 아닙니다.' });
    }

    // 백업 버전 확인
    if (backupData.version !== '1.0') {
      return res.status(400).json({ error: '지원하지 않는 백업 버전입니다.' });
    }

    // 복원 옵션
    const restoreMode = fields.mode ? fields.mode[0] : 'merge'; // 'merge' or 'replace'
    const restoreTables = fields.tables ? JSON.parse(fields.tables[0] as string) : Object.keys(backupData.tables);

    // 복원 결과
    const restoreResult: any = {
      success: true,
      restored_tables: [],
      errors: []
    };

    // 각 테이블 복원
    for (const table of restoreTables) {
      if (!backupData.tables[table]) {
        continue;
      }

      try {
        if (restoreMode === 'replace') {
          // 기존 데이터 삭제 (주의: 관계 제약 조건 고려 필요)
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

          if (deleteError && deleteError.code !== 'PGRST116') {
            console.error(`Error deleting ${table}:`, deleteError);
            restoreResult.errors.push({
              table: table,
              error: deleteError.message,
              phase: 'delete'
            });
            continue;
          }
        }

        // 데이터 복원
        const data = backupData.tables[table];
        if (data && data.length > 0) {
          const { error: insertError } = await supabase
            .from(table)
            .upsert(data, {
              onConflict: 'id',
              ignoreDuplicates: restoreMode === 'merge'
            });

          if (insertError) {
            console.error(`Error restoring ${table}:`, insertError);
            restoreResult.errors.push({
              table: table,
              error: insertError.message,
              phase: 'insert'
            });
          } else {
            restoreResult.restored_tables.push({
              table: table,
              count: data.length
            });
          }
        } else {
          restoreResult.restored_tables.push({
            table: table,
            count: 0
          });
        }
      } catch (error: any) {
        console.error(`Error restoring table ${table}:`, error);
        restoreResult.errors.push({
          table: table,
          error: error.message,
          phase: 'unknown'
        });
      }
    }

    // 임시 파일 정리
    fs.unlinkSync(uploadedFile.filepath);

    // 활동 로그 기록
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: authUser.id,
        action: 'restore_backup',
        description: `백업 복원 (${restoreMode} 모드)`,
        metadata: { 
          backup_timestamp: backupData.timestamp,
          restored_tables: restoreTables,
          errors: restoreResult.errors
        }
      });

    // 복원 성공 여부 확인
    if (restoreResult.errors.length > 0) {
      return res.status(200).json({
        message: '백업 복원이 부분적으로 완료되었습니다.',
        result: restoreResult,
        warnings: true
      });
    }

    return res.status(200).json({
      message: '백업이 성공적으로 복원되었습니다.',
      result: restoreResult
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return res.status(500).json({ error: '백업 복원에 실패했습니다.' });
  }
}