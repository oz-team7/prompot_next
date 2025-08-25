import { createClient } from '@supabase/supabase-js';

// 하드코딩된 값으로 임시 사용 (환경 변수 문제 해결)
const supabaseUrl = 'https://tlytjitkokavfhwzedml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseXRqaXRrb2thdmZod3plZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzQ4MjcsImV4cCI6MjA3MTI1MDgyN30.BwZDjB7u1q9MJXmK1ufeIXHZ6-aiJ8BRPOszV0Kh0w8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
