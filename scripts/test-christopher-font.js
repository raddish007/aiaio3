import fetch from 'node-fetch';
import 'dotenv/config';

console.log('🎬 Testing Christopher Font Sizing with Improved Logic...\n');

async function testChristopherFont() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    console.log('🌐 Using base URL:', baseUrl);
    
    const response = await fetch(`${baseUrl}/api/videos/generate-name-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childName: 'Christopher',
        childId: 'test-child-christopher',
        childAge: 7,
        childTheme: 'halloween'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Christopher video generation started successfully!');
    console.log('📊 Debug Info:', JSON.stringify(result.debug, null, 2));
    console.log('🔗 Output URL:', result.outputUrl);
    console.log('📋 Job Tracking:', `/admin/jobs?job_id=${result.job_id}`);
    console.log('\n📏 Font sizing for "Christopher" (11 chars) should now use:');
    console.log('   - 65% width calculation');
    console.log('   - 1.2x multiplier (most aggressive)');
    console.log('   - 5% height-based minimum');
    console.log('\n⏰ Video should be ready in ~2-3 minutes');
    
  } catch (error) {
    console.error('❌ Error generating Christopher video:', error);
  }
}

await testChristopherFont();
