const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUserWithPassword() {
  try {
    console.log('=== Creating Test User with Password ===');

    const testEmail = 'erica@erica.com';
    const testPassword = 'testpassword123';

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.getUserByEmail(testEmail);
    
    if (checkError && checkError.message !== 'User not found') {
      console.error('Error checking existing user:', checkError);
      return;
    }

    if (existingUser.user) {
      console.log(`✅ User ${testEmail} already exists`);
      console.log('💡 You can try logging in with:');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
      
      // Try to update the password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.user.id,
        { password: testPassword }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        console.log('💡 You may need to reset the password manually');
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }

      console.log(`✅ Created user: ${testEmail}`);
      console.log('💡 Login credentials:');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);

      // Also create the user record in the users table
      const { error: userRecordError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: newUser.user.id,
          email: testEmail,
          name: 'Erica',
          role: 'parent'
        }, { onConflict: 'id' });

      if (userRecordError) {
        console.error('❌ Error creating user record:', userRecordError);
      } else {
        console.log('✅ Created user record in users table');
      }
    }

    console.log('\n=== Test User Setup Complete ===');
    console.log('You can now log in at http://localhost:3003/login');

  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestUserWithPassword(); 