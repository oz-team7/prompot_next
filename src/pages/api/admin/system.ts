import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';
import { isAdmin, logAdminAction } from '@/lib/admin-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 인증 확인
  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  // 관리자 권한 확인
  if (!await isAdmin(authUser.id)) {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  
  const supabase = createSupabaseServiceClient();

  // GET: 시스템 설정 조회
  if (req.method === 'GET') {
    try {
      // 공지사항 조회
      const { data: announcements } = await supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // 시스템 설정 조회 (설정 테이블이 있다면)
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      // 백업 정보 조회
      const { data: backups } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      res.status(200).json({
        announcements: announcements || [],
        settings: settings || {
          maintenance_mode: false,
          registration_enabled: true,
          max_prompts_per_user: 100,
          max_file_size_mb: 10,
        },
        backups: backups || [],
      });

    } catch (error) {
      console.error('System data error:', error);
      res.status(500).json({ message: '시스템 정보를 가져오는 중 오류가 발생했습니다.' });
    }
  }

  // POST: 공지사항 생성
  else if (req.method === 'POST' && req.query.type === 'announcement') {
    try {
      const { title, content, is_active } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용이 필요합니다.' });
      }

      const { data, error: insertError } = await supabase
        .from('system_announcements')
        .insert({
          title,
          content,
          is_active: is_active ?? true,
          created_by: authUser.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        'CREATE_ANNOUNCEMENT',
        'announcement',
        data.id,
        { title, is_active },
        req
      );

      res.status(200).json({ 
        message: '공지사항이 생성되었습니다.',
        announcement: data
      });

    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ message: '공지사항 생성 중 오류가 발생했습니다.' });
    }
  }

  // PUT: 설정 업데이트
  else if (req.method === 'PUT' && req.query.type === 'settings') {
    try {
      const settings = req.body;

      // 설정 업데이트 (upsert)
      const { data, error: updateError } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // 단일 설정 레코드
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: authUser.id,
        })
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 어드민 로그 기록
      await logAdminAction(
        authUser.id,
        'UPDATE_SETTINGS',
        'settings',
        undefined,
        { settings },
        req
      );

      res.status(200).json({ 
        message: '설정이 업데이트되었습니다.',
        settings: data
      });

    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: '설정 업데이트 중 오류가 발생했습니다.' });
    }
  }

  // POST: 백업 생성
  else if (req.method === 'POST' && req.query.type === 'backup') {
    try {
      // 실제 백업 로직은 별도 프로세스로 처리
      // 여기서는 백업 요청만 기록
      const { data, error: insertError } = await supabase
        .from('system_backups')
        .insert({
          status: 'pending',
          created_by: authUser.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // 백업 프로세스 시작 (실제로는 별도 서비스로 처리)
      // startBackupProcess(data.id);

      res.status(200).json({ 
        message: '백업이 시작되었습니다.',
        backup: data
      });

    } catch (error) {
      console.error('Create backup error:', error);
      res.status(500).json({ message: '백업 생성 중 오류가 발생했습니다.' });
    }
  }

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}