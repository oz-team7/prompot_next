-- 썸네일 이미지 필드 추가
ALTER TABLE prompts ADD COLUMN thumbnail_image TEXT;

-- 기존 데이터에 대해 thumbnail_image를 preview_image로 초기화
UPDATE prompts SET thumbnail_image = preview_image WHERE preview_image IS NOT NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_prompts_thumbnail_image ON prompts(thumbnail_image) WHERE thumbnail_image IS NOT NULL;
