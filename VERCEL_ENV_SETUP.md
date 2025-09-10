# Vercel 배포를 위한 환경 변수 설정 가이드

## 필요한 환경 변수들

### Supabase 설정
- NEXT_PUBLIC_SUPABASE_URL: Supabase 프로젝트 URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase 익명 키
- SUPABASE_SERVICE_ROLE_KEY: Supabase 서비스 역할 키 (서버 사이드용)

### 기타 설정
- NEXTAUTH_SECRET: NextAuth 시크릿 키 (사용하는 경우)
- NEXTAUTH_URL: NextAuth URL (사용하는 경우)

## Vercel에서 환경 변수 설정 방법

1. Vercel 대시보드에 로그인
2. 프로젝트 선택
3. Settings > Environment Variables 메뉴로 이동
4. 다음 환경 변수들을 추가:

### Production 환경
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Preview 환경 (선택사항)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Development 환경 (선택사항)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 주의사항

1. **NEXT_PUBLIC_** 접두사가 붙은 변수는 클라이언트 사이드에서 접근 가능합니다.
2. **SUPABASE_SERVICE_ROLE_KEY**는 서버 사이드에서만 사용되므로 NEXT_PUBLIC_ 접두사를 붙이지 마세요.
3. 환경 변수 설정 후 반드시 재배포해야 적용됩니다.
4. 민감한 정보는 절대 클라이언트 사이드에 노출되지 않도록 주의하세요.

## 로컬 개발용 .env.local 파일 예시

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 기타 설정
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 배포 후 확인사항

1. 환경 변수가 올바르게 설정되었는지 확인
2. Supabase 연결이 정상적으로 작동하는지 확인
3. API 엔드포인트들이 정상적으로 응답하는지 확인
4. 이미지 업로드 및 표시가 정상적으로 작동하는지 확인
