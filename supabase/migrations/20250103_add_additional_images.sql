-- Add additional_images field to prompts table
ALTER TABLE prompts ADD COLUMN additional_images TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN prompts.additional_images IS 'Array of additional image URLs for the prompt';
