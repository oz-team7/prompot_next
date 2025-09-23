import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    console.log('[DEBUG] Bookmarks API called:', req.method);
    
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
        // 최적화된 단일 쿼리로 모든 데이터 가져오기
        console.log('[DEBUG] Fetching bookmarks for user:', userId);
        const { data: bookmarks, error } = await supabase
          .from('prompt_bookmarks')
          .select(`
            id,
            created_at,
            prompt_id,
            category_id,
            prompts!inner(
              id,
              title,
              description,
              content,
              category,
              tags,
              ai_model,
              preview_image,
              video_url,
              additional_images,
              is_public,
              created_at,
              updated_at,
              author_id,
              profiles(
                id,
                name,
                avatar_url
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        console.log('[DEBUG] Bookmarks query result:', { bookmarks, error });

        if (error) {
          console.error('Bookmarks fetch error:', error);
          return res.status(500).json({ message: '북마크 목록을 가져오는데 실패했습니다.' });
        }

        // 데이터 변환 및 최적화
        const transformedBookmarks = bookmarks?.map((bookmark: any) => ({
          id: bookmark.id,
          createdAt: bookmark.created_at,
          categoryId: bookmark.category_id,
          prompt: {
            id: (bookmark.prompts as any)?.id,
            title: (bookmark.prompts as any)?.title,
            description: (bookmark.prompts as any)?.description,
            content: (bookmark.prompts as any)?.content,
            category: (bookmark.prompts as any)?.category,
            tags: (bookmark.prompts as any)?.tags,
            aiModel: (bookmark.prompts as any)?.ai_model,
            previewImage: (bookmark.prompts as any)?.preview_image,
            videoUrl: (bookmark.prompts as any)?.video_url,
            additionalImages: (bookmark.prompts as any)?.additional_images,
            isPublic: (bookmark.prompts as any)?.is_public,
            createdAt: (bookmark.prompts as any)?.created_at,
            updatedAt: (bookmark.prompts as any)?.updated_at,
            author: (bookmark.prompts as any)?.profiles?.name || 'Unknown',
            authorId: (bookmark.prompts as any)?.author_id,
            authorAvatarUrl: (bookmark.prompts as any)?.profiles?.avatar_url || null
          }
        })) || [];

        console.log('[DEBUG] Transformed bookmarks count:', transformedBookmarks.length);

        res.status(200).json({ 
          bookmarks: transformedBookmarks,
          success: true 
        });
      } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    case 'POST':
      try {
        const { promptId, categoryId } = req.body;

        // promptId 유효성 검증
        let numericPromptId: string | number = promptId;
        const isUUID = typeof promptId === 'string' && promptId.includes('-');
        
        if (!isUUID && typeof promptId === 'string') {
          numericPromptId = parseInt(promptId, 10);
        }

        if (!numericPromptId || 
            (typeof numericPromptId === 'number' && (isNaN(numericPromptId) || numericPromptId <= 0)) ||
            (typeof numericPromptId === 'string' && numericPromptId.trim() === '')) {
          return res.status(400).json({ 
            message: '유효한 프롬프트 ID가 필요합니다.'
          });
        }

        // UPSERT 패턴으로 북마크 추가/업데이트 (가장 빠른 방법)
        const { data: bookmark, error } = await supabase
          .from('prompt_bookmarks')
          .upsert({
            user_id: userId,
            prompt_id: numericPromptId,
            category_id: categoryId || null,
          }, {
            onConflict: 'user_id,prompt_id',
            ignoreDuplicates: false
          })
          .select(`
            id,
            created_at,
            prompt_id,
            category_id,
            prompts!inner(
              id,
              title,
              description,
              content,
              category,
              tags,
              ai_model,
              preview_image,
              video_url,
              additional_images,
              is_public,
              created_at,
              updated_at,
              author_id,
              profiles(
                id,
                name,
                avatar_url
              )
            )
          `)
          .single();

        if (error) {
          console.error('Bookmark upsert error:', error);
          return res.status(500).json({ message: '북마크 추가에 실패했습니다.' });
        }

        console.log('[DEBUG] Bookmark upsert result:', { bookmark });

        // 응답 데이터 변환
        const transformedBookmark = {
          id: bookmark.id,
          createdAt: bookmark.created_at,
          categoryId: bookmark.category_id,
          prompt: {
            id: (bookmark.prompts as any)?.id,
            title: (bookmark.prompts as any)?.title,
            description: (bookmark.prompts as any)?.description,
            content: (bookmark.prompts as any)?.content,
            category: (bookmark.prompts as any)?.category,
            tags: (bookmark.prompts as any)?.tags,
            aiModel: (bookmark.prompts as any)?.ai_model,
            previewImage: (bookmark.prompts as any)?.preview_image,
            videoUrl: (bookmark.prompts as any)?.video_url,
            additionalImages: (bookmark.prompts as any)?.additional_images,
            isPublic: (bookmark.prompts as any)?.is_public,
            createdAt: (bookmark.prompts as any)?.created_at,
            updatedAt: (bookmark.prompts as any)?.updated_at,
            author: (bookmark.prompts as any)?.profiles?.name || 'Unknown',
            authorId: (bookmark.prompts as any)?.author_id,
            authorAvatarUrl: (bookmark.prompts as any)?.profiles?.avatar_url || null
          }
        };

        res.status(200).json({ 
          bookmark: transformedBookmark,
          success: true 
        });
      } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    case 'DELETE':
      try {
        const { promptId } = req.query;
        console.log('[DEBUG] Deleting bookmark for prompt:', promptId);

        if (!promptId) {
          return res.status(400).json({ message: '프롬프트 ID가 필요합니다.' });
        }

        // 북마크 삭제
        const { error } = await supabase
          .from('prompt_bookmarks')
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', userId);

        console.log('[DEBUG] Delete bookmark result:', { error });

        if (error) {
          console.error('Bookmark delete error:', error);
          return res.status(500).json({ message: '북마크 삭제에 실패했습니다.' });
        }

        res.status(200).json({ 
          message: '북마크가 삭제되었습니다.',
          success: true 
        });
      } catch (error) {
        console.error('Delete bookmark error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('[ERROR] Bookmarks API error:', error);
    res.status(500).json({ 
      message: '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      success: false 
    });
  }
}