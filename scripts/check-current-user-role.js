const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentUserRole() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    console.log('Current user:', {
      id: user.id,
      email: user.email
    });
    
    // Get user role from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role, created_at')
      .eq('id', user.id)
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      return;
    }
    
    if (!userData) {
      console.log('User not found in users table');
      return;
    }
    
    console.log('User data from database:', userData);
    
    // Check if role is in allowed list
    const allowedRoles = ['content_manager', 'asset_creator', 'video_ops', 'content-manager'];
    const hasAccess = allowedRoles.includes(userData.role);
    
    console.log('Role check:', {
      role: userData.role,
      allowedRoles: allowedRoles,
      hasAccess: hasAccess
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCurrentUserRole(); 