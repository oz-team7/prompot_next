# PRD: PROMPOT - 프롬프트 공유 플랫폼 (Updated v2.0)

## 문서 정보
- 제목: 프롬프트 프롬프트를 저장/정리/공유할 수 있는 무료 플랫폼 서비스  
- 버전 정보: v2.0  
- 작성일자: 2024.08.14  
- 최종 수정: 2024.09.16
- 작성자: PROMPOT Team  
- 상태: Production Ready  

---

## 개요 (Overview)
**PROMPOT (프롬팟)**은 AI 프롬프트를 **누구나 쉽게 저장**할 수 있는 **무료 커뮤니티 기반 플랫폼**입니다.  
사용자는 자신의 프롬프트를 업로드하여 공유하고, AI 사용자들과 소통하며 함께 성장할 수 있습니다.  

---

## 목표 (Goal)
- 프롬프트 접근성 향상 보장  
- 사용자간 **창의적인 프롬프트 공유 문화** 형성  
- 저장/정리/공유를 통한 개인화된 워크플로우 지원  

---

## 문제점 (Problem & Opportunity)

### 현재 상황
- 프롬프트 작성/저장/관리가 어려움  
- 다양한 무료 공유 커뮤니티 플랫폼 부재  
- 유료 서비스(promptly.fyi 등)만 존재 → 진입 장벽이 높음  

### 기회 (Opportunity)
- 급성장하는 AI 사용자 니즈에 맞춘 프롬프트 시장 성장  
- 무료 기반 커뮤니티로 공유 문화 확산  
- 광고를 통한 안정적인 수익 구조  

---

## 대상 사용자 (Target Users)
- 학생, 직장인, 창작자, 연구자  
- 프롬프트 작성에 어려움을 느끼는 AI 사용자  
- 효율적인 프롬프트를 찾아다니는 사람들  

---

## 핵심 목표 (Goals)
- **무료 공유 플랫폼 구축**  
- 프롬프트 공유 & 커뮤니티 활성화  
- 안정적인 광고 수익으로 지속가능성 확보  
- 커뮤니티 중심의 집단지성 활용  

---

### KPI (성과 지표)
- 월간 활성 사용자(MAU): 5,000  
- 등록 프롬프트 수: 10,000개  
- 재방문율(30일): 40% 이상  

---

## 수익화 전략

### 수익 모델
1. **광고 수익**  
    - Google AdSense, Kakao AdFit 등의 광고망 활용  

※ 모든 서비스는 **100% 무료**로 제공되며, 오직 광고 수익만으로 운영  

---

## 서비스 기능 (Scope)

### 1. 프롬프트 업로드
- 사진 포함 등록 저장  
- 카테고리, 태그, 설명 추가  
- 버전관리 및 수정 기록  
- 업로드/공유 권한 설정  

### 2. 탐색 & 필터링
- 카테고리 정렬  
- 카테고리 / 태그 검색  
- 인기순 / 최신순 정렬  

### 3. 공유 & 커뮤니티
- 프롬프트 좋아요/북마크 기능  
- 댓글, 리뷰, 평점 기능  
- 사용자 팔로우 & 피드 확인  

### 4. 계정 & 권한
- Google, Kakao OAuth 간편로그인  
- 모든 기능 무제한 무료 이용  

### 향후 추가 기능
- 프롬프트 버전 관리 고도화  
- 리뷰/평가 시스템  
- 버전 컨트롤 업데이트  

---

## UI / UX 디자인

- **브랜드명**: Prompt Pot  
- **컬러 테마**  
  - Primary: `#FF7A00` (Orange) - v1.1 변경  
  - Accent: `#FFFFFF` (White)  
  - Text: `#000000` (Black)  
- **폰트**: Pretendard / Noto Sans KR  
- **레이아웃**: 반응형, 카드형, 깔끔한 UI 디자인  
- **스타일**: 모바일 퍼스트 (컴팩트한 디자인, 이미지 중심 레이아웃)  

---

## 기술 스택 (Tech Stack)

### Frontend
- Next.js + TypeScript  
- TailwindCSS  
- Vercel 배포  

### Backend (Production)
- Express.js  
- MongoDB (Mongoose ODM)  
- OAuth 인증 (Google, Kakao)  
- 파일 저장: S3 Compatible  

### Backend (v2.0 - Supabase 통합)
- Next.js API Routes
- Supabase (PostgreSQL + Auth + Storage)
- Supabase Auth (OAuth 지원)
- Cookie 기반 세션 관리
- Row Level Security (RLS) 활성화

### DB Schema 설계 (Supabase PostgreSQL)

**테이블 구조**
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
  additional_images JSONB,
  video_url TEXT,
  is_public BOOLEAN DEFAULT true,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  views INTEGER DEFAULT 0,
  result_type TEXT DEFAULT 'image' CHECK (result_type IN ('image', 'text')),
  text_result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- prompt_likes 테이블
CREATE TABLE prompt_likes (
  user_id UUID REFERENCES profiles(id),
  prompt_id INTEGER REFERENCES prompts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  PRIMARY KEY (user_id, prompt_id)
);

-- user_bookmarks 테이블
CREATE TABLE user_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  prompt_id INTEGER REFERENCES prompts(id) NOT NULL,
  category_id UUID REFERENCES bookmark_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, prompt_id)
);

-- bookmark_categories 테이블
CREATE TABLE bookmark_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FF7A00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- comments 테이블
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  prompt_id INTEGER REFERENCES prompts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- reports 테이블
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

---

## 법적 & 윤리 고려
- 저작권/지적재산권: 업로드된 프롬프트 소유권 명시  
- 유해/불법 프롬프트 필터링 및 신고 기능  
- 광고 표시: 명확한 광고 표시  

---

## 사이트맵 및 네비게이션 구조

[홈]
  %% Prompt 리스트 (/pot)
  %    %% 카테고리 검색
  %    %% 인기순, 최신순 정렬
  %% Create (/create)
  %    %% 프롬프트 작성 및 업로드
  %% 마이페이지 (/mypage)
  %    %% 내 프롬프트 / 북마크 관리
  %% 관리자 페이지 (/admin)
       %% 대시보드 (통계 및 현황)
       %% 사용자 관리 (정지/경고)
       %% 프롬프트 관리 (수정/삭제)
       %% 신고 관리 (처리/상태 변경)
       %% 백업 관리 (생성/복원/다운로드)
       %% API 모니터링 (로그 조회)
       %% 시스템 설정
       %% 공지사항 관리
```

---

## 개발 진행 상황 (v1.2)

### 🚀 개발 환경 설정
**[SETUP.md](./SETUP.md) 파일을 참고하여 개발 환경을 설정하세요.**

#### 로컬 개발 서버 실행

```bash
# 개발 서버 시작 (포트 3000)
npm run dev

# 브라우저에서 접속
http://localhost:3000
```

### 완료된 기능
- ✅ Next.js + TypeScript 프로젝트 셋업
- ✅ 메인 페이지 UI 구현
- ✅ 프롬프트 목록 컴포넌트 (이미지 중심 컴팩트 디자인)
- ✅ 카테고리 필터링 및 정렬 기능
- ✅ 실시간 검색 기능
- ✅ 북마크 기능 (이미지 미리보기 포함)
- ✅ 프롬프트 상세 페이지
- ✅ 로그인 보호 기능 (블러 처리)
- ✅ Supabase 백엔드 완전 통합 (v2.0)
- ✅ Supabase Auth 마이그레이션 완료
- ✅ Prisma 제거 및 Supabase 직접 쿼리 전환
- ✅ RLS (Row Level Security) 활성화
- ✅ 환경변수 최적화 및 보안 강화
- ✅ 조회수 및 좋아요 기능 구현
- ✅ 고급 정렬 옵션 (최신순, 좋아요순, 조회수순, 북마크순)
- ✅ AI 모델별 필터링 기능
- ✅ 실시간 인기 프롬프트 롤링 UI (v2.0)
- ✅ 작성자 프로필 페이지 및 작성자별 프롬프트 보기
- ✅ 이미지 워터마크 자동 추가 기능
- ✅ 텍스트/이미지 결과 타입 구분 기능
- ✅ 댓글 시스템 구현
- ✅ 신고 기능 구현
- ✅ 관리자 대시보드 (v2.0)
- ✅ 사용자 관리 시스템 (v2.0)
- ✅ 프롬프트 관리 기능 (v2.0)
- ✅ 신고 관리 시스템 (v2.0)
- ✅ 백업 관리 시스템 (v2.0)
- ✅ API 모니터링 시스템 (v2.0)
- ✅ 프롬프트 생성 페이지 UI/UX 개선 (v2.0)
- ✅ 로그인/회원가입 페이지 UX 개선 (v2.0)
- ✅ 프로필 이미지 처리 개선 (v2.0)

### 진행 중
- 🔄 OAuth 로그인 연동 (Google, Kakao)
- 🔄 공지사항 관리 시스템

### 예정 기능
- 📋 프롬프트 버전 관리 시스템
- 📋 사용자 팔로우 기능
- 📋 프롬프트 평점 시스템
- 📋 프롬프트 공유 통계 및 분석

---

## 🚨 Admin 기능 마이그레이션 필수

### 에러 해결 방법
Admin 페이지에서 500 에러 발생 시 다음 마이그레이션을 실행하세요:

1. **Supabase SQL Editor에서 실행**
   ```sql
   -- 1. admin_notifications 테이블 (관리자 알림)
   supabase/migrations/013_admin_notifications_table.sql
   
   -- 2. inquiries 테이블 (문의사항)
   supabase/migrations/014_inquiries_table.sql
   ```

2. **확인 쿼리**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('admin_notifications', 'inquiries');
   ```

3. **문제 지속 시**
   - `/api/admin/check-schema` 호출하여 누락 테이블 확인
   - 브라우저 콘솔 및 Network 탭 확인

---

## 주요 업데이트 내역

### v2.0 (2024.09.16)

#### 관리자 기능 (개발담당자 1)
- **관리자 대시보드 구현**
  - 시스템 전체 통계 및 현황 대시보드
  - 사용자, 프롬프트, 댓글, 신고 통계 실시간 확인
  - 최근 활동 로그 표시
  
- **사용자 관리 시스템**
  - 사용자 검색 및 상태 관리 (정상/정지/경고)
  - 사용자별 프로필 상세 정보 조회
  - 계정 상태 변경 기능 (정지/경고 처리)
  - 관리자 권한 부여/철회 기능
  
- **프롬프트 관리 기능**
  - 모든 프롬프트 조회 및 검색
  - 관리자 전용 수정/삭제 권한
  - 프롬프트 상태 변경 (공개/비공개 처리)
  - 부적절한 콘텐츠 즉시 삭제
  
- **신고 관리 시스템**
  - 신고 내역 통합 관리
  - 신고 상태 변경 (대기/처리중/완료/거부)
  - 신고 카테고리별 필터링
  - 관리자 메모 기능
  
- **백업 관리 시스템**
  - 전체 백업 및 데이터 전용 백업 옵션
  - ZIP 파일 형식으로 백업 생성/다운로드
  - 병합 모드와 교체 모드 백업 복원
  - 백업 히스토리 관리
  
- **API 모니터링**
  - API 호출 로그 실시간 조회
  - 호출량 통계 및 분석
  - API 키 발급 및 관리
  - 사용량 제한 설정
  
- **시스템 설정**
  - 공지사항 관리 (작성/수정/삭제)
  - 시스템 설정 저장 기능
  - 관리자 활동 로그
  
- **보안 강화**
  - 관리자 전용 미들웨어 구현
  - API 로깅 시스템 개선 (localStorage 용량 관리)
  - 민감 정보 마스킹 처리

#### UI/UX 개선 (개발담당자 2)
- **프롬프트 생성 페이지 개선**
  - 결과 타입 선택 UI 라디오 버튼 스타일로 변경
  - 공개/비공개 설정 토글 UI 개선 (텍스트 동적 변경)
  - 중복 필드 제거 및 UI 순서 재구성
  - 텍스트 미리보기 레이블 "프롬프트 결과"로 변경
  
- **실시간 인기 프롬프트 기능**
  - 헤더에 실시간 인기 프롬프트 롤링 표시
  - 인기 점수 알고리즘 기반 TOP 10 표시
  - 확장 가능한 드롭다운 리스트
  - API 날짜 범위 수정 (7일 → 14일)
  
- **FAQ 페이지 개선**
  - 문의하기 버튼 브랜드 컬러(오렌지) 적용
  - 문의하기 폼 로그인 사용자 전용으로 제한
  - 비로그인 시 alert 메시지 후 로그인 페이지 이동
  
- **로그인/회원가입 페이지 개선**
  - 로딩 중 스피너 애니메이션 추가
  - "로그인 중..." / "회원가입 중..." 상태 표시
  - 버튼 비활성화로 중복 클릭 방지
  
- **프로필 이미지 처리 개선**
  - 이미지 로드 실패 시 PROMPOT 로고로 자동 대체
  - 모든 프로필 이미지 표시 영역에 일관된 처리 적용
  - Header, 마이페이지, AvatarUpload, ProfileImageModal 컴포넌트 수정
  
- **UI 일관성 개선**
  - 북마크와 신고하기 버튼 UI 스타일 통일
  - 드롭다운 메뉴 z-index 우선순위 수정
  - 반응형 디자인 개선
  
- **사용성 개선**
  - 버튼 hover 효과 및 transition 적용
  - 폼 필드 포커스 상태 시각적 피드백 강화
  - 에러 메시지 표시 개선

### v1.2 (2024.08.28)
- **Supabase 완전 통합**: Prisma 제거, Supabase 직접 쿼리 사용
- **Supabase Auth 마이그레이션**: JWT/bcrypt 제거, Supabase Auth 전환
- **데이터베이스 변경**: SQLite → PostgreSQL (Supabase)
- **보안 강화**: RLS 활성화, Service Role Key 사용
- **코드 최적화**: 불필요한 의존성 제거, 환경변수 정리
- **타입 안정성**: TypeScript 타입 점검 완료
- **API 안정화**: 모든 API 엔드포인트 검증 완료

### v1.1 (2024.08.14)
- **조회수 및 좋아요 기능**: 프롬프트별 조회수 추적, 좋아요 기능 구현
- **고급 정렬 옵션**: 최신순, 좋아요순, 조회수순, 북마크순 정렬
- **AI 모델 필터링**: AI 모델별 프롬프트 필터링 기능
- **작성자 프로필**: 작성자별 프롬프트 모아보기 및 통계 제공
- **이미지 워터마크**: 업로드 이미지에 자동 워터마크 추가
- **결과 타입 구분**: 이미지/텍스트 결과물 구분 표시
- **댓글 시스템**: 프롬프트별 댓글 기능 구현
- **신고 기능**: 부적절한 콘텐츠 신고 시스템

### v1.0 (2024.08.01)
- **초기 버전 출시**: 기본 프롬프트 공유 기능
- **Next.js + TypeScript** 기반 프론트엔드
- **카테고리 필터링** 및 검색 기능
- **북마크** 기능
- **반응형 디자인**
