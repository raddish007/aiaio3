import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const falApiKey = process.env.FAL_AI_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY;
    
    const envCheck = {
      FAL_AI_API_KEY: process.env.FAL_AI_API_KEY ? 'SET' : 'NOT SET',
      FAL_KEY: process.env.FAL_KEY ? 'SET' : 'NOT SET', 
      FAL_API_KEY: process.env.FAL_API_KEY ? 'SET' : 'NOT SET',
      finalApiKey: falApiKey ? 'AVAILABLE' : 'NOT AVAILABLE',
      keyLength: falApiKey ? falApiKey.length : 0
    };

    console.log('FAL.AI Environment Check:', envCheck);

    if (!falApiKey) {
      return res.status(400).json({ 
        error: 'FAL.AI API key not configured',
        envCheck
      });
    }

    // Test a simple API call to FAL.AI
    try {
      const testResponse = await fetch('https://queue.fal.run/health', {
        method: 'GET',
        headers: {
          'Authorization': `Key ${falApiKey}`,
        }
      });

      const responseData = await testResponse.text();
      
      return res.status(200).json({
        success: true,
        message: 'FAL.AI service test completed',
        envCheck,
        apiTest: {
          status: testResponse.status,
          statusText: testResponse.statusText,
          response: responseData
        }
      });

    } catch (apiError) {
      console.error('FAL.AI API test error:', apiError);
      return res.status(500).json({
        error: 'FAL.AI API test failed',
        envCheck,
        apiError: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
    }

  } catch (error) {
    console.error('FAL.AI test handler error:', error);
    return res.status(500).json({
      error: 'Test handler failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
