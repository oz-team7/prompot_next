-- Add additional_images field to prompts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'prompts' 
                   AND column_name = 'additional_images') THEN
        ALTER TABLE prompts ADD COLUMN additional_images TEXT[] DEFAULT '{}';
        COMMENT ON COLUMN prompts.additional_images IS 'Array of additional image URLs for the prompt';
        RAISE NOTICE 'Added additional_images column to prompts';
    ELSE
        RAISE NOTICE 'additional_images column already exists in prompts';
    END IF;
END $$;
