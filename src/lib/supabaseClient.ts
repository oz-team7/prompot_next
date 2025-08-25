import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 가져오거나 하드코딩으로 테스트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgpq7pqo2.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHE3cHFvMiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1MTI5NjAwLCJleHAiOjIwNTA3MDU2MDB9.your_actual_anon_key_here';

// 환경 변수 디버깅
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '***' : 'undefined');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
