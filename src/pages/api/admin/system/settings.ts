import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SystemSettings {
  maintenance_mode: boolean;
  allow_signup: boolean;
  max_prompts_per_user: number;
  max_file_size_mb: number;
}

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
    case 'GET':
      try {
        // 현재 설정 조회
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: 데이터가 없을 때
          throw error;
        }

        // 기본값 설정
        const defaultSettings: SystemSettings = {
          maintenance_mode: false,
          allow_signup: true,
          max_prompts_per_user: 100,
          max_file_size_mb: 10
        };

        return res.status(200).json(data || defaultSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: '설정을 불러올 수 없습니다.' });
      }

    case 'POST':
    case 'PUT':
      try {
        const { maintenance_mode, allow_signup, max_prompts_per_user, max_file_size_mb } = req.body;

        // 설정 유효성 검사
        if (typeof maintenance_mode !== 'boolean' ||
            typeof allow_signup !== 'boolean' ||
            typeof max_prompts_per_user !== 'number' ||
            typeof max_file_size_mb !== 'number') {
          return res.status(400).json({ error: '유효하지 않은 설정 값입니다.' });
        }

        if (max_prompts_per_user < 1 || max_prompts_per_user > 1000) {
          return res.status(400).json({ error: '사용자당 최대 프롬프트 수는 1-1000 사이여야 합니다.' });
        }

        if (max_file_size_mb < 1 || max_file_size_mb > 100) {
          return res.status(400).json({ error: '최대 파일 크기는 1-100MB 사이여야 합니다.' });
        }

        const settingsData: SystemSettings = {
          maintenance_mode,
          allow_signup,
          max_prompts_per_user,
          max_file_size_mb
        };

        // 먼저 기존 설정이 있는지 확인
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .single();

        let result;
        if (existing) {
          // 업데이트
          result = await supabase
            .from('system_settings')
            .update({
              ...settingsData,
              updated_at: new Date().toISOString(),
              updated_by: authUser.id
            })
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          // 새로 생성
          result = await supabase
            .from('system_settings')
            .insert({
              ...settingsData,
              created_at: new Date().toISOString(),
              created_by: authUser.id,
              updated_at: new Date().toISOString(),
              updated_by: authUser.id
            })
            .select()
            .single();
        }

        if (result.error) {
          throw result.error;
        }

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'update_system_settings',
            description: '시스템 설정 변경',
            metadata: settingsData
          });

        return res.status(200).json({
          message: '설정이 저장되었습니다.',
          settings: result.data
        });
      } catch (error) {
        console.error('Error saving settings:', error);
        return res.status(500).json({ error: '설정 저장에 실패했습니다.' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}