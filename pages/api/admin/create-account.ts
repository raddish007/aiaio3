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
    const { parentEmail, parentPassword, selectedRole, children, parentName } = req.body;

    if (!parentEmail || !parentPassword || !selectedRole || !parentName) {
      return res.status(400).json({ error: 'Parent email, password, role, and name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (parentPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate role
    const validRoles = ['parent', 'content_manager', 'asset_creator', 'video_ops'];
    if (!validRoles.includes(selectedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Trim and validate input strings
    const trimmedEmail = parentEmail.trim().toLowerCase();
    const trimmedName = parentName.trim();
    const trimmedPassword = parentPassword.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password: trimmedPassword,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle specific Supabase Auth errors
      if (authError.message.includes('pattern')) {
        return res.status(400).json({ error: 'Invalid email format or password pattern' });
      }
      
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      
      return res.status(500).json({ error: `Auth error: ${authError.message}` });
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create user record in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: trimmedEmail,
        name: trimmedName,
        role: selectedRole
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return res.status(500).json({ error: `User creation error: ${userError.message}` });
    }

    // Create child records
    const createdChildren = [];
    for (const child of children) {
      if (child.name.trim()) { // Only create children with names
        const { data: childData, error: childError } = await supabaseAdmin
          .from('children')
          .insert({
            name: child.name,
            primary_interest: child.theme,
            parent_id: authData.user.id,
            age: child.age || 5,
            metadata: {
              additional_themes: child.additionalThemes || '',
              icon: child.icon || ''
            }
          })
          .select()
          .single();

        if (childError) {
          console.error('Child creation error:', childError);
          return res.status(500).json({ error: `Child creation error: ${childError.message}` });
        }

        createdChildren.push(child.name);
      }
    }

    const childCount = createdChildren.length;
    res.status(200).json({ 
      message: 'Account created successfully',
      parentEmail,
      parentPassword,
      childCount,
      createdChildren
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 