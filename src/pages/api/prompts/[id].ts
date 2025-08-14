import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '유효하지 않은 프롬프트 ID입니다.' });
  }

  // 인증 확인
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, parseInt(id));
    case 'PUT':
      return handleUpdate(req, res, parseInt(id), decoded.userId);
    case 'DELETE':
      return handleDelete(req, res, parseInt(id), decoded.userId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: number
) {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!prompt) {
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    // AI 모델 이름과 아이콘 정보 추가
    const aiModelInfo = getAIModelInfo(prompt.aiModel);

    res.status(200).json({
      prompt: {
        ...prompt,
        tags: JSON.parse(prompt.tags),
        likes: prompt._count.likes,
        bookmarks: prompt._count.bookmarks,
        author: prompt.author.name,
        date: prompt.createdAt.toISOString().split('T')[0].replace(/-/g, '.'),
        rating: 0, // 평점 기능은 아직 구현되지 않음
        aiModel: aiModelInfo,
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
  promptId: number,
  userId: string
) {
  try {
    // 프롬프트 소유자 확인
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { authorId: true },
    });

    if (!prompt) {
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    if (prompt.authorId !== userId) {
      return res.status(403).json({ message: '이 프롬프트를 수정할 권한이 없습니다.' });
    }

    const { title, description, content, category, tags, aiModel, previewImage, isPublic } = req.body;

    const updatedPrompt = await prisma.prompt.update({
      where: { id: promptId },
      data: {
        title,
        description,
        content,
        category,
        tags: JSON.stringify(tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)),
        aiModel,
        previewImage,
        isPublic,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    res.status(200).json({
      prompt: {
        ...updatedPrompt,
        tags: JSON.parse(updatedPrompt.tags),
        likes: updatedPrompt._count.likes,
        bookmarks: updatedPrompt._count.bookmarks,
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
  promptId: number,
  userId: string
) {
  try {
    // 프롬프트 소유자 확인
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { authorId: true },
    });

    if (!prompt) {
      return res.status(404).json({ message: '프롬프트를 찾을 수 없습니다.' });
    }

    if (prompt.authorId !== userId) {
      return res.status(403).json({ message: '이 프롬프트를 삭제할 권한이 없습니다.' });
    }

    // 관련된 likes와 bookmarks도 함께 삭제됩니다 (cascade)
    await prisma.prompt.delete({
      where: { id: promptId },
    });

    res.status(200).json({ message: '프롬프트가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({ message: '프롬프트 삭제 중 오류가 발생했습니다.' });
  }
}