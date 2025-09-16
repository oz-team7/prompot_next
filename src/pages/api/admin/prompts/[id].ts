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
  const promptId = id as string;

  switch (req.method) {
    case 'DELETE':
      try {
        // 먼저 프롬프트 정보 가져오기 (로그용)
        const { data: prompt } = await supabase
          .from('prompts')
          .select('title, author')
          .eq('id', promptId)
          .single();

        if (!prompt) {
          return res.status(404).json({ error: '프롬프트를 찾을 수 없습니다.' });
        }

        // 관련 데이터 삭제 (cascade가 설정되어 있지 않은 경우)
        // 1. 좋아요 삭제
        await supabase
          .from('prompt_likes')
          .delete()
          .eq('prompt_id', promptId);

        // 2. 북마크 삭제
        await supabase
          .from('bookmarks')
          .delete()
          .eq('prompt_id', promptId);

        // 3. 신고 삭제
        await supabase
          .from('reports')
          .delete()
          .eq('content_type', 'prompt')
          .eq('content_id', promptId);

        // 4. 프롬프트 삭제
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', promptId);

        if (error) {
          console.error('Error deleting prompt:', error);
          throw error;
        }

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'delete_prompt',
            description: `프롬프트 삭제: ${prompt.title}`,
            metadata: { 
              prompt_id: promptId, 
              title: prompt.title,
              author_id: prompt.author
            }
          });

        return res.status(200).json({
          message: '프롬프트가 삭제되었습니다.'
        });
      } catch (error) {
        console.error('Error in prompt DELETE:', error);
        return res.status(500).json({ error: '프롬프트 삭제에 실패했습니다.' });
      }

    case 'PUT':
      try {
        const { title, description, prompt: promptContent, tags, category, aiModel } = req.body;

        // 유효성 검사
        if (!title || !promptContent) {
          return res.status(400).json({ error: '제목과 프롬프트 내용은 필수입니다.' });
        }

        const { data, error } = await supabase
          .from('prompts')
          .update({
            title,
            description,
            prompt: promptContent,
            tags: tags || [],
            category,
            aiModel,
            updated_at: new Date().toISOString()
          })
          .eq('id', promptId)
          .select()
          .single();

        if (error) {
          console.error('Error updating prompt:', error);
          throw error;
        }

        // 활동 로그 기록
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: authUser.id,
            action: 'update_prompt',
            description: `프롬프트 수정: ${title}`,
            metadata: { prompt_id: promptId, title }
          });

        return res.status(200).json({
          message: '프롬프트가 수정되었습니다.',
          prompt: data
        });
      } catch (error) {
        console.error('Error in prompt PUT:', error);
        return res.status(500).json({ error: '프롬프트 수정에 실패했습니다.' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}