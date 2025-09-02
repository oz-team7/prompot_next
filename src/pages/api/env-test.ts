import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== ENV TEST API ===')
  
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    }
    
    console.log('Environment variables:', envVars)
    
    return res.status(200).json({
      ok: true,
      message: 'Environment check successful',
      env: envVars,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Env test error:', error)
    return res.status(500).json({
      ok: false,
      error: 'ENV_TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
