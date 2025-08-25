import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 이 API는 현재 사용되지 않습니다.
  // 이메일 확인은 confirm-email 페이지에서 처리됩니다.
  res.status(200).json({
    success: true,
    message: '이 API는 사용되지 않습니다.'
  });
}
