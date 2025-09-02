import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] Bookmark Categories API called:', req.method);
  
  const userId = await getUserIdFromRequest(req);
  console.log('[DEBUG] User ID:', userId);
  
  if (!userId) {
    console.log('[DEBUG] No user ID found');
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const supabase = createSupabaseServiceClient();

  switch (req.method) {
    case 'GET':
      try {
        // 사용자의 북마크 카테고리 목록 가져오기
        console.log('[DEBUG] Fetching bookmark categories for user:', userId);
        const { data: categories, error } = await supabase
          .from('bookmark_categories')
          .select(`
            id,
            name,
            color,
            created_at,
            updated_at
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        console.log('[DEBUG] Categories query result:', { categories, error });

        if (error) {
          console.error('Categories fetch error:', error);
          return res.status(500).json({ message: '북마크 카테고리 목록을 가져오는데 실패했습니다.' });
        }

        // 각 카테고리의 북마크 수 계산
        const categoriesWithCount = await Promise.all(
          (categories || []).map(async (category) => {
            const { count } = await supabase
              .from('prompt_bookmarks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('category_id', category.id);
            
            return {
              ...category,
              bookmarkCount: count || 0,
              createdAt: category.created_at,
              updatedAt: category.updated_at
            };
          })
        );

        console.log('[DEBUG] Categories with count:', categoriesWithCount);
        res.status(200).json({ categories: categoriesWithCount });
      } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    case 'POST':
      try {
        const { name, color = '#3B82F6' } = req.body;
        console.log('[DEBUG] Creating bookmark category:', { name, color });

        if (!name || name.trim().length === 0) {
          return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
        }

        // 중복 이름 확인
        const { data: existingCategory } = await supabase
          .from('bookmark_categories')
          .select('id')
          .eq('user_id', userId)
          .eq('name', name.trim())
          .single();

        if (existingCategory) {
          return res.status(409).json({ message: '이미 존재하는 카테고리 이름입니다.' });
        }

        // 카테고리 생성
        const { data: category, error } = await supabase
          .from('bookmark_categories')
          .insert({
            user_id: userId,
            name: name.trim(),
            color: color,
          })
          .select()
          .single();

        console.log('[DEBUG] Create category result:', { category, error });

        if (error) {
          console.error('Category create error:', error);
          return res.status(500).json({ message: '카테고리 생성에 실패했습니다.' });
        }

        res.status(201).json({ 
          category: {
            ...category,
            bookmarkCount: 0,
            createdAt: category.created_at,
            updatedAt: category.updated_at
          }
        });
      } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
