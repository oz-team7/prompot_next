import type { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const supabase = createSupabaseServiceClient()
    
    // additional_images 필드 추가를 위한 직접 쿼리
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'prompts')
      .eq('column_name', 'additional_images')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Column check error:', error)
      return res.status(500).json({ 
        ok: false, 
        error: 'COLUMN_CHECK_ERROR',
        message: error.message 
      })
    }

    // 필드가 이미 존재하는지 확인
    if (data) {
      return res.status(200).json({ 
        ok: true, 
        message: 'additional_images 필드가 이미 존재합니다.',
        exists: true
      })
    }

    // 필드가 없으면 추가 (이 방법은 작동하지 않을 수 있음)
    return res.status(400).json({ 
      ok: false, 
      error: 'MANUAL_MIGRATION_REQUIRED',
      message: '수동으로 데이터베이스에 additional_images 필드를 추가해야 합니다. Supabase 대시보드의 SQL Editor에서 다음 쿼리를 실행하세요: ALTER TABLE prompts ADD COLUMN additional_images TEXT[] DEFAULT \'{}\';'
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
      message: 'additional_images 필드가 성공적으로 추가되었습니다.',
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
