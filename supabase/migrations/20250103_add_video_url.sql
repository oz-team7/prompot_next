-- Add video_url field to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN prompts.video_url IS 'URL of video content related to the prompt';
