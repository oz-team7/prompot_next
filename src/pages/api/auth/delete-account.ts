import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    const supabase = createClient();

    // 토큰에서 사용자 정보 추출
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    // 비밀번호 확인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    // 사용자 관련 데이터 삭제
    const userId = user.id;

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
      console.error('User deletion error:', deleteError);
      return res.status(500).json({ message: '계정 삭제 중 오류가 발생했습니다.' });
    }

    return res.status(200).json({ 
      message: '계정이 성공적으로 삭제되었습니다.',
      ok: true 
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ 
      message: '계정 삭제 중 오류가 발생했습니다.' 
    });
  }
}
