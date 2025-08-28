import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // 단순한 프롬프트 조회
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Prompts error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ 
      count: prompts?.length || 0,
      prompts 
    });
  } catch (error: any) {
    console.error('Simple prompts error:', error);
    res.status(500).json({ error: error.message });
  }
}