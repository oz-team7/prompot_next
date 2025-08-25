import { useState, useEffect } from 'react';
import { Prompt } from '@/types/prompt';
import { supabase } from '@/lib/supabaseClient';
import { getAIModelName, getAIModelIcon } from '@/utils/aiModels';

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
      
      // Supabase 세션에서 액세스 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const query = options?.author ? '?author=true' : '';
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/prompts${query}`, { headers });
      
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