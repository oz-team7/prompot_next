-- text_result와 result_type 컬럼 추가 마이그레이션
-- 2025-01-16 실행

-- 1) 현재 prompts 테이블 구조 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prompts'
ORDER BY ordinal_position;

-- 2) text_result 컬럼 추가 (텍스트 기반 프롬프트 결과 저장용)
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS text_result TEXT;

-- 3) result_type 컬럼 추가 (image 또는 text 구분용)
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS result_type VARCHAR(50) DEFAULT 'image';

-- 4) 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_prompts_result_type ON public.prompts(result_type);

-- 5) PostgREST 스키마 캐시 강제 리로드
NOTIFY pgrst, 'reload schema';

-- 6) 변경사항 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prompts'
  AND column_name IN ('text_result', 'result_type')
ORDER BY column_name;

-- 7) 마이그레이션 성공 메시지
SELECT 'text_result와 result_type 컬럼이 성공적으로 추가되었습니다.' as message;