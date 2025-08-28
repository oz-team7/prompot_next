import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';

// API body size 제한 설정 (4MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 인증 확인
  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  
  const { title, description, content, category, tags, aiModel, previewImage, isPublic } = req.body;

  // 유효성 검사
  if (!title || !description || !content || !category || !aiModel) {
    return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert([
        {
          title,
          description,
          content,
          category,
          tags: JSON.stringify(tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []),
          ai_model: aiModel,
          preview_image: previewImage || null,
          is_public: isPublic ?? true,
          author_id: authUser.id,
        }
      ])
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          email
        ),
        likes!left (
          user_id
        ),
        bookmarks!left (
          user_id
        )
      `)
      .single();

    if (error || !prompt) {
      throw error || new Error('프롬프트 생성 실패');
    }

    res.status(201).json({
      prompt: {
        ...prompt,
        tags: JSON.parse(prompt.tags),
        likes: prompt.likes?.length || 0,
        bookmarks: prompt.bookmarks?.length || 0,
        author: prompt.author.name,
        date: new Date(prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
        rating: 0,
      },
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({ message: '프롬프트 생성 중 오류가 발생했습니다.' });
  }
}