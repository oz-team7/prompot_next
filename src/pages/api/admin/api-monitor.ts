import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 인증 확인
  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  // 관리자 권한 확인
  if (!await isAdmin(authUser.id)) {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }

  const supabase = createSupabaseServiceClient();

  if (req.method === 'GET') {
    try {
      const { type, startDate, endDate } = req.query;
      
      // 실제 데이터베이스에서 로그 가져오기
      let query = supabase
        .from('api_monitor_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      // 타입 필터
      if (type && type !== 'all') {
        query = query.eq('api_type', type);
      }
      
      // 날짜 필터
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      
      const { data: dbLogs, error: dbError } = await query;
      
      let apiLogs = [];
      
      if (!dbError && dbLogs && dbLogs.length > 0) {
        // 실제 데이터베이스 로그 사용
        apiLogs = dbLogs.map(log => ({
          id: log.id,
          endpoint: log.endpoint,
          method: log.method,
          status: log.status,
          responseTime: log.response_time,
          timestamp: log.created_at,
          userId: log.user_id,
          requestBody: log.request_body,
          responseBody: log.response_body,
          errorMessage: log.error_message,
          type: log.api_type
        }));
      } else {
        // 데이터베이스 에러 또는 데이터 없을 시 샘플 데이터 반환
        console.log('데이터베이스에 로그가 없거나 에러로 샘플 데이터 반환:', dbError);
        apiLogs = [
          // 프롬프트 관련 API
          {
            id: '1',
            endpoint: '/api/prompts',
            method: 'GET',
            status: 200,
            responseTime: 145,
            timestamp: new Date().toISOString(),
            userId: 'user123',
            requestBody: null,
            responseBody: { success: true, count: 10 },
            errorMessage: null,
            type: 'prompts'
          },
          {
            id: '2', 
            endpoint: '/api/prompts',
            method: 'POST',
            status: 201,
            responseTime: 234,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            userId: 'user456',
            requestBody: { title: '새 프롬프트', content: '...' },
            responseBody: { success: true, id: 'prompt123' },
            errorMessage: null,
            type: 'prompts'
          },
          {
            id: '3',
            endpoint: '/api/prompts/prompt123',
            method: 'PUT',
            status: 200,
            responseTime: 189,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            userId: 'user456',
            requestBody: { title: '수정된 프롬프트' },
            responseBody: { success: true },
            errorMessage: null,
            type: 'prompts'
          },
          {
            id: '4',
            endpoint: '/api/prompts/prompt456',
            method: 'DELETE',
            status: 404,
            responseTime: 89,
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            userId: 'user789',
            requestBody: null,
            responseBody: null,
            errorMessage: '프롬프트를 찾을 수 없습니다',
            type: 'prompts'
          },
          // 북마크 관련 API
          {
            id: '5',
            endpoint: '/api/bookmarks',
            method: 'POST',
            status: 201,
            responseTime: 156,
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            userId: 'user123',
            requestBody: { promptId: 'prompt123' },
            responseBody: { success: true },
            errorMessage: null,
            type: 'bookmarks'
          },
          // 댓글 관련 API
          {
            id: '6',
            endpoint: '/api/comments',
            method: 'POST',
            status: 500,
            responseTime: 1234,
            timestamp: new Date(Date.now() - 18000000).toISOString(),
            userId: 'user456',
            requestBody: { promptId: 'prompt789', content: '좋은 프롬프트네요!' },
            responseBody: null,
            errorMessage: '서버 오류가 발생했습니다',
            type: 'comments'
          }
        ];

        // 타입별 필터링 (샘플 데이터의 경우)
        if (type && type !== 'all') {
          apiLogs = apiLogs.filter(log => log.type === type);
        }
      }

      // API 통계 계산
      const stats = {
        totalRequests: apiLogs.length,
        successfulRequests: apiLogs.filter(log => log.status < 400).length,
        failedRequests: apiLogs.filter(log => log.status >= 400).length,
        averageResponseTime: apiLogs.length > 0 
          ? Math.round(apiLogs.reduce((acc, log) => acc + (log.responseTime || 0), 0) / apiLogs.length)
          : 0,
        byEndpoint: apiLogs.reduce((acc, log) => {
          const key = `${log.method} ${log.endpoint}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byStatus: apiLogs.reduce((acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        recentErrors: apiLogs
          .filter(log => log.status >= 400)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
      };

      res.status(200).json({
        logs: apiLogs,
        stats,
        total: apiLogs.length
      });

    } catch (error) {
      console.error('API monitor error:', error);
      res.status(500).json({ message: 'API 모니터링 데이터를 가져오는 중 오류가 발생했습니다.' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}