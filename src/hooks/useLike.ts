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
  
  try {
    const res = await fetch(`/api/prompts/${promptId}/likes`, {
      method: 'GET',
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });

    if (!res.ok) {
      console.error(`Like API error for ${promptId}:`, res.status, res.statusText);
      // 에러가 발생해도 기본값 반환하여 무한 재시도 방지
      return {
        likes_count: 0,
        is_liked: false
      };
    }

    return res.json();
  } catch (error) {
    console.error(`Like API fetch error for ${promptId}:`, error);
    // 네트워크 에러 등이 발생해도 기본값 반환
    return {
      likes_count: 0,
      is_liked: false
    };
  }
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
      revalidateOnReconnect: false, // 재연결 시 리페치 금지
      dedupingInterval: 5000,      // 중복 요청 방지 간격 증가
      errorRetryCount: 2,          // 재시도 횟수 제한
      errorRetryInterval: 1000,    // 재시도 간격
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
      console.warn('No token found for like operation');
      return;
    }

    // 토큰 유효성 간단 검사 (JWT 형식 확인)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.error('Invalid token format:', token.substring(0, 20) + '...');
      // 토큰이 유효하지 않으면 localStorage에서 제거
      localStorage.removeItem('token');
      return;
    }

    // 토큰 만료 확인 (간단한 방법)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.error('Token expired');
        localStorage.removeItem('token');
        return;
      }
    } catch (e) {
      console.error('Token decode error:', e);
      localStorage.removeItem('token');
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
        const errorData = await res.json().catch(() => ({}));
        console.error(`Like API error for ${id}:`, res.status, res.statusText, errorData);
        throw new Error(`Failed to update like: ${res.status} ${res.statusText}`);
      }

      const body = await res.json() as LikeState;

      // 레이스 방지: 오래된 응답이면 무시
      if (opId.current !== myOp) {
        busy.current = false;
        return;
      }

      // 서버의 정답으로 동기화
      await mutate(body, false);
      globalMutate(likeKey(id), body, false);
      
    } catch (error) {
      // 레이스 방지: 오래된 응답이면 무시
      if (opId.current !== myOp) {
        busy.current = false;
        return;
      }
      
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