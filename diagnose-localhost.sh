#!/bin/bash

# 로컬 개발 서버 진단 스크립트
# 사용법: ./diagnose-localhost.sh

echo "🔍 로컬 개발 서버 진단 시작..."
echo "=================================="

# 1. 환경 정보 확인
echo "📋 환경 정보:"
echo "OS: $(uname -s) $(uname -r)"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "현재 디렉토리: $(pwd)"
echo ""

# 2. 포트 사용 확인
echo "🔌 포트 3000 사용 현황:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "포트 3000이 사용 중입니다:"
    lsof -i :3000
else
    echo "포트 3000이 비어있습니다."
fi
echo ""

# 3. 프로세스 확인
echo "⚙️ Node.js 프로세스 확인:"
ps aux | grep -E "(npm|next|node)" | grep -v grep || echo "Node.js 프로세스가 실행되지 않았습니다."
echo ""

# 4. 환경변수 확인
echo "🌍 환경변수 확인:"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-'❌ 설정되지 않음'}"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+✅ 설정됨}"
echo "NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-'❌ 설정되지 않음'}"
echo "NODE_ENV: ${NODE_ENV:-'❌ 설정되지 않음'}"
echo ""

# 5. 파일 감시자 한계 확인 (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "👀 파일 감시자 한계 (macOS):"
    echo "kern.maxfiles: $(sysctl -n kern.maxfiles)"
    echo "kern.maxfilesperproc: $(sysctl -n kern.maxfilesperproc)"
    echo "현재 열린 파일 수: $(lsof | wc -l)"
    echo ""
fi

# 6. TypeScript 컴파일 확인
echo "📝 TypeScript 컴파일 확인:"
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript 컴파일 성공"
else
    echo "❌ TypeScript 컴파일 실패"
    echo "에러 로그:"
    npm run type-check 2>&1 | head -10
fi
echo ""

# 7. 빌드 테스트
echo "🏗️ 빌드 테스트:"
if npm run build > /dev/null 2>&1; then
    echo "✅ 빌드 성공"
else
    echo "❌ 빌드 실패"
    echo "에러 로그:"
    npm run build 2>&1 | head -10
fi
echo ""

# 8. 서버 연결 테스트
echo "🌐 서버 연결 테스트:"
if curl -s -I http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 서버 연결 성공"
    echo "응답 상태: $(curl -s -I http://localhost:3000 | head -1)"
else
    echo "❌ 서버 연결 실패"
fi
echo ""

# 9. API 엔드포인트 테스트
echo "🔗 API 엔드포인트 테스트:"
if curl -s http://localhost:3000/api/env-check > /dev/null 2>&1; then
    echo "✅ API 엔드포인트 정상"
else
    echo "❌ API 엔드포인트 오류"
fi
echo ""

echo "=================================="
echo "🎯 진단 완료!"
echo ""
echo "💡 다음 단계:"
echo "1. 문제가 발견된 경우 해당 섹션을 확인하세요"
echo "2. 서버를 재시작하려면: npm run dev"
echo "3. 포트를 정리하려면: lsof -ti:3000 | xargs kill -9"
echo "4. 캐시를 정리하려면: npm run clean"
