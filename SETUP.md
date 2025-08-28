# PROMPOT 개발 환경 설정 가이드 (v2.0)

## 📌 필수 사전 준비사항

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정해야 합니다:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 앱 설정
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> ⚠️ **주의**: 
> - 환경 변수 값은 팀 리더에게 문의하세요.
> - JWT_SECRET과 DATABASE_URL은 v2.0부터 필요하지 않습니다.

### 2. Node.js 버전
- Node.js 18.0.0 이상 필요
- 권장 버전: Node.js 20.x LTS

### 3. Supabase 프로젝트
- [Supabase](https://supabase.com)에서 프로젝트 생성 필요
- 프로젝트 URL과 API 키 확인

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

### 3단계: Supabase 데이터베이스 설정

#### 3-1. Supabase 대시보드에서 SQL Editor 접속

#### 3-2. 테이블 생성 (다음 SQL 실행)
```sql
-- profiles 테이블 (Supabase Auth와 연동)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- prompts 테이블
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags JSONB,
  ai_model TEXT,
  preview_image TEXT,
  is_public BOOLEAN DEFAULT true,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Public prompts are viewable by everyone" ON prompts
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own prompts" ON prompts
  FOR DELETE USING (auth.uid() = author_id);
```

### 4단계: 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📦 주요 패키지 정보

### 핵심 패키지 (v2.0)
- `@supabase/supabase-js`: Supabase 클라이언트 라이브러리
- `@supabase/ssr`: Next.js SSR 지원 (쿠키 기반 세션 관리)
- `next`: React 프레임워크 (App Router)
- `tailwindcss`: CSS 프레임워크
- `typescript`: 타입스크립트

### 제거된 패키지 (v2.0)
- ~~`prisma`~~: Supabase 직접 쿼리로 대체
- ~~`bcryptjs`~~: Supabase Auth로 대체
- ~~`jsonwebtoken`~~: Supabase Auth로 대체
- ~~`@supabase/auth-helpers-nextjs`~~: @supabase/ssr로 대체

## 🗄️ Supabase 설정

### 데이터베이스 구조
- `profiles`: 사용자 프로필 (Supabase Auth와 연동)
- `prompts`: 프롬프트 데이터
- `likes`: 좋아요 정보 (예정)
- `bookmarks`: 북마크 정보 (예정)

### 인증 설정
- Supabase Auth를 사용한 이메일/비밀번호 인증
- OAuth 로그인 (Google, Kakao) - 개발 중

### Row Level Security (RLS)
- 모든 테이블에 RLS 활성화
- 사용자별 접근 권한 제어
- Service Role Key로 관리자 권한 접근

## 🐛 문제 해결

### npm install 실패 시
```bash
# 캐시 삭제 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Supabase 연결 오류
- `.env.local` 파일의 환경 변수 확인
- Supabase 대시보드에서 프로젝트 상태 확인
- Service Role Key가 올바른지 확인

### 인증 관련 오류
- 브라우저 쿠키 삭제 후 재시도
- Supabase 대시보드에서 Auth 설정 확인
- Email 인증이 활성화되어 있는지 확인

### RLS 정책 오류
- Supabase 대시보드에서 RLS 정책 확인
- Service Role Key 사용 여부 확인

## 🔧 유용한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 타입 체크
npm run type-check

# ESLint 실행
npm run lint
```

## 📚 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [프로젝트 README](./README.md)

## 📞 도움이 필요하면

- 프로젝트 관련 문의: 팀 리더
- 기술 지원: 개발팀 슬랙 채널
- 환경 변수 요청: 보안 담당자
- GitHub Issues: [프로젝트 저장소](https://github.com/prompot/prompot)

---
*최종 업데이트: 2025년 8월 28일 (v2.0)*
