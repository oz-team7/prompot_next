import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 인증 확인
  const authUser = await checkAdminAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { id } = req.query;
  const announcementId = id as string;

  switch (req.method) {
    case 'PUT':
      try {
        const { title, content, is_active } = req.body;

        // 유효성 검사
        if (!title || !content) {
          return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
        }

        const { data, error } = await supabase
          .from('announcements')
          .update({
            title,
            content,
            is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', announcementId)
          .select()
          .single();

        if (error) {
          console.error('Error updating announcement:', error);
          throw error;
        }

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'update_announcement',
            description: `공지사항 수정: ${title}`,
            metadata: { announcement_id: announcementId, title }
          });

        return res.status(200).json({
          message: '공지사항이 수정되었습니다.',
          announcement: data
        });
      } catch (error) {
        console.error('Error in announcement PUT:', error);
        return res.status(500).json({ error: '공지사항 수정에 실패했습니다.' });
      }

    case 'DELETE':
      try {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', announcementId);

        if (error) {
          console.error('Error deleting announcement:', error);
          throw error;
        }

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'delete_announcement',
            description: '공지사항 삭제',
            metadata: { announcement_id: announcementId }
          });

        return res.status(200).json({
          message: '공지사항이 삭제되었습니다.'
        });
      } catch (error) {
        console.error('Error in announcement DELETE:', error);
        return res.status(500).json({ error: '공지사항 삭제에 실패했습니다.' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}