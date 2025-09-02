import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== BASIC API TEST ===')
  console.log('Request URL:', req.url)
  console.log('Request method:', req.method)
  console.log('Query params:', req.query)
  
  try {
    return res.status(200).json({
      ok: true,
      message: 'Basic API is working',
      url: req.url,
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Basic API error:', error)
    return res.status(500).json({
      ok: false,
      error: 'BASIC_API_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
