import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assetKey, imageUrl, assetType, childName, targetLetter } = req.body;

    if (!assetKey || !imageUrl) {
      return res.status(400).json({ error: 'Missing required fields: assetKey, imageUrl' });
    }

    console.log(`📝 Letter Hunt asset update: ${assetType} for ${childName} (${targetLetter})`);
    console.log(`🎨 Asset Key: ${assetKey}`);
    console.log(`🖼️ Image URL: ${imageUrl}`);

    // For now, we'll just return success since the Letter Hunt request page
    // will handle the actual asset management through session storage or other means
    // In a full implementation, this could update a database record
    
    return res.status(200).json({
      success: true,
      message: `Asset ${assetKey} updated successfully`,
      assetKey,
      imageUrl,
      assetType,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating Letter Hunt asset:', error);
    return res.status(500).json({ 
      error: 'Failed to update asset',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
