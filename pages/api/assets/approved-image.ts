import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch a random approved image asset
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .limit(1);

    if (error) {
      console.error('Error fetching approved image asset:', error);
      return res.status(500).json({ error: 'Failed to fetch image asset' });
    }

    if (!assets || assets.length === 0) {
      return res.status(404).json({ error: 'No approved image assets found' });
    }

    // Return the first (random) approved image asset
    res.status(200).json({ asset: assets[0] });
  } catch (error) {
    console.error('Error in approved-image API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 