import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[DEBUG] Testing table schema...')
    
    const supabase = createSupabaseServiceClient()
    
    // prompt_ratings 테이블 존재 확인
    const { data: ratingsTable, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select('*')
      .limit(1)
    
    console.log('[DEBUG] Ratings table check:', { ratingsTable, ratingsError })
    
    // prompts 테이블 확인
    const { data: promptsTable, error: promptsError } = await supabase
      .from('prompts')
      .select('id, title')
      .limit(1)
    
    console.log('[DEBUG] Prompts table check:', { promptsTable, promptsError })
    
    // profiles 테이블 확인
    const { data: profilesTable, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)
    
    console.log('[DEBUG] Profiles table check:', { profilesTable, profilesError })
    
    return res.status(200).json({
      ok: true,
      tables: {
        prompt_ratings: {
          exists: !ratingsError,
          error: ratingsError?.message,
          sample: ratingsTable
        },
        prompts: {
          exists: !promptsError,
          error: promptsError?.message,
          sample: promptsTable
        },
        profiles: {
          exists: !profilesError,
          error: profilesError?.message,
          sample: profilesTable
        }
      }
    })
    
  } catch (error) {
    console.error('[DEBUG] Schema test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'SCHEMA_TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
