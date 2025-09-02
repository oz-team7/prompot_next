import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== SIMPLE TEST API ===')
  console.log('Request URL:', req.url)
  console.log('Request method:', req.method)
  console.log('Headers:', req.headers)
  console.log('Query:', req.query)
  
  try {
    return res.status(200).json({
      ok: true,
      message: 'Simple test successful',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    })
  } catch (error) {
    console.error('Simple test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'SIMPLE_TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
