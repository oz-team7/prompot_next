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

## 🚨 문제 해결

### 일반적인 오류들

1. **"Invalid API key"**: 환경 변수가 제대로 설정되지 않음
2. **"Email not confirmed"**: 이메일 인증이 필요함
3. **"Invalid login credentials"**: 이메일 또는 비밀번호가 잘못됨
4. **"new row violates row-level security policy"**: RLS 정책 문제

### 해결 방법

1. 환경 변수 재설정
2. 개발 서버 재시작
3. 브라우저 캐시 삭제
4. Supabase 대시보드에서 설정 확인

### RLS 정책 문제 해결

**문제**: 회원가입 후 프로필 생성 실패로 로그인이 안 되는 경우

**해결 단계**:
1. Supabase 대시보드 → SQL 편집기
2. 다음 SQL 실행:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- 새로운 정책 생성
CREATE POLICY "Users can create profiles during signup"
ON profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);
```

3. 정책 적용 후 회원가입 재시도

### 프로필 수동 생성 (임시 해결책)

**현재 프로필이 없는 사용자들을 위한 임시 해결책**:

1. Supabase 대시보드 → Table Editor → profiles
2. "Insert Row" 클릭
3. 다음 정보 입력:
   - `id`: Supabase Auth에서 생성된 사용자 ID (로그에서 확인)
   - `name`: 사용자 이름
   - `email`: 사용자 이메일
   - `created_at`: 현재 시간
   - `updated_at`: 현재 시간

4. "Save" 클릭
5. 로그인 시도

**로그에서 사용자 ID 확인 방법**:
- 개발 서버 콘솔에서 "사용자 생성 성공: [ID]" 메시지 확인
- 또는 Supabase 대시보드 → Authentication → Users에서 확인
