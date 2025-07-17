const testS3BrowserAPI = async () => {
  try {
    console.log('🔍 Testing S3 Browser API...');
    
    const response = await fetch('http://localhost:3000/api/s3/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data.error);
      return;
    }

    console.log('✅ API Success!');
    console.log('📊 Response summary:');
    console.log(`  - Source: ${data.source}`);
    console.log(`  - Message: ${data.message}`);
    console.log(`  - Total objects: ${data.objects.length}`);
    console.log(`  - Folders: ${data.folders.length}`);

    // Group objects by source
    const bySource = {};
    data.objects.forEach(obj => {
      const source = obj.source || 'unknown';
      if (!bySource[source]) {
        bySource[source] = [];
      }
      bySource[source].push(obj);
    });

    console.log('\n📁 Objects by source:');
    Object.entries(bySource).forEach(([source, objects]) => {
      console.log(`  - ${source}: ${objects.length} objects`);
      
      // Show first few objects from each source
      objects.slice(0, 3).forEach(obj => {
        console.log(`    • ${obj.title || 'Untitled'} (${obj.type || 'unknown type'})`);
      });
      
      if (objects.length > 3) {
        console.log(`    ... and ${objects.length - 3} more`);
      }
    });

    // Show some sample objects
    console.log('\n🔍 Sample objects:');
    data.objects.slice(0, 5).forEach((obj, index) => {
      console.log(`  ${index + 1}. ${obj.title || 'Untitled'}`);
      console.log(`     Key: ${obj.key}`);
      console.log(`     Type: ${obj.type || 'unknown'}`);
      console.log(`     Source: ${obj.source || 'unknown'}`);
      console.log(`     URL: ${obj.url ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Test the API
testS3BrowserAPI(); 