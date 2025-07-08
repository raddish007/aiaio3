const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Applying RLS Policy Fixes...\n');

// Read the SQL file
const sqlPath = path.join(__dirname, 'fix-rls-policies.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('📋 SQL to apply:');
console.log('='.repeat(50));
console.log(sqlContent);
console.log('='.repeat(50));

console.log('\n📋 Instructions:');
console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/etshvxrgbssginmzsczo');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to apply the policies');
console.log('5. Test the signup flow again');

console.log('\n🎯 What this fixes:');
console.log('✅ User signup will work properly');
console.log('✅ Child profile creation will work');
console.log('✅ Proper security policies for all tables');
console.log('✅ Automatic user record creation via trigger');

console.log('\n🚀 After applying the SQL:');
console.log('- Try the signup flow again');
console.log('- User should be created immediately on first step');
console.log('- Child profile should be created on second step');
console.log('- User should be redirected to dashboard');

console.log('\n📞 If you still have issues:');
console.log('- Check the browser console for errors');
console.log('- Check Supabase logs in the dashboard');
console.log('- Verify the trigger was created successfully'); 