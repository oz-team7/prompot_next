# PRD: PROMPOT - 프롬프트 공유 플랫폼 (Updated v1.1)

## 문서 정보
- 제목: 프롬프트를 저장/정리/공유할 수 있는 무료 플랫폼 서비스  
- 버전 정보: v1.1  
- 작성일자: 2025.08.14  
- 작성자: PROMPOT Team (홍태웅, 이지윤, 김호천)  
- 상태: Draft (지속적인 업데이트)  

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

### Backend (Local Development - v1.1)
- Next.js API Routes
- Prisma ORM + SQLite
- JWT 인증 (bcryptjs + jsonwebtoken)
- Cookie 기반 세션 관리

### DB Schema 설계
**Production (MongoDB)**
- users, prompts, bookmarks, reviews, reports

**Local Development (SQLite)**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  prompts   Prompt[]
  likes     Like[]
  bookmarks Bookmark[]
}

model Prompt {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  content     String
  category    String
  tags        String   // JSON string array
  previewImage String?
  author      User     @relation(fields: [authorId], references: [id])
  likes       Like[]
  bookmarks   Bookmark[]
}

model Like {
  user      User     @relation(fields: [userId], references: [id])
  prompt    Prompt   @relation(fields: [promptId], references: [id])
  @@unique([userId, promptId])
}

model Bookmark {
  user      User     @relation(fields: [userId], references: [id])
  prompt    Prompt   @relation(fields: [promptId], references: [id])
  @@unique([userId, promptId])
}
```

---

## 법적 & 윤리 고려
- 저작권/지적재산권: 업로드된 프롬프트 소유권 명시  
- 유해/불법 프롬프트 필터링 및 신고 기능  
- 광고 표시: 명확한 광고 표시  

---

## 사이트맵 및 네비게이션 구조

```
[홈]
  %% Prompt 리스트 (/pot)
  %    %% 카테고리 검색
  %    %% 인기순, 최신순 정렬
  %% Create (/create)
  %    %% 프롬프트 작성 및 업로드
  %% 마이페이지 (/mypage)
  %    %% 내 프롬프트 / 북마크 관리
  %% 관리자 페이지 (/admin)
       %% 프롬프트 승인
       %% 신고 관리
```

---

## 개발 진행 상황 (v1.1)

### 완료된 기능
- ✅ Next.js + TypeScript 프로젝트 셋업
- ✅ 메인 페이지 UI 구현
- ✅ 프롬프트 목록 컴포넌트 (이미지 중심 컴팩트 디자인)
- ✅ 카테고리 필터링 및 정렬 기능
- ✅ 실시간 검색 기능
- ✅ 북마크 기능 (이미지 미리보기 포함)
- ✅ 프롬프트 상세 페이지
- ✅ 로그인 보호 기능 (블러 처리)
- ✅ 로컬 백엔드 환경 구성 (Prisma + SQLite)
- ✅ 사용자 인증 API (회원가입, 로그인, 로그아웃)

### 진행 중
- 🔄 프롬프트 CRUD API 구현
- 🔄 OAuth 로그인 연동

### 예정 기능
- 📋 프롬프트 업로드 기능
- 📋 댓글 및 평점 시스템
- 📋 프로덕션 백엔드 마이그레이션 (Express + MongoDB)
