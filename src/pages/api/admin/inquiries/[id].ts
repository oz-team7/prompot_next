import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 관리자 인증 확인
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', authData.user.id)
    .single();

  if (profile?.email !== 'prompot7@gmail.com') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: inquiry, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return res.status(200).json(inquiry);
    } catch (error) {
      console.error('Error fetching inquiry:', error);
      return res.status(500).json({ error: 'Failed to fetch inquiry' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { status, priority, response, assigned_to } = req.body;

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

      // 응답을 추가하는 경우
      if (response) {
        updateData.response = response;
        updateData.responded_at = new Date().toISOString();
      }

      const { data: updatedInquiry, error: updateError } = await supabase
        .from('inquiries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 응답이 있고 상태가 resolved인 경우 이메일 발송
      if (response && status === 'resolved') {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          });

          const mailOptions = {
            from: process.env.SMTP_USER,
            to: updatedInquiry.email,
            subject: `Re: [PROMPOT 문의] ${updatedInquiry.subject}`,
            html: `
              <h2>PROMPOT 문의 답변</h2>
              <hr />
              <p><strong>원본 문의:</strong></p>
              <div style="background-color: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <p style="margin: 0;">${updatedInquiry.message}</p>
              </div>
              <hr />
              <p><strong>답변:</strong></p>
              <div style="background-color: #e8f4f8; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <p style="margin: 0; white-space: pre-wrap;">${response}</p>
              </div>
              <hr />
              <p style="color: #666; font-size: 14px;">
                이 메일은 PROMPOT 고객지원팀에서 발송되었습니다.<br />
                추가 문의사항이 있으시면 언제든지 문의해주세요.
              </p>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log('Response email sent successfully');
        } catch (emailError) {
          console.error('Failed to send response email:', emailError);
          // 이메일 전송 실패해도 업데이트는 성공으로 처리
        }
      }

      return res.status(200).json(updatedInquiry);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      return res.status(500).json({ error: 'Failed to update inquiry' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      return res.status(500).json({ error: 'Failed to delete inquiry' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}