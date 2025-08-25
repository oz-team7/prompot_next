# Vercel 배포 가이드

## 🚀 Vercel 배포 단계

### 1. Vercel CLI 설치 및 로그인
```bash
npm i -g vercel
vercel login
```

### 2. 프로젝트 배포
```bash
vercel
```

### 3. 환경 변수 설정 (중요!)

Vercel 대시보드에서 다음 환경 변수들을 **반드시** 설정해야 합니다:

#### Supabase 설정
- `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your_supabase_anon_key`
- `SUPABASE_SERVICE_ROLE_KEY`: `your_supabase_service_role_key`

#### 사이트 설정
- `NEXT_PUBLIC_SITE_URL`: `https://your-project.vercel.app`

### 4. 환경 변수 설정 방법

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 각 변수 추가:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Environment**: Production, Preview, Development **모두 선택**
   - **Add** 클릭

5. 나머지 변수들도 동일하게 추가

### 5. 자동 배포 설정

GitHub 연동 시:
- `main` 브랜치에 푸시하면 자동으로 Production 배포
- Pull Request 생성 시 Preview 배포

### 6. 문제 해결

#### 빌드 오류
```bash
# 로컬에서 빌드 테스트
npm run build

# TypeScript 타입 체크
npm run type-check
```

#### 환경 변수 문제
- Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에서 접근 가능
- **Production 환경에만 설정하면 안됨** - Preview, Development도 설정 필요

#### Supabase 연결 문제
- Supabase 프로젝트의 RLS 정책 확인
- CORS 설정 확인
- API 키 권한 확인

### 7. 성능 최적화

- Next.js Image 컴포넌트 사용
- 코드 스플리팅 활용
- 정적 자산 최적화

### 8. 모니터링

- Vercel Analytics 활성화
- 성능 메트릭 모니터링
- 에러 로그 확인

## ⚠️ 주의사항

1. **환경 변수는 반드시 모든 환경(Production, Preview, Development)에 설정**
2. **Supabase 프로젝트가 활성화되어 있어야 함**
3. **RLS 정책이 올바르게 설정되어 있어야 함**
4. **첫 배포 후 환경 변수 설정이 완료될 때까지 기다려야 함**

## 🔧 현재 프로젝트 상태

✅ **빌드 성공**: `npm run build` 통과  
✅ **TypeScript 타입 체크**: 통과  
✅ **Vercel 설정 파일**: `vercel.json` 생성  
✅ **Next.js 최적화**: Vercel 배포 최적화 완료  

## 📱 배포 후 확인사항

1. **홈페이지 접속**: 기본 기능 확인
2. **회원가입/로그인**: Supabase 연동 확인
3. **프롬프트 생성**: 데이터베이스 연동 확인
4. **북마크 기능**: 상태 동기화 확인
