#!/bin/bash

# 개발 서버 상태 확인 스크립트
# 개발 환경 모니터링

echo "🔍 개발 서버 상태 확인 중..."

# 서버가 실행 중인지 확인
if ! curl -s http://localhost:3000/api/test-basic > /dev/null 2>&1; then
    echo "❌ 개발 서버가 실행되지 않았거나 응답하지 않습니다."
    echo "💡 해결 방법:"
    echo "   1. npm run dev:clean 실행"
    echo "   2. 또는 npm run dev 실행"
    exit 1
fi

echo "✅ 개발 서버가 정상적으로 실행 중입니다."

# API 엔드포인트 테스트
echo "🧪 주요 API 엔드포인트 테스트 중..."

# 기본 API 테스트
echo -n "  📡 기본 API: "
if curl -s http://localhost:3000/api/test-basic | grep -q "ok"; then
    echo "✅ 정상"
else
    echo "❌ 오류"
fi

# 북마크 API 테스트 (인증 없이)
echo -n "  📚 북마크 API: "
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/bookmarks)
if echo "$response" | grep -q "401\|200"; then
    echo "✅ 정상"
else
    echo "❌ 예상과 다른 응답"
fi

# 환경 변수 확인
echo "🔧 환경 변수 확인:"
if [ -f ".env.local" ]; then
    echo "  ✅ .env.local 파일 존재"
else
    echo "  ⚠️  .env.local 파일이 없습니다."
fi

# Next.js 캐시 상태 확인
echo "📁 캐시 상태 확인:"
if [ -d ".next" ]; then
    echo "  ✅ .next 디렉토리 존재"
    cache_size=$(du -sh .next 2>/dev/null | cut -f1)
    echo "  📊 캐시 크기: $cache_size"
else
    echo "  ℹ️  .next 디렉토리가 없습니다 (정상 - 아직 빌드되지 않음)"
fi

echo ""
echo "🎉 개발 환경 상태 확인 완료!"
echo "💡 문제가 있다면 'npm run dev:clean'을 실행해보세요."
