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
    console.log('=== 이메일 전송 시작 ===');
    console.log('요청 본문:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    
    // 1. 환경 변수 검증
    const envCheck = {
      SMTP_USER_EXISTS: !!process.env.SMTP_USER,
      SMTP_PASSWORD_EXISTS: !!process.env.SMTP_PASSWORD,
      SMTP_USER_LENGTH: process.env.SMTP_USER?.length,
      SMTP_PASSWORD_LENGTH: process.env.SMTP_PASSWORD?.length,
    };
    console.log('1. 환경 변수 확인:', envCheck);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      const error = new Error('SMTP 설정이 누락되었습니다');
      console.error('환경 변수 누락:', {
        error: error.message,
        envCheck
      });
      return res.status(500).json({ 
        message: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.',
        error: 'SMTP_CONFIG_MISSING'
      });
    }

    const { from, subject, message, to } = req.body;
    
    // 요청 데이터 검증
    const missingFields = [];
    if (!from) missingFields.push('from');
    if (!subject) missingFields.push('subject');
    if (!message) missingFields.push('message');
    if (!to) missingFields.push('to');
    
    if (missingFields.length > 0) {
      console.error('필수 필드 누락:', { 
        missingFields,
        received: { from, subject, message: message?.length, to }
      });
      return res.status(400).json({ 
        message: '필수 입력 항목이 누락되었습니다',
        missingFields,
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 2. Gmail 전용 설정
    console.log('2. Gmail 설정 생성');
    const transportConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };
    console.log('Transport 설정:', {
      service: transportConfig.service,
      user: transportConfig.auth.user,
      passLength: transportConfig.auth.pass?.length
    });

    const transporter = nodemailer.createTransport(transportConfig);

    // 3. 연결 테스트
    console.log('3. SMTP 연결 테스트 시작');
    try {
      await transporter.verify();
      console.log('SMTP 연결 테스트 성공');
    } catch (verifyError: unknown) {
      console.error('SMTP 연결 테스트 실패:', {
        name: verifyError instanceof Error ? verifyError.name : 'Unknown',
        message: verifyError instanceof Error ? verifyError.message : String(verifyError),
        code: (verifyError as any)?.code,
        command: (verifyError as any)?.command
      });
      throw verifyError;
    }

        // 4. 이메일 발송
    console.log('4. 이메일 발송 시작');
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      replyTo: from,
      subject: `[PROMPOT 문의] ${subject}`,
      html: `
        <h2>PROMPOT 문의</h2>
        <p><strong>발신자:</strong> ${from}</p>
        <p><strong>내용:</strong></p>
        <div style="white-space: pre-wrap;">${message}</div>
      `,
    };
    console.log('메일 옵션:', {
      from: mailOptions.from,
      to: mailOptions.to,
      replyTo: mailOptions.replyTo,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('5. 메일 전송 완료:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('=== 이메일 전송 실패 ===');
    
    let errorCode = 'UNKNOWN_ERROR';
    let userMessage = '이메일 전송에 실패했습니다';
    
    if (error instanceof Error) {
      console.error('에러 세부정보:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      // 일반적인 SMTP 에러 분류
      if (error.message.includes('ECONNREFUSED')) {
        errorCode = 'SMTP_CONNECTION_REFUSED';
        userMessage = 'SMTP 서버에 연결할 수 없습니다';
      } else if (error.message.includes('Invalid login')) {
        errorCode = 'SMTP_AUTH_FAILED';
        userMessage = 'SMTP 인증에 실패했습니다';
      } else if (error.message.includes('spammer') || error.message.includes('blocked')) {
        errorCode = 'SMTP_BLOCKED';
        userMessage = '스팸으로 차단되었습니다';
      }
    } else {
      console.error('알 수 없는 에러:', error);
    }
    
    return res.status(500).json({ 
      message: userMessage,
      error: errorCode,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}
