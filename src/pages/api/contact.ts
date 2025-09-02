import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 환경 변수 검증
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Required SMTP settings are missing:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      });
      throw new Error('SMTP configuration is incomplete');
    }

    const { from, subject, message, to } = req.body;
    
    // 요청 데이터 검증
    if (!from || !subject || !message || !to) {
      console.error('Missing required fields:', { from, subject, message, to });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Gmail 전용 설정으로 변경
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // Gmail 앱 비밀번호
      },
    });

    // 연결 테스트
    await transporter.verify().catch(error => {
      console.error('SMTP connection test failed:', error);
      throw new Error('Failed to connect to SMTP server');
    });

    // 이메일 발송
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // Gmail은 설정된 계정 이메일만 사용 가능
      to,
      replyTo: from,
      subject: `[PROMPOT 문의] ${subject}`,
      html: `
        <h2>PROMPOT 문의</h2>
        <p><strong>발신자:</strong> ${from}</p>
        <p><strong>내용:</strong></p>
        <div style="white-space: pre-wrap;">${message}</div>
      `,
    });

    console.log('메일 전송 성공:', info.messageId);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ 
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
