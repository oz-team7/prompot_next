import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/types/prompt';

export const usePrompts = (options?: { author?: boolean; sort?: string }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams();
      if (options?.author) {
        params.append('author', 'true');
      }
      if (options?.sort) {
        params.append('sort', options.sort);
      }
      
      const query = params.toString() ? `?${params.toString()}` : '';
      console.log('[DEBUG] usePrompts fetching with query:', query); // 디버깅 로그 추가
      
      // localStorage에서 토큰 가져오기 (선택) - 클라이언트 사이드에서만
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('[DEBUG] usePrompts token from localStorage:', token ? 'exists' : 'not found');
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('[DEBUG] usePrompts request headers:', headers);
      
      const res = await fetch(`/api/prompts${query}`, {
        headers,
      });
      
      console.log('[DEBUG] usePrompts response status:', res.status);
      console.log('[DEBUG] usePrompts response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          console.error('[DEBUG] Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }
        console.error('[DEBUG] usePrompts API error:', errorData);
        throw new Error(errorData.message || `프롬프트를 가져오는데 실패했습니다. (${res.status})`);
      }

      const data = await res.json();
      console.log('[DEBUG] usePrompts response data:', data); // 디버깅 로그 추가
      
      // API 응답 구조 확인 및 처리
      const promptsData = data.data?.prompts || data.prompts || [];
      console.log('[DEBUG] Extracted prompts data:', promptsData);
      
      if (!Array.isArray(promptsData)) {
        console.error('[DEBUG] Prompts data is not an array:', promptsData);
        throw new Error('프롬프트 데이터 형식이 올바르지 않습니다.');
      }
      
      const formattedPrompts = promptsData.map((prompt: any) => ({
        ...prompt,
        aiModel: prompt.aiModel ? {
          name: getAIModelName(prompt.aiModel),
          icon: getAIModelIcon(prompt.aiModel),
        } : undefined,
      }));
      
      console.log('[DEBUG] Formatted prompts:', formattedPrompts); // 디버깅 로그 추가
      setPrompts(formattedPrompts);
    } catch (err: unknown) {
      console.error('[DEBUG] usePrompts error:', err); // 디버깅 로그 추가
      
      // 네트워크 오류나 기타 예외 상황 처리
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('네트워크 연결을 확인해주세요.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [options?.sort, options?.author]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const refetch = useCallback(() => {
    console.log('[DEBUG] usePrompts refetch called with options:', options);
    fetchPrompts();
  }, [fetchPrompts]);

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