import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, newEmail } = req.body;
    console.log('🔧 Update email request:', { userId, newEmail });

    if (!userId || !newEmail) {
      return res.status(400).json({ error: 'User ID and new email are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    console.log('🔧 Calling Supabase admin updateUserById...');
    // Update user email using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail
    });

    console.log('🔧 Supabase response:', { data: data?.user?.email, error });

    if (error) {
      console.error('❌ Email update error:', error);
      return res.status(500).json({ error: `Failed to update email: ${error.message}` });
    }

    // Also update the custom users table
    console.log('🔧 Updating custom users table...');
    const { error: usersTableError } = await supabaseAdmin
      .from('users')
      .update({ email: newEmail })
      .eq('id', userId);

    if (usersTableError) {
      console.error('⚠️ Failed to update users table (auth updated successfully):', usersTableError);
      // Don't fail the request since auth update succeeded
    } else {
      console.log('✅ Users table updated successfully');
    }

    // Double-check by fetching the user to confirm the update
    console.log('🔧 Double-checking user email...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(userId);
    console.log('🔧 Verification result:', { 
      userEmail: verifyData?.user?.email, 
      requestedEmail: newEmail,
      match: verifyData?.user?.email === newEmail,
      error: verifyError 
    });

    console.log('✅ Email update successful');
    res.status(200).json({ 
      message: 'Email updated successfully',
      oldEmail: data?.user?.email_change_sent_at ? 'Pending confirmation' : 'Updated',
      newEmail: verifyData?.user?.email || newEmail
    });
  } catch (error) {
    console.error('❌ API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
