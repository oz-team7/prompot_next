import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 환경변수 체크
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ADMIN:notifications] Service role key missing');
    return res.status(500).json({ 
      error: 'Server configuration error',
      detail: 'Service role key not configured' 
    });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // 관리자 인증 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      console.error('[ADMIN:notifications] Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 관리자 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('[ADMIN:notifications] Profile fetch error:', profileError);
      return res.status(500).json({ error: 'Failed to verify admin status' });
    }

    if (profile?.email !== 'prompot7@gmail.com') {
      return res.status(403).json({ error: 'Forbidden' });
    }

  if (req.method === 'GET') {
    try {
      const { data: notifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[ADMIN:notifications] GET error:', error);
        // 테이블이 없을 경우 빈 배열 반환
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.log('[ADMIN:notifications] Table does not exist, returning empty array');
          return res.status(200).json([]);
        }
        throw error;
      }

      return res.status(200).json(notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { email, name, notification_types } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // 이메일 유효성 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // 테이블 존재 확인을 위한 쿼리
      const { error: tableCheckError } = await supabase
        .from('admin_notifications')
        .select('id')
        .limit(1);

      if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.code === 'PGRST116')) {
        console.error('[ADMIN:notifications] Table does not exist:', tableCheckError);
        return res.status(500).json({ 
          error: 'Database configuration error',
          detail: 'admin_notifications table not found. Please apply migrations.'
        });
      }

      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .insert({
          email,
          name: name || email,
          notification_types: notification_types || { new_inquiry: true, new_user: false, new_prompt: false }
        })
        .select()
        .single();

      if (error) {
        console.error('[ADMIN:notifications] POST error:', error);
        if (error.code === '23505') { // Unique constraint violation
          return res.status(400).json({ error: 'Email already exists' });
        }
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return res.status(500).json({ 
            error: 'Database configuration error',
            detail: 'Table not found. Please apply migrations.'
          });
        }
        throw error;
      }

      return res.status(201).json(notification);
    } catch (error: any) {
      console.error('[ADMIN:notifications] POST error:', error);
      return res.status(500).json({ 
        error: 'Failed to create notification',
        detail: error.message || 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, email, name, is_active, notification_types } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (notification_types !== undefined) updateData.notification_types = notification_types;

      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(notification);
    } catch (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ error: 'Failed to update notification' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      // 메인 관리자 이메일은 삭제 불가
      const { data: notification } = await supabase
        .from('admin_notifications')
        .select('email')
        .eq('id', id)
        .single();

      if (notification?.email === 'prompot7@gmail.com') {
        return res.status(400).json({ error: 'Cannot delete main admin email' });
      }

      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[ADMIN:notifications] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      detail: error.message || 'Unknown error'
    });
  }
}