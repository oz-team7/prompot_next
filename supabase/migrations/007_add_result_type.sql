-- Add result_type column to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS result_type TEXT DEFAULT 'image' CHECK (result_type IN ('image', 'text'));

-- Add comment for documentation
COMMENT ON COLUMN prompts.result_type IS '프롬프트의 결과 타입: image (이미지/동영상) 또는 text (텍스트)';