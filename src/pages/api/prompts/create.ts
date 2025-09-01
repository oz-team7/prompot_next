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

  console.log('Request headers:', req.headers); // 디버깅 로그

  // 인증 확인
  let authUser;
  try {
    authUser = await requireAuth(req);
    console.log('Auth user:', authUser); // 디버깅 로그
  } catch (error) {
    console.log('Auth error:', error); // 디버깅 로그
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  
  const { title, description, content, category, tags, aiModel, previewImage, isPublic } = req.body;

  // 유효성 검사
  if (!title || !description || !content || !category || !aiModel) {
    return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // tags 처리 개선
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && typeof tag === 'string' && tag.trim());
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }
    
    console.log('Processed tags:', processedTags); // 디버깅 로그
    
    // 삽입할 데이터 준비
    const insertData = {
      title,
      description,
      content,
      category,
      ai_model: aiModel,
      preview_image: previewImage || null,
      is_public: isPublic ?? true,
      author_id: authUser.id,
    };
    
    // tags가 있을 때만 추가
    if (processedTags.length > 0) {
      insertData.tags = processedTags;
    }
    
    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert([insertData])
      .select(`
        *,
        author:profiles!author_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (error || !prompt) {
      throw error || new Error('프롬프트 생성 실패');
    }

    res.status(201).json({
      prompt: {
        ...prompt,
        tags: prompt.tags || [], // null 체크 추가
        likes: 0, // likes 테이블이 없으므로 임시로 0
        bookmarks: 0, // bookmarks 테이블이 없으므로 임시로 0
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