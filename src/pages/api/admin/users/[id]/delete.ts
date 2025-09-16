import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { checkAdminAuth } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 관리자 인증 확인
    const authUser = await checkAdminAuth(req);
    if (!authUser) {
      return res.status(401).json({ 
        success: false, 
        message: '관리자 권한이 필요합니다.' 
      });
    }

    const { id: userId } = req.query;
    const { preserveContent = false } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '유효한 사용자 ID가 필요합니다.' 
      });
    }

    // 자기 자신은 삭제 불가
    if (userId === authUser.id) {
      return res.status(400).json({ 
        success: false, 
        message: '자기 자신은 삭제할 수 없습니다.' 
      });
    }

    const supabase = createSupabaseServiceClient();

    // 사용자 정보 확인
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (!userProfile || profileError) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
    }

    // 관리자 로그 기록
    await supabase.from('admin_logs').insert({
      admin_id: authUser.id,
      action: 'delete_user',
      target_type: 'user',
      target_id: userId,
      details: {
        deleted_user_email: userProfile.email,
        deleted_user_name: userProfile.name,
        preserve_content: preserveContent
      },
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    if (preserveContent) {
      // 콘텐츠는 유지하고 사용자 정보만 익명화
      
      // 1. 프롬프트 작성자 정보 익명화
      await supabase
        .from('prompts')
        .update({
          author_id: null,
          author_name: '삭제된 사용자',
          author_email: null
        })
        .eq('author_id', userId);

      // 2. 댓글 작성자 정보 익명화
      await supabase
        .from('prompt_comments')
        .update({
          user_id: null,
          author_name: '삭제된 사용자'
        })
        .eq('user_id', userId);

      // 3. 평점 작성자 정보 익명화
      await supabase
        .from('prompt_ratings')
        .update({
          user_id: null,
          author_name: '삭제된 사용자'
        })
        .eq('user_id', userId);

    } else {
      // 모든 사용자 데이터 삭제
      
      // 1. 사용자의 프롬프트 삭제
      await supabase
        .from('prompts')
        .delete()
        .eq('author_id', userId);

      // 2. 사용자의 댓글 삭제
      await supabase
        .from('prompt_comments')
        .delete()
        .eq('user_id', userId);

      // 3. 사용자의 평점 삭제
      await supabase
        .from('prompt_ratings')
        .delete()
        .eq('user_id', userId);
    }

    // 4. 사용자의 북마크 삭제 (항상 삭제)
    await supabase
      .from('prompt_bookmarks')
      .delete()
      .eq('user_id', userId);

    // 5. 사용자의 북마크 카테고리 삭제
    await supabase
      .from('bookmark_categories')
      .delete()
      .eq('user_id', userId);

    // 6. 사용자의 좋아요 삭제
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId);

    // 7. 사용자의 제재 기록 삭제
    await supabase
      .from('user_sanctions')
      .delete()
      .eq('user_id', userId);

    // 8. 사용자의 신고 삭제
    await supabase
      .from('reports')
      .delete()
      .eq('reporter_id', userId);

    // 9. 사용자의 프로필 삭제
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 10. Supabase Auth에서 사용자 삭제
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Auth user deletion error:', deleteError);
      // Auth 사용자 삭제 실패해도 계속 진행 (프로필은 이미 삭제됨)
    }

    return res.status(200).json({ 
      success: true, 
      message: `사용자가 성공적으로 삭제되었습니다. (콘텐츠 ${preserveContent ? '보존' : '삭제'})`,
      details: {
        userId,
        userEmail: userProfile.email,
        preserveContent
      }
    });

  } catch (error: any) {
    console.error('User deletion error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '사용자 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}