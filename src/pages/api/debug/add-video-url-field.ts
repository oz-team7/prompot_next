import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const supabase = createSupabaseServiceClient()
    
    // video_url 필드가 이미 존재하는지 확인
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'prompts')
      .eq('column_name', 'video_url')

    if (checkError) {
      console.error('Column check error:', checkError)
      return res.status(500).json({ 
        ok: false, 
        error: 'COLUMN_CHECK_ERROR',
        message: '컬럼 확인 중 오류가 발생했습니다.' 
      })
    }

    if (columns && columns.length > 0) {
      return res.status(200).json({ 
        ok: true, 
        message: 'video_url 필드가 이미 존재합니다.',
        exists: true
      })
    }

    // video_url 필드 추가 시도
    const { data, error } = await supabase
      .rpc('exec', {
        sql: 'ALTER TABLE prompts ADD COLUMN video_url TEXT;'
      })

    if (error) {
      console.error('SQL execution error:', error)
      return res.status(500).json({ 
        ok: false, 
        error: 'SQL_EXECUTION_ERROR',
        message: error.message 
      })
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'video_url 필드가 성공적으로 추가되었습니다.',
      data 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ 
      ok: false, 
      error: 'INTERNAL_ERROR',
      message: '내부 서버 오류가 발생했습니다.' 
    })
  }
}
