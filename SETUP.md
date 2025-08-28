# PROMPOT 개발 환경 설정 가이드

## 📌 필수 사전 준비사항

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정해야 합니다:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT 시크릿
JWT_SECRET="your-jwt-secret"

# 데이터베이스 URL
DATABASE_URL="postgresql://..."
```

> ⚠️ **주의**: 환경 변수 값은 팀 리더에게 문의하세요.

### 2. Node.js 버전
- Node.js 18.0.0 이상 필요
- 권장 버전: Node.js 20.x LTS

## 🚀 프로젝트 시작하기

### 1단계: 저장소 클론
```bash
git clone [repository-url]
cd prompot
```

### 2단계: 의존성 설치
```bash
npm install
```

### 3단계: 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (개발용)
npx prisma migrate dev
```

### 4단계: 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📦 주요 패키지 정보

### Supabase 관련 패키지
- `@supabase/supabase-js`: Supabase 클라이언트 라이브러리
- `@supabase/ssr`: Next.js SSR 지원
- `@supabase/auth-helpers-nextjs`: Next.js 인증 헬퍼 (deprecated, SSR 사용 권장)

### 기타 주요 패키지
- `prisma`: 데이터베이스 ORM
- `next`: React 프레임워크
- `tailwindcss`: CSS 프레임워크
- `typescript`: 타입스크립트

## 🗄️ Supabase 설정

### 데이터베이스 구조
```sql
-- users: 사용자 정보
-- prompts: 프롬프트 데이터
-- likes: 좋아요 정보
-- bookmarks: 북마크 정보
```

### 인증 설정
- Supabase Auth를 사용한 이메일/비밀번호 인증
- OAuth 로그인 (Google, Kakao) - 추가 예정

## 🐛 문제 해결

### npm install 실패 시
```bash
# 캐시 삭제 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Prisma 관련 오류
```bash
# Prisma 클라이언트 재생성
npx prisma generate
```

### Supabase 연결 오류
- `.env.local` 파일의 환경 변수 확인
- Supabase 대시보드에서 프로젝트 상태 확인

## 📞 도움이 필요하면

- 프로젝트 관련 문의: 팀 리더
- 기술 지원: 개발팀 슬랙 채널
- 환경 변수 요청: 보안 담당자

---
*최종 업데이트: 2025년 8월*