import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 인증 확인
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', authData.user.id)
    .single();

  if (profile?.email !== 'prompot7@gmail.com') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const { 
        page = '1', 
        limit = '10', 
        status, 
        priority,
        search 
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // 기본 쿼리 (사용자 정보 포함)
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // 필터 적용
      if (status) {
        query = query.eq('status', status);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }
      if (search) {
        query = query.or(`email.ilike.%${search}%,subject.ilike.%${search}%`);
      }

      // 페이지네이션 적용
      const { data: inquiries, error, count } = await query
        .range(offset, offset + limitNum - 1);

      if (error) {
        console.error('Error fetching inquiries:', error);
        // 테이블이 없을 경우 빈 배열 반환
        if (error.code === '42P01') {
          return res.status(200).json({
            inquiries: [],
            totalPages: 0,
            currentPage: pageNum,
            totalCount: 0
          });
        }
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limitNum);

      return res.status(200).json({
        inquiries: inquiries || [],
        totalPages,
        currentPage: pageNum,
        totalCount: count || 0
      });
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      return res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}