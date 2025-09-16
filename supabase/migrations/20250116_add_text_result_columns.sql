-- Add text_result and result_type columns for text-based prompts
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS text_result TEXT,
  ADD COLUMN IF NOT EXISTS result_type VARCHAR(50) DEFAULT 'image';

-- Add index for result_type for performance
CREATE INDEX IF NOT EXISTS idx_prompts_result_type ON public.prompts(result_type);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';