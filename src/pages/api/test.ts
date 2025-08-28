import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Test API called');
  res.status(200).json({ message: 'API is working', time: new Date().toISOString() });
}