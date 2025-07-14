import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the script logic using require for CommonJS compatibility
    const { updateChildPlaylists } = require('../../../scripts/update-child-playlists.js');
    const result = await updateChildPlaylists();
    return res.status(200).json({ message: result || 'Playlists updated!' });
  } catch (error: any) {
    console.error('Error updating child playlists:', error);
    return res.status(500).json({ error: error.message || 'Failed to update playlists' });
  }
} 