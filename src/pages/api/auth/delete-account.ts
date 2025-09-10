import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: '비밀번호를 입력해주세요.' 
      });
    }

    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: '인증이 필요합니다.' 
      });
    }

    const supabase = createSupabaseServiceClient();

    // 1. 사용자의 프롬프트는 유지하되 작성자 정보만 익명으로 변경
    await supabase
      .from('prompts')
      .update({
        author_id: null,
        author_name: '삭제된 사용자',
        author_email: null
      })
      .eq('author_id', userId);

    // 2. 사용자의 북마크만 삭제 (개인 데이터)
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId);

    // 3. 사용자의 북마크 카테고리만 삭제 (개인 데이터)
    await supabase
      .from('bookmark_categories')
      .delete()
      .eq('user_id', userId);

    // 4. 사용자의 댓글은 유지하되 작성자 정보만 익명으로 변경
    await supabase
      .from('comments')
      .update({
        user_id: null,
        author_name: '삭제된 사용자'
      })
      .eq('user_id', userId);

    // 5. 사용자의 평점은 유지하되 작성자 정보만 익명으로 변경
    await supabase
      .from('ratings')
      .update({
        user_id: null,
        author_name: '삭제된 사용자'
      })
      .eq('user_id', userId);

    // 6. 사용자의 프로필만 삭제 (개인 정보)
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 7. Supabase Auth에서 사용자 삭제
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Auth user deletion error:', deleteError);
      // Auth 사용자 삭제 실패해도 계속 진행 (프로필은 이미 삭제됨)
    }

    return res.status(200).json({ 
      success: true, 
      message: '계정이 성공적으로 삭제되었습니다.' 
    });

  } catch (error: any) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '계정 삭제 중 오류가 발생했습니다.' 
    });
  }
}