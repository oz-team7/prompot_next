# 개발 환경 안정화 가이드

## 🚨 자주 발생하는 개발 오류 해결법

### 1. 서버 오류 (500): Internal Server Error

**증상**: `useBookmarks.ts`에서 "서버 오류 (500): Internal Server Error" 발생

**원인**: Next.js 빌드 캐시 손상 또는 서버 불안정

**해결 방법**:

#### 방법 1: 자동 해결 (권장)
```bash
npm run dev:clean
```

#### 방법 2: 수동 해결
```bash
# 1. 개발 서버 중지 (Ctrl+C)
# 2. 캐시 제거
rm -rf .next
# 3. 서버 재시작
npm run dev
```

#### 방법 3: 깊은 정리 (문제가 지속될 때)
```bash
npm run dev:deep
```

### 2. 개발 서버 상태 확인

```bash
npm run dev:check
```

이 명령어로 다음을 확인할 수 있습니다:
- 서버 실행 상태
- API 엔드포인트 응답
- 환경 변수 설정
- 캐시 상태

### 3. 예방 조치

#### 개발 시작 전 체크리스트
1. `npm run dev:check` 실행
2. 서버 상태 확인
3. 문제가 있다면 `npm run dev:clean` 실행

#### 개발 중 주의사항
- 서버가 불안정해 보이면 즉시 재시작
- 브라우저에서 500 오류가 반복되면 캐시 정리
- 새로운 의존성 설치 후에는 `npm run dev:deep` 실행

### 4. 오류 처리 개선사항

#### useBookmarks.ts 개선
- 개발 환경에서 HTML 응답 시 캐시된 데이터 사용
- 서버 헬스체크 강화
- 더 명확한 오류 메시지 제공

#### 자동 복구 기능
- 서버 오류 시 캐시된 북마크 데이터 사용
- 개발 환경에서 더 관대한 오류 처리
- 사용자 경험 개선

### 5. 추가 도구

#### 사용 가능한 스크립트
- `npm run dev` - 일반 개발 서버 시작
- `npm run dev:clean` - 캐시 정리 후 개발 서버 시작
- `npm run dev:deep` - 깊은 캐시 정리 후 개발 서버 시작
- `npm run dev:check` - 개발 서버 상태 확인

### 6. 문제 해결 로그

개발 환경에서 다음과 같은 로그를 확인할 수 있습니다:

```
[HEALTH] Server health check failed, using cached data
[DEBUG] Development mode: Using cached data due to server error
[DEBUG] Received HTML response instead of JSON (500): Internal Server Error
```

이러한 로그는 정상적인 동작이며, 시스템이 자동으로 복구를 시도하고 있음을 의미합니다.

---

**개발 환경 안정화**
