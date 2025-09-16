import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const promptId = parseInt(id as string);

  if (isNaN(promptId)) {
    return res.status(400).json({ error: 'Invalid prompt ID' });
  }

  try {
    // 조회수 증가
    const { data, error } = await supabase
      .rpc('increment', { table_name: 'prompts', column_name: 'views', row_id: promptId });

    if (error) {
      // RPC 함수가 없는 경우 먼저 현재 조회수를 가져옴
      const { data: currentPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('views')
        .eq('id', promptId)
        .single();

      if (fetchError || !currentPrompt) {
        throw new Error('프롬프트를 찾을 수 없습니다.');
      }

      const newViews = (currentPrompt.views || 0) + 1;

      const { data: updateData, error: updateError } = await supabase
        .from('prompts')
        .update({ views: newViews })
        .eq('id', promptId)
        .select('views')
        .single();

      if (updateError) {
        console.error('Error incrementing views:', updateError);
        return res.status(500).json({ error: 'Failed to increment views' });
      }

      return res.status(200).json({ views: updateData.views });
    }

    // 업데이트된 조회수 가져오기
    const { data: promptData, error: selectError } = await supabase
      .from('prompts')
      .select('views')
      .eq('id', promptId)
      .single();

    if (selectError) {
      console.error('Error fetching updated views:', selectError);
      return res.status(500).json({ error: 'Failed to fetch updated views' });
    }

    return res.status(200).json({ views: promptData.views });
  } catch (error) {
    console.error('Error updating views:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}