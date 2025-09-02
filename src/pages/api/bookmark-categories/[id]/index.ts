import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Bookmark Category API called:', req.method);
  
  const userId = await getUserIdFromRequest(req);
  const { id } = req.query;
  
  console.log('[DEBUG] User ID:', userId, 'Category ID:', id);
  
  if (!userId) {
    console.log('[DEBUG] No user ID found');
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '카테고리 ID가 필요합니다.' });
  }

  const supabase = createSupabaseServiceClient();

  switch (req.method) {
    case 'PUT':
      try {
        const { name, color } = req.body;
        console.log('[DEBUG] Updating bookmark category:', { id, name, color });

        if (!name || name.trim().length === 0) {
          return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
        }

        // 카테고리 소유권 확인
        const { data: existingCategory } = await supabase
          .from('bookmark_categories')
          .select('id, color')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (!existingCategory) {
          return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
        }

        // 중복 이름 확인 (자기 자신 제외)
        const { data: duplicateCategory } = await supabase
          .from('bookmark_categories')
          .select('id, color')
          .eq('user_id', userId)
          .eq('name', name.trim())
          .neq('id', id)
          .single();

        if (duplicateCategory) {
          return res.status(409).json({ message: '이미 존재하는 카테고리 이름입니다.' });
        }

        // 카테고리 수정
        const { data: category, error } = await supabase
          .from('bookmark_categories')
          .update({
            name: name.trim(),
            color: color || existingCategory.color,
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        console.log('[DEBUG] Update category result:', { category, error });

        if (error) {
          console.error('Category update error:', error);
          return res.status(500).json({ message: '카테고리 수정에 실패했습니다.' });
        }

        res.status(200).json({ 
          category: {
            ...category,
            createdAt: category.created_at,
            updatedAt: category.updated_at
          }
        });
      } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    case 'DELETE':
      try {
        console.log('[DEBUG] Deleting bookmark category:', id);

        // 카테고리 소유권 확인
        const { data: existingCategory } = await supabase
          .from('bookmark_categories')
          .select('id, color')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (!existingCategory) {
          return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
        }

        // 해당 카테고리의 북마크들을 카테고리 없음으로 설정
        await supabase
          .from('prompt_bookmarks')
          .update({ category_id: null })
          .eq('user_id', userId)
          .eq('category_id', id);

        // 카테고리 삭제
        const { error } = await supabase
          .from('bookmark_categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        console.log('[DEBUG] Delete category result:', { error });

        if (error) {
          console.error('Category delete error:', error);
          return res.status(500).json({ message: '카테고리 삭제에 실패했습니다.' });
        }

        res.status(200).json({ message: '카테고리가 삭제되었습니다.' });
      } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
