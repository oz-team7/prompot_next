#!/bin/bash

# 환경 변수 설정 스크립트
echo "환경 변수 파일들을 생성합니다..."

# .env.local 파일 생성
cat > .env.local << 'EOF'
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://tlytjitkokavfhwzedml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseXRqaXRrb2thdmZod3plZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzQ4MjcsImV4cCI6MjA3MTI1MDgyN30.BwZDjB7u1q9MJXmK1ufeIXHZ6-aiJ8BRPOszV0Kh0w8

# Supabase 서비스 롤 키 (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseXRqaXRrb2thdmZod3plZG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3NDgyNywiZXhwIjoyMDcxMjUwODI3fQ.bmIBEemcv6QR6pqbzKEqOB_KrCXUXJ-fbTRt7O7qV_c

# Supabase CLI 액세스 토큰
SUPABASE_ACCESS_TOKEN=sbp_c1efde168325ad9dec24bf77836a7633286f8453

# JWT 시크릿 제거됨 - Supabase Auth 사용

# 사이트 URL 설정
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCTION_URL=https://prompot-next.vercel.app

# 서버 포트
PORT=3000

# 환경 설정
NODE_ENV=development
EOF

# .env.production 파일 생성
cat > .env.production << 'EOF'
# Production 환경 변수 설정
NEXT_PUBLIC_PRODUCTION_URL="https://prompot-next.vercel.app"
NEXT_PUBLIC_SITE_URL="https://prompot-next.vercel.app"

# Supabase 설정 (프로덕션용)
NEXT_PUBLIC_SUPABASE_URL="https://tlytjitkokavfhwzedml.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseXRqaXRrb2thdmZod3plZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzQwMDAsImV4cCI6MjA3MTc1MDAwMH0.OszV0Kh0w8"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseXRqaXRrb2thdmZod3plZG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA3MTc1MDAwMH0.TRt7O7qV_c"

# Supabase CLI 액세스 토큰 (프로덕션용)
SUPABASE_ACCESS_TOKEN="sbp_c1efde168325ad9dec24bf77836a7633286f8453"

# JWT 시크릿 제거됨 - Supabase Auth 사용

# 환경 설정
NODE_ENV="production"

# Vercel 설정
VERCEL="1"
VERCEL_ENV="production"
VERCEL_TARGET_ENV="production"
EOF

echo "✅ 환경 변수 파일들이 성공적으로 생성되었습니다!"
echo "📁 .env.local - 개발 환경용"
echo "📁 .env.production - 프로덕션 환경용"
echo ""
echo "🔑 Supabase CLI 액세스 토큰이 포함되었습니다:"
echo "   sbp_c1efde168325ad9dec24bf77836a7633286f8453"
echo ""
echo "🚀 이제 개발 서버를 재시작하세요!"
