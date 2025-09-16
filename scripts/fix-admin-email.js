const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixAdminEmail() {
  try {
    console.log('Fixing admin email...');
    
    // Update the email in profiles table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ email: 'prompot7@gmail.com' })
      .eq('id', '7b03565d-b472-477c-9321-75bb442ae60e')
      .select()
      .single();
    
    if (updateError) {
      console.error('Failed to update profile email:', updateError);
      return;
    }
    
    console.log('✅ Profile email updated:', updatedProfile);
    
    // Now run the admin setup
    await setupAdmin();
    
  } catch (error) {
    console.error('Fix email error:', error);
  }
}

async function setupAdmin() {
  try {
    console.log('\nSetting up admin permissions...');
    
    // Check if admin_users table exists by trying to query it
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', '7b03565d-b472-477c-9321-75bb442ae60e')
      .single();
    
    if (adminCheckError && adminCheckError.code === '42P01') {
      console.log('admin_users table does not exist. Please run the migration first.');
      return;
    }
    
    if (adminCheck) {
      console.log('User is already an admin');
      return;
    }
    
    // Add user to admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: '7b03565d-b472-477c-9321-75bb442ae60e',
        role: 'super_admin',
        permissions: {
          full_access: true,
          manage_admins: true
        }
      })
      .select()
      .single();
    
    if (adminError) {
      console.error('Failed to create admin user:', adminError);
      return;
    }
    
    console.log('✅ Successfully created admin user');
    console.log('Admin ID:', adminUser.id);
    console.log('Role:', adminUser.role);
    console.log('Permissions:', adminUser.permissions);
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

fixAdminEmail();