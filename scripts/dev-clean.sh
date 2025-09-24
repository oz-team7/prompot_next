#!/bin/bash

# 개발 서버 시작 전 캐시 정리 스크립트
# 개발 환경 안정화

echo "🧹 개발 환경 캐시 정리 중..."

# Next.js 빌드 캐시 제거
if [ -d ".next" ]; then
    echo "📁 .next 디렉토리 제거 중..."
    rm -rf .next
fi

# node_modules 캐시 정리 (선택적)
if [ "$1" = "--deep" ]; then
    echo "🔍 깊은 정리 모드 - node_modules 캐시도 정리합니다..."
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
    fi
fi

# npm 캐시 정리 (선택적)
if [ "$1" = "--deep" ]; then
    echo "📦 npm 캐시 정리 중..."
    npm cache clean --force
fi

echo "✅ 캐시 정리 완료!"
echo "🚀 개발 서버를 시작합니다..."

# 개발 서버 시작
npm run dev
