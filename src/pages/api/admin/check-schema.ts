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
    
    res.status(200).json({ 
      tables,
      message: '스키마 정보를 성공적으로 가져왔습니다.'
    });
  } catch (error) {
    console.error('Schema check error:', error);
    res.status(500).json({ 
      message: '스키마 확인 중 오류가 발생했습니다.', 
      error: (error as Error).message 
    });
  }
}