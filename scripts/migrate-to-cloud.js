const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase Cloud Migration Script\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found. Please create it first.');
  process.exit(1);
}

// Read current environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const isLocalSupabase = envContent.includes('localhost:54321') || envContent.includes('127.0.0.1:54321');

if (!isLocalSupabase) {
  console.log('✅ Already using cloud Supabase configuration');
  process.exit(0);
}

console.log('📋 Migration Steps:\n');

// Step 1: Check Supabase CLI login
console.log('1️⃣ Checking Supabase CLI login...');
try {
  execSync('supabase projects list', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is logged in');
} catch (error) {
  console.log('❌ Please run: supabase login');
  console.log('   Then run this script again.');
  process.exit(1);
}

// Step 2: Check if project is already linked
console.log('\n2️⃣ Checking project link status...');
try {
  const status = execSync('supabase status', { stdio: 'pipe', encoding: 'utf8' });
  if (status.includes('Project reference')) {
    console.log('✅ Project is already linked to cloud');
  } else {
    console.log('⚠️ Project not linked to cloud');
    console.log('   Run: supabase link --project-ref YOUR_PROJECT_REF');
  }
} catch (error) {
  console.log('⚠️ Could not determine link status');
}

// Step 3: Backup local data
console.log('\n3️⃣ Creating local backup...');
try {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', timestamp);
  
  if (!fs.existsSync(path.dirname(backupDir))) {
    fs.mkdirSync(path.dirname(backupDir), { recursive: true });
  }
  
  // Export schema
  execSync(`supabase db dump --schema-only > ${backupDir}/schema.sql`, { stdio: 'pipe' });
  console.log('✅ Schema backup created');
  
  // Export data
  execSync(`supabase db dump --data-only > ${backupDir}/data.sql`, { stdio: 'pipe' });
  console.log('✅ Data backup created');
  
  console.log(`📁 Backup saved to: ${backupDir}`);
} catch (error) {
  console.log('⚠️ Could not create backup:', error.message);
}

// Step 4: Check migrations
console.log('\n4️⃣ Checking migrations...');
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  console.log(`✅ Found ${migrations.length} migrations`);
  migrations.forEach(migration => {
    console.log(`   - ${migration}`);
  });
} else {
  console.log('⚠️ No migrations directory found');
}

// Step 5: Generate environment template
console.log('\n5️⃣ Generating cloud environment template...');
const cloudEnvTemplate = `# Supabase Cloud Configuration
# Replace these with your actual cloud project values
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_cloud_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_cloud_service_role_key_here

# AWS Configuration (keep existing values)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_S3_VIDEO_BUCKET=aiaio-videos
AWS_S3_ASSET_BUCKET=aiaio-assets
AWS_LAMBDA_REMOTION_FUNCTION=aiaio-remotion-render

# AI Services (keep existing values)
OPENAI_API_KEY=your_openai_api_key_here
FAL_AI_API_KEY=your_fal_ai_api_key_here

# ElevenLabs (for voiceover)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Email Configuration (AWS SES)
AWS_SES_FROM_EMAIL=noreply@aiaio.com
AWS_SES_REGION=us-east-1

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
`;

const cloudEnvPath = path.join(__dirname, '..', '.env.cloud.template');
fs.writeFileSync(cloudEnvPath, cloudEnvTemplate);
console.log(`✅ Cloud environment template created: ${cloudEnvPath}`);

// Step 6: Instructions
console.log('\n📋 Next Steps:\n');

console.log('1. Create a Supabase cloud project:');
console.log('   - Go to https://supabase.com/dashboard');
console.log('   - Click "New Project"');
console.log('   - Choose your organization');
console.log('   - Name: aiaio-platform');
console.log('   - Set database password');
console.log('   - Wait for project to be ready');

console.log('\n2. Get your project credentials:');
console.log('   - Go to Settings → API');
console.log('   - Copy Project URL and API keys');

console.log('\n3. Link your local project:');
console.log('   supabase link --project-ref YOUR_PROJECT_REF');

console.log('\n4. Push your schema to cloud:');
console.log('   supabase db push');

console.log('\n5. Update your .env.local:');
console.log('   - Copy values from .env.cloud.template');
console.log('   - Replace with your actual cloud credentials');

console.log('\n6. Configure storage buckets:');
console.log('   - Go to Storage → Buckets');
console.log('   - Create: assets, videos, temp');
console.log('   - Set appropriate policies');

console.log('\n7. Test the migration:');
console.log('   npm run db:generate');
console.log('   node scripts/test-asset-generation.js');

console.log('\n🎉 Migration complete!');
console.log('\n📚 See MIGRATION_GUIDE.md for detailed instructions.'); 