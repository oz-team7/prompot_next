import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  console.log('=== DYNAMIC ROUTE TEST ===')
  console.log('ID from query:', id)
  console.log('Request URL:', req.url)
  console.log('Request method:', req.method)
  
  try {
    return res.status(200).json({
      ok: true,
      message: 'Dynamic route is working',
      id: id,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dynamic route error:', error)
    return res.status(500).json({
      ok: false,
      error: 'DYNAMIC_ROUTE_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
