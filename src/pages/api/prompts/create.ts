import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

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

  try {
    // Supabase Auth로 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }
    
    const { title, description, content, category, tags, aiModel, previewImage, isPublic } = req.body;

    // 유효성 검사
    if (!title || !description || !content || !category || !aiModel) {
      return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' });
    }

    // Supabase에 프롬프트 저장
    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert({
        title,
        description,
        content,
        category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        ai_model: aiModel,
        preview_image: previewImage || null,
        is_public: isPublic ?? true,
        author_id: user.id, // UUID 형식
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
                   .select(`
               *,
               author:profiles(id, name, email),
               likes:prompt_likes(count),
               bookmarks:prompt_bookmarks(count)
             `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ message: '프롬프트 생성 중 오류가 발생했습니다.' });
    }

    // 응답 데이터 구성
    const responsePrompt = {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags,
      aiModel: prompt.ai_model,
      previewImage: prompt.preview_image,
      isPublic: prompt.is_public,
      authorId: prompt.author_id,
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at,
      likes: prompt.likes?.[0]?.count || 0,
      bookmarks: prompt.bookmarks?.[0]?.count || 0,
      author: prompt.author?.name || 'Unknown',
      date: new Date(prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
      rating: 0,
    };

    res.status(201).json({
      prompt: responsePrompt,
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({ message: '프롬프트 생성 중 오류가 발생했습니다.' });
  }
}