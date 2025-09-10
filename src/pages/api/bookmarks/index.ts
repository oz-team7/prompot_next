import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        // 사용자의 북마크 목록 가져오기 (단순 쿼리로 시작)
        console.log('[DEBUG] Fetching bookmarks for user:', userId);
        const { data: bookmarks, error } = await supabase
          .from('prompt_bookmarks')
          .select(`
            id,
            created_at,
            prompt_id,
            category_id
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        console.log('[DEBUG] Bookmarks query result:', { bookmarks, error });

        if (error) {
          console.error('Bookmarks fetch error:', error);
          return res.status(500).json({ message: '북마크 목록을 가져오는데 실패했습니다.' });
        }

        // 북마크된 프롬프트 ID 목록
        const promptIds = bookmarks?.map(b => b.prompt_id) || [];
        console.log('[DEBUG] Prompt IDs:', promptIds);
        console.log('[DEBUG] Sample bookmark:', bookmarks?.[0]);

        // 프롬프트 데이터 가져오기 - 직접 조인으로 변경
        let promptsData: any[] = [];
        if (promptIds.length > 0) {
          console.log('[DEBUG] Fetching prompts for IDs:', promptIds);
          
          const { data: prompts, error: promptsError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              description,
              content,
              category,
              tags,
              ai_model,
              preview_image,
              is_public,
              created_at,
              updated_at,
              author_id
            `)
            .in('id', promptIds);

          console.log('[DEBUG] Prompts query result:', { 
            promptsCount: prompts?.length || 0,
            error: promptsError,
            samplePrompt: prompts?.[0]
          });

          if (promptsError) {
            console.error('Prompts fetch error:', promptsError);
          } else {
            promptsData = prompts || [];
          }
        }

        // 작성자 정보 가져오기
        const authorIds = [...new Set(promptsData.map(p => p.author_id))];
        console.log('[DEBUG] Author IDs:', authorIds);
        let authorsData: any[] = [];
        if (authorIds.length > 0) {
          const { data: authors, error: authorsError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', authorIds);

          console.log('[DEBUG] Authors query result:', { authors, error: authorsError });

          if (authorsError) {
            console.error('Authors fetch error:', authorsError);
          } else {
            authorsData = authors || [];
          }
        }

        // 작성자 정보를 Map으로 변환
        const authorsMap = new Map(authorsData.map(author => [author.id, author]));
        const promptsMap = new Map(promptsData.map(prompt => [prompt.id, prompt]));

        console.log('[DEBUG] PromptsMap keys:', Array.from(promptsMap.keys()));
        console.log('[DEBUG] Bookmark prompt_ids:', bookmarks?.map(b => b.prompt_id));
        console.log('[DEBUG] Sample prompt from map:', promptsMap.get('da96f318-6245-458c-8b17-0edb9d55b6cf'));

        // 북마크 데이터를 프론트엔드 형식으로 변환
        const formattedBookmarks = bookmarks?.map(bookmark => {
          const prompt = promptsMap.get(bookmark.prompt_id);
          const author = prompt ? authorsMap.get(prompt.author_id) : null;

          console.log('[DEBUG] Processing bookmark:', {
            bookmarkId: bookmark.id,
            promptId: bookmark.prompt_id,
            foundPrompt: !!prompt,
            promptTitle: prompt?.title,
            promptIdType: typeof bookmark.prompt_id,
            promptIdValue: bookmark.prompt_id,
            promptsMapSize: promptsMap.size,
            promptsMapKeys: Array.from(promptsMap.keys())
          });

          // 프롬프트를 찾지 못한 경우 직접 조회
          let finalPrompt = prompt;
          if (!prompt) {
            console.log('[DEBUG] Prompt not found in map, trying direct query for:', bookmark.prompt_id);
            // 직접 조회로 프롬프트 정보 가져오기
            const directPrompt = promptsData.find(p => p.id === bookmark.prompt_id);
            if (directPrompt) {
              finalPrompt = directPrompt;
              console.log('[DEBUG] Found prompt via direct search:', directPrompt.title);
            }
          }

          return {
            id: bookmark.id,
            createdAt: bookmark.created_at,
            categoryId: bookmark.category_id,
            prompt: {
              id: bookmark.prompt_id,
              title: finalPrompt?.title || `프롬프트 ${bookmark.prompt_id}`,
              description: finalPrompt?.description || '프롬프트 설명을 불러오는 중...',
              content: finalPrompt?.content || '',
              category: finalPrompt?.category || 'work',
              tags: finalPrompt?.tags || [],
              aiModel: finalPrompt?.ai_model || 'unknown',
              previewImage: finalPrompt?.preview_image,
              isPublic: finalPrompt?.is_public ?? true,
              createdAt: finalPrompt?.created_at || bookmark.created_at,
              updatedAt: finalPrompt?.updated_at || bookmark.created_at,
              author: finalPrompt ? authorsMap.get(finalPrompt.author_id)?.name || 'Unknown' : 'Unknown',
              authorId: finalPrompt ? authorsMap.get(finalPrompt.author_id)?.id : null,
            }
          };
        }) || [];

        console.log('[DEBUG] Formatted bookmarks:', formattedBookmarks);
        res.status(200).json({ bookmarks: formattedBookmarks });
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
              is_public,
              created_at,
              updated_at,
              author_id,
              profiles!inner(
                id,
                name,
                avatar_url
              )
            )
          `)
          .single();

        if (error) {
          // 프롬프트가 존재하지 않는 경우
          if (error.code === '23503') {
            return res.status(404).json({ 
              message: '프롬프트를 찾을 수 없습니다.'
            });
          }
          
          console.error('Bookmark upsert error:', error);
          return res.status(500).json({ 
            message: '북마크 추가에 실패했습니다.',
            error: error.message
          });
        }

        res.status(201).json({ 
          bookmark,
          message: '북마크가 추가되었습니다.'
        });
      } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({ 
          message: '서버 오류가 발생했습니다.'
        });
      }
      break;

    case 'DELETE':
      try {
        const { promptId } = req.query; // body 대신 query에서 받기
        console.log('[DEBUG] Deleting bookmark for prompt:', promptId, 'type:', typeof promptId);

        // promptId를 숫자로 변환 (배열인 경우 첫 번째 요소 사용)
        const promptIdValue = Array.isArray(promptId) ? promptId[0] : promptId;
        
        if (!promptIdValue) {
          console.log('[DEBUG] promptId is missing or undefined');
          return res.status(400).json({ message: '프롬프트 ID가 필요합니다.' });
        }
        
        // UUID 형식인지 확인
        const isUUID = typeof promptIdValue === 'string' && promptIdValue.includes('-');
        let numericPromptId: string | number = promptIdValue;
        
        if (!isUUID && typeof promptIdValue === 'string') {
          // UUID가 아닌 문자열인 경우 숫자로 변환 시도
          numericPromptId = parseInt(promptIdValue, 10);
        }
        
        console.log('[DEBUG] Converted promptId for delete:', numericPromptId, 'type:', typeof numericPromptId, 'isUUID:', isUUID);

        if (!numericPromptId || 
            (typeof numericPromptId === 'number' && (isNaN(numericPromptId) || numericPromptId <= 0)) ||
            (typeof numericPromptId === 'string' && numericPromptId.trim() === '')) {
          console.log('[DEBUG] promptId is missing, falsy, or not a valid number for delete');
          return res.status(400).json({ message: '프롬프트 ID가 필요합니다.' });
        }

        // 북마크 삭제 (prompt_id로 찾기)
        const { error } = await supabase
          .from('prompt_bookmarks')
          .delete()
          .eq('prompt_id', numericPromptId)
          .eq('user_id', userId);

        console.log('[DEBUG] Delete bookmark result:', { error });

        if (error) {
          console.error('Bookmark delete error:', error);
          return res.status(500).json({ message: '북마크 삭제에 실패했습니다.' });
        }

        res.status(200).json({ message: '북마크가 삭제되었습니다.' });
      } catch (error) {
        console.error('Delete bookmark error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
