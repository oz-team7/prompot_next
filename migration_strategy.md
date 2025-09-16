# Supabase 마이그레이션 전략

## 현재 상황 분석

### 1. 문제점
- 로컬 마이그레이션 파일과 원격 DB 마이그레이션 히스토리가 일치하지 않음
- 중복된 타임스탬프로 인한 충돌 (20250103, 20250901 등)
- 필요한 테이블이 원격 DB에 생성되지 않음

### 2. 필요한 변경사항
- admin_notifications 테이블 생성
- inquiries 테이블에 email, priority 컬럼 추가

## 해결 전략

### 옵션 1: 마이그레이션 히스토리 복구
```bash
# 각 마이그레이션을 적용된 것으로 표시
npx supabase migration repair --status applied 20250103
npx supabase migration repair --status applied 20250901
npx supabase migration repair --status applied 20250902
npx supabase migration repair --status applied 20250916
```

### 옵션 2: 새로운 타임스탬프로 마이그레이션 생성
```bash
# 고유한 타임스탬프 사용
npx supabase migration new add_missing_tables
```

### 옵션 3: 직접 SQL 실행
1. 로컬 DB 시작
2. 로컬에서 마이그레이션 적용
3. 원격으로 푸시

## 권장 방법

1단계: 마이그레이션 파일 정리
- 중복된 타임스탬프 파일 이름 변경
- 불필요한 파일 제거

2단계: 새 마이그레이션 파일 생성
```bash
npx supabase migration new add_admin_notifications_and_inquiries_updates
```

3단계: 로컬 테스트
```bash
npx supabase db reset
```

4단계: 원격 적용
```bash
npx supabase db push
```