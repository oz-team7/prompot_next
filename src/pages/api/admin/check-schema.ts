import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

  try {
    const supabase = createSupabaseServiceClient();
    
    const tables: Record<string, any> = {};
    
    // profiles 테이블 체크
    const { data: profileSample, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (!profileError && profileSample && profileSample.length > 0) {
      tables['profiles'] = {
        columns: Object.keys(profileSample[0]),
        sample: profileSample[0]
      };
    }
    
    // prompts 테이블 체크
    const { data: promptSample, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .limit(1);
    
    if (!promptError && promptSample && promptSample.length > 0) {
      tables['prompts'] = {
        columns: Object.keys(promptSample[0]),
        sample: promptSample[0],
        idType: typeof promptSample[0].id
      };
    }
    
    // likes 테이블 체크
    const { data: likeSample, error: likeError } = await supabase
      .from('likes')
      .select('*')
      .limit(1);
    
    if (!likeError && likeSample && likeSample.length > 0) {
      tables['likes'] = {
        columns: Object.keys(likeSample[0]),
        sample: likeSample[0]
      };
    }
    
    // bookmarks 테이블 체크
    const { data: bookmarkSample, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(1);
    
    if (!bookmarkError && bookmarkSample && bookmarkSample.length > 0) {
      tables['bookmarks'] = {
        columns: Object.keys(bookmarkSample[0]),
        sample: bookmarkSample[0]
      };
    } else {
      // prompt_bookmarks 테이블 체크
      const { data: promptBookmarkSample, error: promptBookmarkError } = await supabase
        .from('prompt_bookmarks')
        .select('*')
        .limit(1);
      
      if (!promptBookmarkError && promptBookmarkSample && promptBookmarkSample.length > 0) {
        tables['prompt_bookmarks'] = {
          columns: Object.keys(promptBookmarkSample[0]),
          sample: promptBookmarkSample[0]
        };
      }
    }

    // admin_notifications 테이블 체크
    const { data: adminNotificationsSample, error: adminNotificationsError } = await supabase
      .from('admin_notifications')
      .select('*')
      .limit(1);
    
    if (!adminNotificationsError && adminNotificationsSample) {
      tables['admin_notifications'] = {
        exists: true,
        columns: adminNotificationsSample.length > 0 ? Object.keys(adminNotificationsSample[0]) : [],
        sample: adminNotificationsSample[0] || null,
        error: null
      };
    } else {
      tables['admin_notifications'] = {
        exists: false,
        error: adminNotificationsError?.message || 'Table not found'
      };
    }

    // inquiries 테이블 체크
    const { data: inquiriesSample, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('*')
      .limit(1);
    
    if (!inquiriesError && inquiriesSample) {
      tables['inquiries'] = {
        exists: true,
        columns: inquiriesSample.length > 0 ? Object.keys(inquiriesSample[0]) : [],
        sample: inquiriesSample[0] || null,
        error: null
      };
    } else {
      tables['inquiries'] = {
        exists: false,
        error: inquiriesError?.message || 'Table not found'
      };
    }

    // system_settings 테이블 체크
    const { data: systemSettingsSample, error: systemSettingsError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);
    
    if (!systemSettingsError && systemSettingsSample) {
      tables['system_settings'] = {
        exists: true,
        columns: systemSettingsSample.length > 0 ? Object.keys(systemSettingsSample[0]) : [],
        sample: systemSettingsSample[0] || null,
        error: null
      };
    } else {
      tables['system_settings'] = {
        exists: false,
        error: systemSettingsError?.message || 'Table not found'
      };
    }

    // announcements 테이블 체크
    const { data: announcementsSample, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (!announcementsError && announcementsSample) {
      tables['announcements'] = {
        exists: true,
        columns: announcementsSample.length > 0 ? Object.keys(announcementsSample[0]) : [],
        sample: announcementsSample[0] || null,
        error: null
      };
    } else {
      tables['announcements'] = {
        exists: false,
        error: announcementsError?.message || 'Table not found'
      };
    }
    
    res.status(200).json({ 
      tables,
      message: '스키마 정보를 성공적으로 가져왔습니다.',
      missingTables: Object.entries(tables)
        .filter(([_, info]: any) => info.exists === false)
        .map(([name]) => name)
    });
  } catch (error) {
    console.error('Schema check error:', error);
    res.status(500).json({ 
      message: '스키마 확인 중 오류가 발생했습니다.', 
      error: (error as Error).message 
    });
  }
}