import { createClient } from '@supabase/supabase-js';

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 필수 환경 변수 검증
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 현재 환경에 따른 사이트 URL 반환 함수
export const getSiteUrl = () => {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드
    return window.location.origin;
  }
  
  // 서버 사이드
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://prompot-next.vercel.app';
  }
  
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};
