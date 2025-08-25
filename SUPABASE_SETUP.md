# Supabase 설정 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# JWT 시크릿 (기존 시스템용)
JWT_SECRET=your-jwt-secret-key
```

## 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 anon key 복사
3. SQL 편집기에서 `supabase-setup-new.sql` 실행

## 3. 데이터베이스 테이블 생성

`supabase-setup-new.sql` 파일의 내용을 Supabase SQL 편집기에서 실행하세요.

## 4. 인증 설정

1. Supabase 대시보드 → Authentication → Settings
2. Site URL: `http://localhost:3000` (개발용)
3. Redirect URLs: `http://localhost:3000/**`

## 5. 테스트 계정

회원가입 후 다음 계정으로 테스트:
- 이메일: test@example.com
- 비밀번호: password

## 6. 문제 해결

### 로그인 안됨
- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되었는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 데이터베이스 오류
- `supabase-setup-new.sql`이 올바르게 실행되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인
