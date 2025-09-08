# 🚀 Vercel 배포 가이드

프롬팟(Prompot) Next.js 애플리케이션을 Vercel에 배포하기 위한 완전한 가이드입니다.

## 📋 배포 전 체크리스트

### ✅ 완료된 설정

- [x] **Next.js 설정 최적화** (`next.config.js`)
  - 이미지 도메인 설정 (`tlytjitkokavfhwzedml.supabase.co`)
  - API 라우트 최적화 (10MB 파일 업로드 지원)
  - CSS 최적화 활성화

- [x] **Vercel 설정 파일** (`vercel.json`)
  - 한국 리전 설정 (`icn1`)
  - API 함수 타임아웃 설정 (30초)
  - 환경 변수 템플릿 설정

- [x] **프로필 사진 업로드 최적화**
  - 로컬 파일 시스템 의존성 제거
  - Supabase Storage 전용 사용
  - 버셀 서버리스 환경 호환

- [x] **댓글 프로필 사진 기능**
  - 댓글 작성자 프로필 사진 표시
  - 프로필 사진이 없는 경우 프롬팟 로고 표시
  - 프롬프트 작성자와 동일한 크기 (24x24px)

## 🔧 Vercel 배포 단계

### 1. Vercel 프로젝트 생성

```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 프로젝트 배포
vercel --prod
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://tlytjitkokavfhwzedml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here

# 사이트 URL 설정
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_PRODUCTION_URL=https://your-domain.vercel.app
```

### 3. Supabase Storage 설정

Supabase 대시보드에서 다음 설정을 확인하세요:

1. **Storage 버킷 생성**
   - 버킷 이름: `avatars`
   - 공개 버킷으로 설정

2. **RLS 정책 설정**
   ```sql
   -- avatars 버킷에 대한 정책
   CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
   FOR SELECT USING (bucket_id = 'avatars');
   
   CREATE POLICY "Users can upload their own avatars" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## 🧪 배포 후 테스트

### 필수 테스트 항목

1. **기본 기능 테스트**
   - [ ] 홈페이지 로딩
   - [ ] 사용자 로그인/회원가입
   - [ ] 프롬프트 생성/수정/삭제
   - [ ] 댓글 작성/수정/삭제

2. **프로필 사진 기능 테스트**
   - [ ] 프로필 사진 업로드
   - [ ] 댓글에서 프로필 사진 표시
   - [ ] 프로필 사진이 없는 경우 프롬팟 로고 표시

3. **이미지 최적화 테스트**
   - [ ] 외부 이미지 로딩 (Supabase Storage)
   - [ ] 이미지 최적화 동작 확인

4. **API 라우트 테스트**
   - [ ] 모든 API 엔드포인트 정상 동작
   - [ ] 파일 업로드 기능 (10MB 이하)

## 🔍 문제 해결

### 일반적인 문제들

1. **이미지 로딩 실패**
   - `next.config.js`의 `domains` 설정 확인
   - Supabase Storage 공개 설정 확인

2. **API 타임아웃**
   - `vercel.json`의 `maxDuration` 설정 확인
   - 복잡한 쿼리 최적화

3. **환경 변수 오류**
   - Vercel 대시보드에서 환경 변수 재설정
   - 빌드 로그에서 오류 메시지 확인

## 📊 성능 최적화

### 이미지 최적화
- Next.js Image 컴포넌트 사용
- `unoptimized={true}` 설정으로 외부 이미지 지원
- 적절한 `sizes` 속성 설정

### API 최적화
- Supabase 클라이언트 재사용
- 적절한 인덱스 설정
- 페이지네이션 구현

## 🎯 배포 완료 후

배포가 완료되면 다음을 확인하세요:

1. **도메인 설정** (선택사항)
   - 커스텀 도메인 연결
   - SSL 인증서 자동 설정

2. **모니터링 설정**
   - Vercel Analytics 활성화
   - 에러 로그 모니터링

3. **백업 및 복구**
   - 데이터베이스 백업 설정
   - 환경 변수 백업

---

## 🎉 배포 완료!

모든 설정이 완료되면 프롬팟 애플리케이션이 Vercel에서 정상적으로 작동할 것입니다.

**주요 기능:**
- ✅ 댓글 작성자 프로필 사진 표시
- ✅ 프로필 사진이 없는 경우 프롬팟 로고 표시
- ✅ 모든 이미지 최적화 및 외부 도메인 지원
- ✅ Supabase Storage 기반 파일 업로드
- ✅ 한국 리전 최적화

배포 후 문제가 발생하면 Vercel 대시보드의 함수 로그를 확인하세요!
