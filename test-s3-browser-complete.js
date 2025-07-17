const testS3BrowserComplete = async () => {
  try {
    console.log('🔍 Testing S3 Browser - Complete Test...\n');
    
    // Test 1: Root directory
    console.log('1️⃣ Testing root directory...');
    const rootResponse = await fetch('http://localhost:3000/api/s3/list');
    const rootData = await rootResponse.json();
    
    if (!rootResponse.ok) {
      console.error('❌ Root API Error:', rootData.error);
      return;
    }

    console.log(`✅ Root: ${rootData.objects.length} files, ${rootData.folders.length} folders`);
    console.log(`   Source: ${rootData.source}`);
    console.log(`   Folders: ${rootData.folders.join(', ')}`);
    
    // Test 2: Navigate to approved-videos folder
    if (rootData.folders.includes('approved-videos/')) {
      console.log('\n2️⃣ Testing approved-videos folder...');
      const approvedResponse = await fetch('http://localhost:3000/api/s3/list?prefix=approved-videos/');
      const approvedData = await approvedResponse.json();
      
      if (approvedResponse.ok) {
        console.log(`✅ Approved videos: ${approvedData.objects.length} files, ${approvedData.folders.length} folders`);
        console.log(`   Folders: ${approvedData.folders.join(', ')}`);
        
        // Test 3: Navigate deeper if there are subfolders
        if (approvedData.folders.length > 0) {
          const firstSubfolder = approvedData.folders[0];
          console.log(`\n3️⃣ Testing subfolder: ${firstSubfolder}...`);
          const subfolderResponse = await fetch(`http://localhost:3000/api/s3/list?prefix=${firstSubfolder}`);
          const subfolderData = await subfolderResponse.json();
          
          if (subfolderResponse.ok) {
            console.log(`✅ Subfolder: ${subfolderData.objects.length} files, ${subfolderData.folders.length} folders`);
            
            // Show some sample files if available
            if (subfolderData.objects.length > 0) {
              console.log('\n📁 Sample files in subfolder:');
              subfolderData.objects.slice(0, 3).forEach((obj, index) => {
                console.log(`   ${index + 1}. ${obj.key.split('/').pop()}`);
                console.log(`      Size: ${(obj.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`      Modified: ${new Date(obj.lastModified).toLocaleDateString()}`);
              });
            }
          }
        }
      }
    }
    
    // Test 4: Test manual-uploads folder
    if (rootData.folders.includes('manual-uploads/')) {
      console.log('\n4️⃣ Testing manual-uploads folder...');
      const manualResponse = await fetch('http://localhost:3000/api/s3/list?prefix=manual-uploads/');
      const manualData = await manualResponse.json();
      
      if (manualResponse.ok) {
        console.log(`✅ Manual uploads: ${manualData.objects.length} files, ${manualData.folders.length} folders`);
        
        if (manualData.objects.length > 0) {
          console.log('\n📁 Sample manual uploads:');
          manualData.objects.slice(0, 3).forEach((obj, index) => {
            console.log(`   ${index + 1}. ${obj.key.split('/').pop()}`);
            console.log(`      Size: ${(obj.size / 1024 / 1024).toFixed(2)} MB`);
          });
        }
      }
    }
    
    console.log('\n🎉 S3 Browser test completed successfully!');
    console.log('\n💡 To see all your files:');
    console.log('   1. Visit http://localhost:3000/admin/s3-browser');
    console.log('   2. Click on the folder buttons to navigate');
    console.log('   3. Use the breadcrumb navigation to move between folders');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

// Run the test
testS3BrowserComplete(); 