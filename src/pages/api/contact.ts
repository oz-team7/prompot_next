import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServiceClient();
    console.log('=== 이메일 전송 시작 ===');
    console.log('요청 본문:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    
    // 1. 환경 변수 검증 (임시 비활성화)
    /*
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
    */

    const { from, subject, message, to } = req.body;
    
    console.log('Received request body:', { from, subject, message: message?.length, to });
    
    // 요청 데이터 검증
    const missingFields = [];
    if (!from || from.trim() === '') missingFields.push('from');
    if (!subject || subject.trim() === '') missingFields.push('subject');
    if (!message || message.trim() === '') missingFields.push('message');
    if (!to || to.trim() === '') missingFields.push('to');
    
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

    // 2. Gmail 전용 설정 (임시 비활성화)
    /*
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
    */

    // 4. 데이터베이스에 문의 저장
    console.log('4. 데이터베이스에 문의 저장');
    try {
      // 인증 정보 확인 (선택적)
      let userId = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: authData } = await supabase.auth.getUser(token);
        userId = authData.user?.id || null;
      }

      console.log('문의 저장 데이터:', {
        email: from,
        subject,
        message: message ? message.substring(0, 100) + '...' : 'No message',
        user_id: userId,
        isAuthenticated: !!userId
      });

      // user_id가 null인 경우 기본 사용자 ID 사용 (비로그인 사용자용)
      const finalUserId = userId || '1a6f76d2-5417-4a0e-beb2-5e573de221f2';
      
      const { data: inquiry, error: dbError } = await supabase
        .from('inquiries')
        .insert({
          email: from,
          subject,
          message,
          user_id: finalUserId,
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB 저장 실패:', dbError);
        return res.status(500).json({ 
          message: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          error: 'DB_SAVE_FAILED'
        });
      } else {
        console.log('DB 저장 성공:', {
          id: inquiry.id,
          email: inquiry.email,
          user_id: inquiry.user_id,
          created_at: inquiry.created_at
        });
      }
    } catch (dbError) {
      console.error('DB 저장 중 오류:', dbError);
      return res.status(500).json({ 
        message: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        error: 'DB_SAVE_FAILED'
      });
    }

    // 5. 활성화된 관리자 이메일 목록 조회 (임시 비활성화)
    /*
    console.log('5. 관리자 알림 설정 조회');
    const { data: adminEmails } = await supabase
      .from('admin_notifications')
      .select('email')
      .eq('is_active', true)
      .eq('notification_types->new_inquiry', true);

    const notificationEmails = adminEmails?.map(item => item.email) || ['support@prompot.com'];
    console.log('알림 받을 이메일 목록:', notificationEmails);

    // 6. 관리자들에게 이메일 발송
    console.log('6. 이메일 발송 시작');
    
    // 관리자 알림 이메일
    if (notificationEmails.length > 0) {
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: notificationEmails.join(', '),
        replyTo: from,
        subject: `[PROMPOT 신규문의] ${subject}`,
        html: `
          <h2>새로운 문의가 접수되었습니다</h2>
          <hr />
          <p><strong>발신자:</strong> ${from}</p>
          <p><strong>제목:</strong> ${subject}</p>
          <p><strong>내용:</strong></p>
          <div style="white-space: pre-wrap; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</div>
          <hr />
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" 
               style="display: inline-block; padding: 10px 20px; background-color: #ff6b00; color: white; text-decoration: none; border-radius: 5px;">
              관리자 페이지에서 답변하기
            </a>
          </p>
        `,
      };
      
      try {
        const adminInfo = await transporter.sendMail(adminMailOptions);
        console.log('관리자 알림 전송 완료:', adminInfo.accepted);
      } catch (adminMailError) {
        console.error('관리자 알림 전송 실패:', adminMailError);
        // 관리자 알림 실패해도 계속 진행
      }
    }

    // 발신자에게 확인 이메일
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: from,
      subject: `[PROMPOT] 문의가 접수되었습니다`,
      html: `
        <h2>문의가 정상적으로 접수되었습니다</h2>
        <p>안녕하세요,</p>
        <p>PROMPOT에 문의해주셔서 감사합니다.</p>
        <p>빠른 시일 내에 답변드리도록 하겠습니다.</p>
        <hr />
        <p><strong>문의 내용:</strong></p>
        <p><strong>제목:</strong> ${subject}</p>
        <div style="white-space: pre-wrap; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</div>
        <hr />
        <p style="color: #666; font-size: 14px;">
          이 메일은 자동으로 발송된 메일입니다.<br />
          추가 문의사항이 있으시면 언제든지 문의해주세요.
        </p>
      `,
    };

    const userInfo = await transporter.sendMail(userMailOptions);
    console.log('7. 발신자 확인 메일 전송 완료:', userInfo.accepted);
    */

    // 이메일 전송 대신 DB 저장 성공 메시지 반환
    res.status(200).json({ 
      message: '문의가 성공적으로 접수되었습니다. 관리자가 확인 후 답변드리겠습니다.' 
    });
  } catch (error) {
    console.error('=== 문의 접수 실패 ===');
    
    let errorCode = 'UNKNOWN_ERROR';
    let userMessage = '문의 접수에 실패했습니다';
    
    if (error instanceof Error) {
      console.error('에러 세부정보:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      // 데이터베이스 관련 에러 분류
      if (error.message.includes('relation') || error.message.includes('table')) {
        errorCode = 'DB_TABLE_ERROR';
        userMessage = '데이터베이스 테이블 오류가 발생했습니다';
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        errorCode = 'DB_CONNECTION_ERROR';
        userMessage = '데이터베이스 연결 오류가 발생했습니다';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorCode = 'DB_PERMISSION_ERROR';
        userMessage = '데이터베이스 권한 오류가 발생했습니다';
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
