require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@aiaio.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authData.user.id);

    // Create user profile with admin role
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: 'Admin User',
        email: 'admin@aiaio.com',
        role: 'content_manager', // Can be 'content_manager', 'asset_creator', or 'video_ops'
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email: admin@aiaio.com');
    console.log('Password: admin123456');
    console.log('Role: content_manager');
    console.log('User ID:', authData.user.id);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
createAdminUser(); 