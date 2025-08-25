import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '유효하지 않은 프롬프트 ID입니다.' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, id);
    case 'PUT':
      return handleUpdate(req, res, id);
    case 'DELETE':
      return handleDelete(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: string
) {
  try {
    // Supabase에서 프롬프트 조회
    const { data: prompt, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles(id, name, email),
        likes:prompt_likes(count),
        bookmarks:prompt_bookmarks(count)
      `)
      .eq('id', promptId)
      .single();

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    if (!prompt) {
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    // AI 모델 이름과 아이콘 정보 추가
    const aiModelInfo = getAIModelInfo(prompt.ai_model);

    res.status(200).json({
      prompt: {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        category: prompt.category,
        tags: prompt.tags || [],
        aiModel: aiModelInfo,
        previewImage: prompt.preview_image,
        isPublic: prompt.is_public,
        authorId: prompt.author_id,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at,
        likes: prompt.likes?.[0]?.count || 0,
        bookmarks: prompt.bookmarks?.[0]?.count || 0,
        author: prompt.author?.name || 'Unknown',
        date: new Date(prompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
        rating: 0, // 평점 기능은 아직 구현되지 않음
      },
    });
  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({ message: '프롬프트를 가져오는 중 오류가 발생했습니다.' });
  }
}

// AI 모델 정보를 반환하는 헬퍼 함수
function getAIModelInfo(modelId: string) {
  const aiModels: { [key: string]: { name: string; icon: string } } = {
    chatgpt: { name: 'ChatGPT', icon: '/image/icon_chatgpt.png' },
    claude: { name: 'Claude', icon: '/image/icon_claude.png' },
    claude_artifacts: { name: 'Claude Artifacts', icon: '/image/icon_claude_artifacts.png' },
    gemini: { name: 'Gemini', icon: '/image/icon_gemini.png' },
    gpt4_code: { name: 'GPT-4 Code', icon: '/image/icon_gpt-4_code.png' },
    midjourney: { name: 'Midjourney', icon: '/image/icon_midjourney.png' },
    dalle3: { name: 'DALL·E 3', icon: '/image/icon_dall_e_3.png' },
    stable_diffusion: { name: 'Stable Diffusion', icon: '/image/icon_Stable_Diffusion.png' },
    leonardo_ai: { name: 'Leonardo AI', icon: '/image/icon_leonardo_ai.png' },
    cursor: { name: 'Cursor', icon: '/image/icon_cursor-ai.png' },
    v0: { name: 'v0', icon: '/image/icon_v0.png' },
    bolt: { name: 'Bolt', icon: '/image/icon_bolt-new.png' },
    replit: { name: 'Replit', icon: '/image/icon_Replit.png' },
    lovable: { name: 'Lovable', icon: '/image/icon_lovable.png' },
    copy_ai: { name: 'Copy.ai', icon: '/image/icon_Copy-ai.png' },
    jasper: { name: 'Jasper', icon: '/image/icon_jasper.png' },
    wrtn: { name: 'WRTN', icon: '/image/icon_wrtn.png' },
    perplexity: { name: 'Perplexity', icon: '/image/icon_perplexity.png' },
    mistral: { name: 'Mistral Large', icon: '/image/icon_mistrallarge.png' },
    clovax: { name: 'Clova X', icon: '/image/icon_clovax.png' },
    sora: { name: 'Sora', icon: '/image/icon_Sora.png' },
    runway: { name: 'Runway', icon: '/image/icon_runway.png' },
    pika: { name: 'Pika Labs', icon: '/image/icon_PikaLabs.png' },
    kling: { name: 'Kling', icon: '/image/icon_kling.png' },
    heygen: { name: 'HeyGen', icon: '/image/icon_heygen.png' },
    synthesia: { name: 'Synthesia', icon: '/image/icon_synthesia.png' },
    elevenlabs: { name: 'ElevenLabs', icon: '/image/icon_ElevenLabs.png' },
    pictory: { name: 'Pictory', icon: '/image/icon_pictory_logo.png' },
    flexclip: { name: 'FlexClip', icon: '/image/icon_flexclip.png' },
    pollo: { name: 'Pollo AI', icon: '/image/icon_pollo-ai.png' },
    imagefx: { name: 'ImageFX', icon: '/image/icon_imageFX.png' },
    whisk: { name: 'Whisk', icon: '/image/icon_whisk.png' },
    controlnet: { name: 'ControlNet', icon: '/image/icon_controlnet.png' },
  };

  return aiModels[modelId] || { name: modelId, icon: '/image/icon_chatgpt.png' };
}

async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: string
) {
  try {
    // Supabase Auth로 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 프롬프트 소유자 확인
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('author_id')
      .eq('id', promptId)
      .single();

    if (promptError || !prompt) {
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    if (prompt.author_id !== user.id) {
      return res.status(403).json({ message: '이 프롬프트를 수정할 권한이 없습니다.' });
    }

    const { title, description, content, category, tags, aiModel, previewImage, isPublic } = req.body;

    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        title,
        description,
        content,
        category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        ai_model: aiModel,
        preview_image: previewImage,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)
      .select(`
        *,
        author:profiles(id, name, email),
        likes:prompt_likes(count),
        bookmarks:prompt_bookmarks(count)
      `)
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ message: '프롬프트 수정 중 오류가 발생했습니다.' });
    }

    res.status(200).json({
      prompt: {
        id: updatedPrompt.id,
        title: updatedPrompt.title,
        description: updatedPrompt.description,
        content: updatedPrompt.content,
        category: updatedPrompt.category,
        tags: updatedPrompt.tags || [],
        aiModel: getAIModelInfo(updatedPrompt.ai_model),
        previewImage: updatedPrompt.preview_image,
        isPublic: updatedPrompt.is_public,
        authorId: updatedPrompt.author_id,
        createdAt: updatedPrompt.created_at,
        updatedAt: updatedPrompt.updated_at,
        likes: updatedPrompt.likes?.[0]?.count || 0,
        bookmarks: updatedPrompt.bookmarks?.[0]?.count || 0,
        author: updatedPrompt.author?.name || 'Unknown',
        date: new Date(updatedPrompt.created_at).toISOString().split('T')[0].replace(/-/g, '.'),
        rating: 0,
      },
    });
  } catch (error) {
    console.error('Update prompt error:', error);
    res.status(500).json({ message: '프롬프트 수정 중 오류가 발생했습니다.' });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: string
) {
  try {
    // Supabase Auth로 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 프롬프트 소유자 확인
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('author_id')
      .eq('id', promptId)
      .single();

    if (promptError || !prompt) {
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    if (prompt.author_id !== user.id) {
      return res.status(403).json({ message: '이 프롬프트를 삭제할 권한이 없습니다.' });
    }

    // 관련된 likes와 bookmarks도 함께 삭제됩니다 (cascade)
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ message: '프롬프트 삭제 중 오류가 발생했습니다.' });
    }

    res.status(200).json({ message: '프롬프트가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({ message: '프롬프트 삭제 중 오류가 발생했습니다.' });
  }
}