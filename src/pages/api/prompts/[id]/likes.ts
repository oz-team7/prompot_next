import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 인증된 요청을 위한 supabase 클라이언트 생성 함수
const getSupabaseClient = (token?: string) => {
  if (token) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const promptId = id as string; // UUID로 처리

  if (!promptId) {
    return res.status(400).json({ error: 'Invalid prompt ID' });
  }

  // Authorization 헤더에서 토큰 추출
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  const supabase = getSupabaseClient(token);

  // GET: 좋아요 수와 현재 사용자의 좋아요 여부 조회
  if (req.method === 'GET') {
    try {
      // 좋아요 수 조회
      const { count, error: countError } = await supabase
        .from('prompt_likes')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', promptId);

      if (countError) {
        console.error('Error counting likes:', countError);
        return res.status(500).json({ error: 'Failed to count likes' });
      }

      // 현재 사용자가 좋아요 했는지 확인
      let isLiked = false;
      if (token) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          const { data: likeData, error: likeError } = await supabase
            .from('prompt_likes')
            .select('id')
            .eq('prompt_id', promptId)
            .eq('user_id', user.id)
            .single();

          if (!likeError && likeData) {
            isLiked = true;
          }
        }
      }

      return res.status(200).json({ 
        likes_count: count || 0,
        is_liked: isLiked
      });
    } catch (error) {
      console.error('Error fetching likes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST/DELETE: 좋아요 추가/제거 (인증 필요)
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    if (req.method === 'POST') {
      // 좋아요 추가 (멱등적 처리)
      const { error: insertError } = await supabase
        .from('prompt_likes')
        .insert([{ prompt_id: promptId, user_id: user.id }]);

      if (insertError) {
        // 이미 좋아요한 경우도 성공으로 처리 (멱등성)
        if (insertError.code === '23505') { // unique constraint violation
          // 이미 존재하므로 성공으로 처리
          const { count } = await supabase
            .from('prompt_likes')
            .select('*', { count: 'exact', head: true })
            .eq('prompt_id', promptId);

          return res.status(200).json({ 
            likes_count: count || 0,
            is_liked: true
          });
        }
        console.error('Error adding like:', insertError);
        return res.status(500).json({ error: 'Failed to add like' });
      }

      // 업데이트된 좋아요 수 반환
      const { count } = await supabase
        .from('prompt_likes')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', promptId);

      return res.status(200).json({ 
        likes_count: count || 0,
        is_liked: true
      });
    } else if (req.method === 'DELETE') {
      // 좋아요 제거 (멱등적 처리)
      const { error: deleteError } = await supabase
        .from('prompt_likes')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return res.status(500).json({ error: 'Failed to remove like' });
      }
      
      // 삭제 성공 또는 이미 없었던 경우 모두 성공으로 처리

      // 업데이트된 좋아요 수 반환
      const { count } = await supabase
        .from('prompt_likes')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', promptId);

      return res.status(200).json({ 
        likes_count: count || 0,
        is_liked: false
      });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}