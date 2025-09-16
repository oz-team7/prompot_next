// API 호출 로깅을 위한 유틸리티
interface ApiLogEntry {
  id?: string;
  endpoint: string;
  method: string;
  status?: number;
  responseTime?: number;
  timestamp: string;
  userId?: string;
  requestBody?: any;
  responseBody?: any;
  errorMessage?: string | null;
  type: string;
}

const API_LOG_KEY = 'prompot_api_logs';
const MAX_LOGS = 50; // 로그 수 감소

// localStorage 용량 체크
const checkStorageSpace = () => {
  try {
    // 현재 사용량 추정
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    // 5MB 중 4MB 이상 사용시 정리 필요
    return totalSize > 4 * 1024 * 1024;
  } catch {
    return false;
  }
};

// API 로그를 서버로 전송
export const logApiCall = async (logEntry: ApiLogEntry) => {
  if (typeof window === 'undefined') return;
  
  try {
    // localStorage 용량 체크
    if (checkStorageSpace()) {
      // API 로그 전체 삭제
      localStorage.removeItem(API_LOG_KEY);
      console.warn('localStorage is almost full, cleared API logs');
    }
    
    // 로컬 스토리지에 백업 저장
    const logs = getApiLogs();
    
    // 민감한 정보와 큰 데이터 제거
    const sanitizedLogEntry = {
      ...logEntry,
      id: Date.now().toString(),
      // 요청/응답 본문 제거 (용량 절약)
      requestBody: undefined,
      responseBody: undefined,
    };
    
    logs.unshift(sanitizedLogEntry);
    
    // 최대 로그 수 제한
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS);
    }
    
    try {
      localStorage.setItem(API_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        // 용량 초과시 로그 전체 삭제 후 재시도
        localStorage.removeItem(API_LOG_KEY);
        console.warn('localStorage quota exceeded, cleared API logs');
        
        // 현재 로그만 저장
        localStorage.setItem(API_LOG_KEY, JSON.stringify([sanitizedLogEntry]));
      }
    }
    
    // 서버로 전송 (비동기, 실패해도 API 호출에는 영향 없음)
    fetch('/api/log-api-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...logEntry,
        apiType: getApiType(logEntry.endpoint),
      }),
    }).catch(err => {
      console.error('Failed to send API log to server:', err);
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
    // 로깅 실패해도 API 호출은 계속 진행
  }
};

export const getApiLogs = (): ApiLogEntry[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const logs = localStorage.getItem(API_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

// API 타입 추출
export const getApiType = (endpoint: string): string => {
  if (endpoint.includes('/prompts')) return 'prompts';
  if (endpoint.includes('/bookmarks')) return 'bookmarks';
  if (endpoint.includes('/comments')) return 'comments';
  if (endpoint.includes('/users')) return 'users';
  if (endpoint.includes('/auth')) return 'auth';
  return 'other';
};

// Fetch wrapper with logging
export const fetchWithLogging = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const startTime = performance.now();
  const endpoint = url.replace(/^https?:\/\/[^\/]+/, ''); // Remove domain
  const method = options.method || 'GET';
  
  // 토큰이 있으면 자동으로 Authorization 헤더 추가
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    // headers를 Record<string, string> 타입으로 변환
    const headers = new Headers(options.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    options.headers = headers;
  }
  
  let response: Response;
  let errorMessage: string | null = null;
  
  try {
    response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.clone().json().catch(() => null);
      errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
    }
    
    const responseTime = Math.round(performance.now() - startTime);
    
    // Log the API call (응답 본문 제외)
    logApiCall({
      endpoint,
      method,
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('user_id') || undefined,
      requestBody: null, // 용량 절약을 위해 제거
      responseBody: null, // 용량 절약을 위해 제거
      errorMessage,
      type: getApiType(endpoint),
    });
    
    return response;
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    // Log failed API call
    logApiCall({
      endpoint,
      method,
      status: 0,
      responseTime,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('user_id') || undefined,
      requestBody: null, // 용량 절약을 위해 제거
      responseBody: null,
      errorMessage: error instanceof Error ? error.message : 'Network error',
      type: getApiType(endpoint),
    });
    
    throw error;
  }
};

// API 로그 정리 함수
export const clearApiLogs = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(API_LOG_KEY);
    console.log('API logs cleared');
  } catch (error) {
    console.error('Failed to clear API logs:', error);
  }
};

// localStorage 전체 용량 확인 함수
export const getLocalStorageSize = () => {
  if (typeof window === 'undefined') return 0;
  
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  return totalSize;
};