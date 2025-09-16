-- 1) prompts 테이블의 모든 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prompts'
ORDER BY ordinal_position;

-- 2) text_result 컬럼이 없으면 추가
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS text_result TEXT;

-- 3) result_type 컬럼도 확인하고 없으면 추가 (기본값: 'image')
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS result_type VARCHAR(50) DEFAULT 'image';

-- 4) PostgREST 스키마 캐시 강제 리로드
NOTIFY pgrst, 'reload schema';

-- 5) 추가된 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prompts'
  AND column_name IN ('text_result', 'result_type');