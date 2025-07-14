import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the migration script
    const { migrateRemotionVideos } = require('../../../scripts/migrate-remotion-videos.js');
    
    console.log('🚀 Starting Remotion video migration via API...');
    await migrateRemotionVideos();
    
    return res.status(200).json({ 
      message: 'Remotion video migration completed successfully!' 
    });
  } catch (error: any) {
    console.error('❌ Migration API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to migrate Remotion videos' 
    });
  }
}
