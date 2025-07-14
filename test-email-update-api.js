const testUpdateEmail = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/update-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '03ee1446-83f0-4dca-9692-034d4bf9c096', // Karen's ID
        newEmail: 'karen.test@karenboyd.com'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data.error);
    } else {
      console.log('✅ API Success:', data.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Test the API
testUpdateEmail();
