# Prompot 배포 가이드

## 1. 이미지 업로드 에러 해결 방법

### Sharp 라이브러리 문제
Vercel에서 sharp 라이브러리 사용 시 발생하는 문제를 해결하기 위해 이미 코드를 수정했습니다:
- 동적 import로 변경
- 에러 발생 시 워터마크 없이 원본 이미지 업로드

### Vercel 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수가 설정되어 있는지 확인하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. 데이터베이스 테이블 생성

### 누락된 테이블
다음 테이블들이 누락되어 있어 API 에러가 발생하고 있습니다:
- admin_notifications
- inquiries (email, priority 컬럼 추가 필요)
- system_settings
- admin_activity_logs
- announcements

### 해결 방법

1. Supabase 대시보드에 로그인
2. SQL Editor로 이동
3. `create_missing_tables.sql` 파일의 내용을 실행

또는 개별 마이그레이션 파일을 순서대로 실행:
- `supabase/migrations/013_admin_notifications_table.sql`
- `supabase/migrations/014_inquiries_table.sql`

## 3. Vercel 빌드 설정

### package.json 스크립트 확인
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### Vercel 설정
- Framework Preset: Next.js
- Build Command: `npm run build` 또는 `yarn build`
- Output Directory: `.next`

## 4. 문제 해결

### 500 에러가 계속 발생하는 경우
1. Vercel 함수 로그 확인
2. Supabase 대시보드에서 테이블 생성 여부 확인
3. RLS 정책이 올바르게 설정되었는지 확인

### Sharp 관련 에러
만약 sharp 에러가 계속 발생한다면:
1. `vercel.json` 파일 생성:
```json
{
  "functions": {
    "src/pages/api/upload-image.ts": {
      "maxDuration": 30
    }
  }
}
```

2. 또는 sharp 대신 jimp 라이브러리 사용 고려

## 5. 추가 권장사항

### 환경 변수 체크
API 라우트에서 환경 변수 확인 로직 추가:
```typescript
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Service role key missing');
  return res.status(500).json({ error: 'Server configuration error' });
}
```

### 에러 로깅 개선
상세한 에러 로그를 위해 Vercel의 로깅 서비스나 Sentry 같은 에러 추적 도구 사용을 권장합니다.