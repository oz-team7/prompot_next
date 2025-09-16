# Admin 기능 마이그레이션 가이드

## 문제 해결

### 현재 발생한 에러
- `/api/admin/notifications` 엔드포인트에서 500 에러 발생
- 원인: `admin_notifications` 및 `inquiries` 테이블이 데이터베이스에 존재하지 않음

### 해결 방법

#### 1. Supabase SQL Editor에서 마이그레이션 실행

다음 파일들의 SQL을 순서대로 실행하세요:

1. **admin_notifications 테이블 생성**
   - 파일: `supabase/migrations/013_admin_notifications_table.sql`
   - 관리자 알림 이메일 설정 테이블

2. **inquiries 테이블 생성**
   - 파일: `supabase/migrations/014_inquiries_table.sql`
   - 사용자 문의사항 테이블

#### 2. 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard/project/tlytjitkokavfhwzedml)에 접속
2. 좌측 메뉴에서 "SQL Editor" 클릭
3. "New Query" 버튼 클릭
4. 각 마이그레이션 파일의 내용을 복사하여 붙여넣기
5. "Run" 버튼 클릭하여 실행

#### 3. 실행 순서

```sql
-- 1. 먼저 013_admin_notifications_table.sql 실행
-- 2. 그 다음 014_inquiries_table.sql 실행
```

#### 4. 확인 방법

마이그레이션 실행 후 다음 쿼리로 테이블이 생성되었는지 확인:

```sql
-- 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_notifications', 'inquiries');

-- admin_notifications 테이블 확인
SELECT * FROM admin_notifications;

-- inquiries 테이블 확인
SELECT * FROM inquiries LIMIT 1;
```

## API 개선 사항

### 1. 에러 처리 개선
- 테이블이 없을 경우 명확한 에러 메시지 반환
- 상세한 로그 추가로 디버깅 용이

### 2. 무한 리렌더링 방지
- `useEffect` 의존성 배열에서 객체 참조 대신 원시값 사용
- `user` → `user?.id`, `user?.email`

### 3. 보안 강화
- Service Role Key 사용 확인
- 환경변수 체크 추가

## 추가 필요 테이블

만약 다른 admin 기능도 사용 중이라면 다음 테이블들도 확인 필요:
- `system_settings` - 시스템 설정
- `announcements` - 공지사항
- `backups` - 백업 관리
- `api_keys` - API 키 관리
- `api_monitor` - API 모니터링

## 문제 지속 시

1. **스키마 확인 API 호출**
   ```
   GET /api/admin/check-schema
   ```
   관리자로 로그인 후 이 API를 호출하여 어떤 테이블이 누락되었는지 확인

2. **브라우저 개발자 콘솔 확인**
   - Network 탭에서 실패한 요청의 Response 확인
   - Console 탭에서 에러 메시지 확인

3. **Vercel 로그 확인**
   프로덕션 환경이라면 Vercel Dashboard에서 Function 로그 확인

## 연락처
문제가 지속되면 다음 정보와 함께 문의:
- 브라우저 콘솔 에러 메시지
- Network 탭의 실패한 요청 Response
- 실행한 마이그레이션 목록