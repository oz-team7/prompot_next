import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/types/prompt';
import { fetchWithLogging } from '@/lib/api-logger';

export const usePrompts = (options?: { author?: boolean; sort?: string }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // 요청 시작 시 에러 상태 초기화
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams();
      if (options?.author) {
        params.append('author', 'true');
      }
      if (options?.sort) {
        params.append('sort', options.sort);
      }
      
      const query = params.toString() ? `?${params.toString()}` : '';
      console.log('[DEBUG] usePrompts fetching with query:', query);
      
      // localStorage에서 토큰 가져오기 (선택) - 클라이언트 사이드에서만
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('[DEBUG] usePrompts token from localStorage:', token ? 'exists' : 'not found');
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('[DEBUG] usePrompts request headers:', headers);
      
      // 메인 API 시도
      let res;
      try {
        console.log('[DEBUG] usePrompts attempting main API call to:', `/api/prompts${query}`);
        res = await fetchWithLogging(`/api/prompts${query}`, {
          headers,
        });
        
        console.log('[DEBUG] usePrompts main API response status:', res.status);
        console.log('[DEBUG] usePrompts main API response ok:', res.ok);
        console.log('[DEBUG] usePrompts main API response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[DEBUG] usePrompts main API error response:', errorText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (mainApiError: any) {
        console.warn('[DEBUG] Main API failed, trying fallback:', mainApiError.message);
        console.error('[DEBUG] Main API error details:', {
          name: mainApiError.name,
          message: mainApiError.message,
          stack: mainApiError.stack
        });
        
        // 대체 API 시도
        try {
          console.log('[DEBUG] usePrompts attempting fallback API call to:', `/api/prompts-fallback${query}`);
          res = await fetchWithLogging(`/api/prompts-fallback${query}`, {
            headers,
          });
          
          console.log('[DEBUG] Fallback API response status:', res.status);
          console.log('[DEBUG] Fallback API response ok:', res.ok);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('[DEBUG] usePrompts fallback API error response:', errorText);
            throw new Error(`Fallback API failed: HTTP ${res.status}`);
          }
        } catch (fallbackError: any) {
          console.error('[DEBUG] Both APIs failed:', fallbackError.message);
          console.error('[DEBUG] Fallback API error details:', {
            name: fallbackError.name,
            message: fallbackError.message,
            stack: fallbackError.stack
          });
          throw new Error('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        }
      }
      
      const data = await res.json();
      // console.log('[DEBUG] usePrompts response data:', data);
      
      // API 응답 구조 확인 및 처리
      const promptsData = data.data?.prompts || data.prompts || [];
      // console.log('[DEBUG] Extracted prompts data:', promptsData);
      
      if (!Array.isArray(promptsData)) {
        console.error('[DEBUG] Prompts data is not an array:', promptsData);
        throw new Error('프롬프트 데이터 형식이 올바르지 않습니다.');
      }
      
      const formattedPrompts = promptsData.map((prompt: any) => {
        // console.log('[DEBUG] Processing prompt:', { title: prompt.title, ai_model: prompt.ai_model });
        return {
          ...prompt,
          aiModel: prompt.ai_model ? {
            name: getAIModelName(prompt.ai_model),
            icon: getAIModelIcon(prompt.ai_model),
          } : undefined,
        };
      });
      
      // console.log('[DEBUG] Formatted prompts:', formattedPrompts);
      setPrompts(formattedPrompts);
      
      // 대체 API 사용 시에만 사용자에게 알림 (메인 API 성공 시에는 알림 제거)
      if (data.warning && data.warning.includes('mock data')) {
        console.warn('[DEBUG] Using fallback data:', data.warning);
        setError(`⚠️ ${data.warning}`);
      } else {
        // 메인 API 성공 시 이전 에러 상태 초기화
        setError(null);
      }
      
    } catch (err: unknown) {
      console.error('[DEBUG] usePrompts error:', err);
      
      // 네트워크 오류나 기타 예외 상황 처리
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('[DEBUG] Network fetch error detected');
        setError('네트워크 연결을 확인해주세요.');
      } else if (err instanceof Error) {
        console.error('[DEBUG] Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        setError(err.message);
      } else {
        console.error('[DEBUG] Unknown error type:', typeof err, err);
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