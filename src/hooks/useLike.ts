import useSWR, { mutate as globalMutate } from 'swr';
import { useRef } from 'react';

type LikeState = { 
  likes_count: number;
  is_liked: boolean;
};

const likeKey = (id?: string | number) => {
  if (!id) return null;
  return ['like', String(id)];
};

const fetcher = async (key: string[]) => {
  const promptId = key[1];
  const token = localStorage.getItem('token');
  
  const res = await fetch(`/api/prompts/${promptId}/likes`, {
    method: 'GET',
    headers: token ? {
      'Authorization': `Bearer ${token}`
    } : {}
  });

  if (!res.ok) {
    throw new Error('Failed to fetch like status');
  }

  return res.json();
};

export function useLike(promptId?: string | number) {
  const opId = useRef(0);
  const busy = useRef(false);
  const id = promptId ? String(promptId) : undefined;

  const { data, isLoading, mutate } = useSWR<LikeState>(
    likeKey(id),
    fetcher,
    {
      revalidateOnFocus: false,    // 포커스 리페치 금지
      dedupingInterval: 1500,
      fallbackData: {
        is_liked: false,
        likes_count: 0
      }
    }
  );

  const toggle = async () => {
    if (!id || busy.current || !data) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      // 로그인 필요
      return;
    }

    busy.current = true;
    const myOp = ++opId.current;

    const optimistic: LikeState = {
      is_liked: !data.is_liked,
      likes_count: data.likes_count + (data.is_liked ? -1 : 1),
    };

    // 1) 낙관적 업데이트 (현재 컴포넌트)
    await mutate(optimistic, false);

    // 2) 다른 컴포넌트에도 같은 키로 동기화
    globalMutate(likeKey(id), optimistic, false);

    try {
      // 3) 서버 반영
      const method = data.is_liked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/prompts/${id}/likes`, { 
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to update like');
      }

      const body = await res.json() as LikeState;

      // 레이스 방지: 오래된 응답이면 무시
      if (opId.current !== myOp) return;

      // 서버의 정답으로 동기화
      await mutate(body, false);
      globalMutate(likeKey(id), body, false);
      
    } catch (error) {
      // 레이스 방지: 오래된 응답이면 무시
      if (opId.current !== myOp) return;
      
      // 실패 시 롤백
      await mutate(data, false);
      globalMutate(likeKey(id), data, false);
      
      console.error('Like toggle error:', error);
    } finally {
      busy.current = false;
    }
  };

  return { 
    isLiked: data?.is_liked ?? false, 
    likesCount: data?.likes_count ?? 0, 
    toggle, 
    isLoading,
    isBusy: busy.current
  };
}