const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmin() {
  try {
    console.log('Setting up admin permissions...');
    
    // Find the user with email prompot7@gmail.com
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'prompot7@gmail.com')
      .single();
    
    if (profileError || !profile) {
      console.error('Could not find user with email prompot7@gmail.com');
      console.error('Error:', profileError);
      return;
    }
    
    console.log('Found user:', profile.id);
    
    // Check if user is already an admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', profile.id)
      .single();
    
    if (existingAdmin) {
      console.log('User is already an admin');
      return;
    }
    
    // Add user to admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: profile.id,
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
    
    // Insert default system settings if not exists
    const { error: settingsError } = await supabase
      .from('system_settings')
      .upsert({
        id: 1,
        maintenance_mode: false,
        registration_enabled: true,
        max_prompts_per_user: 100,
        max_file_size_mb: 10
      })
      .select();
    
    if (!settingsError) {
      console.log('✅ System settings initialized');
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupAdmin();