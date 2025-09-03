import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { promptId } = req.body;
    console.log('[DEBUG] Testing bookmark creation for promptId:', promptId);

    const supabase = createSupabaseServiceClient();

    // 1. 프롬프트 존재 확인
    console.log('[DEBUG] Step 1: Checking prompt existence');
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, title')
      .eq('id', promptId)
      .single();

    console.log('[DEBUG] Prompt check result:', { prompt, error: promptError });

    if (promptError || !prompt) {
      return res.status(404).json({
        step: 'prompt_check',
        message: '프롬프트를 찾을 수 없습니다',
        promptId,
        error: promptError?.message
      });
    }

    // 2. 북마크 테이블 구조 확인
    console.log('[DEBUG] Step 2: Checking bookmark table structure');
    const { data: bookmarkStructure, error: structureError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .limit(1);

    console.log('[DEBUG] Bookmark structure check:', { bookmarkStructure, error: structureError });

    if (structureError) {
      return res.status(500).json({
        step: 'structure_check',
        message: '북마크 테이블 접근 오류',
        error: structureError.message
      });
    }

    // 3. 테스트 북마크 삽입 (실제로는 삽입하지 않음)
    console.log('[DEBUG] Step 3: Testing bookmark insertion logic');
    const testBookmarkData = {
      user_id: 'test-user-id',
      prompt_id: promptId,
      category_id: null
    };

    console.log('[DEBUG] Test bookmark data:', testBookmarkData);

    res.status(200).json({
      message: '북마크 시스템 테스트 완료',
      prompt: {
        id: prompt.id,
        title: prompt.title
      },
      bookmarkTable: {
        accessible: true,
        sampleData: bookmarkStructure?.[0]
      },
      testData: testBookmarkData
    });

  } catch (error) {
    console.error('[DEBUG] Bookmark test error:', error);
    res.status(500).json({
      message: '북마크 시스템 테스트 실패',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
