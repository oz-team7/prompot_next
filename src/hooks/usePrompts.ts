import { useState, useEffect } from 'react';
import { Prompt } from '@/types/prompt';

export const usePrompts = (options?: { author?: boolean }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const query = options?.author ? '?author=true' : '';
      const res = await fetch(`/api/prompts${query}`);
      
      if (!res.ok) {
        throw new Error('프롬프트를 가져오는데 실패했습니다.');
      }

      const data = await res.json();
      const formattedPrompts = data.prompts.map((prompt: any) => ({
        ...prompt,
        aiModel: prompt.aiModel ? {
          name: getAIModelName(prompt.aiModel),
          icon: getAIModelIcon(prompt.aiModel),
        } : undefined,
      }));
      
      setPrompts(formattedPrompts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchPrompts();
  };

  return { prompts, loading, error, refetch };
};

// AI 모델 매핑 함수들
const getAIModelName = (id: string): string => {
  const models: Record<string, string> = {
    'chatgpt': 'ChatGPT',
    'claude': 'Claude',
    'claude_artifacts': 'Claude Artifacts',
    'gemini': 'Gemini',
    'gpt4_code': 'GPT-4 Code',
    'midjourney': 'Midjourney',
    'dalle3': 'DALL·E 3',
    'stable_diffusion': 'Stable Diffusion',
    'leonardo_ai': 'Leonardo AI',
    'cursor': 'Cursor',
    'v0': 'v0',
    'bolt': 'Bolt',
    'replit': 'Replit',
    'lovable': 'Lovable',
    'copy_ai': 'Copy.ai',
    'jasper': 'Jasper',
    'wrtn': 'WRTN',
    'perplexity': 'Perplexity',
    'mistral': 'Mistral Large',
    'clovax': 'Clova X',
    'sora': 'Sora',
    'runway': 'Runway',
    'pika': 'Pika Labs',
    'kling': 'Kling',
    'heygen': 'HeyGen',
    'synthesia': 'Synthesia',
    'elevenlabs': 'ElevenLabs',
    'pictory': 'Pictory',
    'flexclip': 'FlexClip',
    'pollo': 'Pollo AI',
    'imagefx': 'ImageFX',
    'whisk': 'Whisk',
    'controlnet': 'ControlNet',
  };
  return models[id] || 'Unknown';
};

const getAIModelIcon = (id: string): string => {
  const icons: Record<string, string> = {
    'chatgpt': '/image/icon_chatgpt.png',
    'claude': '/image/icon_claude.png',
    'claude_artifacts': '/image/icon_claude_artifacts.png',
    'gemini': '/image/icon_gemini.png',
    'gpt4_code': '/image/icon_gpt-4_code.png',
    'midjourney': '/image/icon_midjourney.png',
    'dalle3': '/image/icon_dall_e_3.png',
    'stable_diffusion': '/image/icon_Stable_Diffusion.png',
    'leonardo_ai': '/image/icon_leonardo_ai.png',
    'cursor': '/image/icon_cursor-ai.png',
    'v0': '/image/icon_v0.png',
    'bolt': '/image/icon_bolt-new.png',
    'replit': '/image/icon_Replit.png',
    'lovable': '/image/icon_lovable.png',
    'copy_ai': '/image/icon_Copy-ai.png',
    'jasper': '/image/icon_jasper.png',
    'wrtn': '/image/icon_wrtn.png',
    'perplexity': '/image/icon_perplexity.png',
    'mistral': '/image/icon_mistrallarge.png',
    'clovax': '/image/icon_clovax.png',
    'sora': '/image/icon_Sora.png',
    'runway': '/image/icon_runway.png',
    'pika': '/image/icon_PikaLabs.png',
    'kling': '/image/icon_kling.png',
    'heygen': '/image/icon_heygen.png',
    'synthesia': '/image/icon_synthesia.png',
    'elevenlabs': '/image/icon_ElevenLabs.png',
    'pictory': '/image/icon_pictory_logo.png',
    'flexclip': '/image/icon_flexclip.png',
    'pollo': '/image/icon_pollo-ai.png',
    'imagefx': '/image/icon_imageFX.png',
    'whisk': '/image/icon_whisk.png',
    'controlnet': '/image/icon_controlnet.png',
  };
  return icons[id] || '/image/icon_chatgpt.png';
};