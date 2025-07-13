import { NextApiRequest, NextApiResponse } from 'next';
import { PromptEngine, PromptEngineContext } from '../../../lib/prompt-engine';
import { FalAIService, ImageGenerationRequest } from '../../../lib/fal-ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      templateType,
      safeZone,
      theme,
      childName,
      targetLetter,
      assetType,
      artStyle = '2D Pixar Style',
      ageRange = '3-5',
      aspectRatio = '16:9',
      customPrompt // New parameter for manual prompt override
    } = req.body;

    // Validate required fields
    if (!templateType || !childName || !targetLetter || !assetType) {
      return res.status(400).json({ 
        error: 'Missing required fields: templateType, childName, targetLetter, assetType' 
      });
    }

    // Create specialized prompts based on asset type
    let generatedPrompt = '';
    let customSafeZone = safeZone;

    // If custom prompt is provided, use it directly
    if (customPrompt) {
      generatedPrompt = customPrompt;
      console.log(`🎨 Using custom prompt for ${assetType}`);
    } else {
      // Generate prompt based on asset type
      switch (assetType) {
        case 'titleCard':
          generatedPrompt = `Create a bright, colorful title card with the text "${childName}'s Letter Hunt!" in large playful letters, with friendly cartoon monsters around the edges, flat pastel background suitable for text overlay.`;
          customSafeZone = 'center_safe';
          break;
        
        case 'signImage':
          generatedPrompt = `A bright, cartoon-style image of the letter ${targetLetter} on a green street sign with cute friendly monster characters around it. Flat pastel background, no additional text.`;
          customSafeZone = 'slideshow';
          break;
        
        case 'bookImage':
          generatedPrompt = `A bright, cartoon-style image of the letter ${targetLetter} on a children's book cover with cute monster characters peeking out. Flat pastel background, no additional text.`;
          customSafeZone = 'slideshow';
          break;
        
        case 'groceryImage':
          generatedPrompt = `A bright, cartoon-style image of the letter ${targetLetter} on a cereal box in a grocery store shelf, with friendly monster characters waving nearby. Flat pastel background, no additional text.`;
          customSafeZone = 'slideshow';
          break;
        
        case 'endingVideo':
          generatedPrompt = `A bright, cartoon-style image of the letter ${targetLetter} with friendly monster characters waving and smiling around it, flat pastel background, no additional text.`;
          customSafeZone = 'slideshow';
          break;
        
        default:
          return res.status(400).json({ error: `Unknown asset type: ${assetType}` });
      }
    }

    // For now, we'll use direct prompt generation rather than the full prompt engine
    // since we have specific requirements for each asset type
    console.log(`🎨 Generating ${assetType} for ${childName} - Letter ${targetLetter}`);

    const job = await FalAIService.generateImage({
      prompt: generatedPrompt,
      aspectRatio: aspectRatio as any
    });

    if (job.status === 'failed' || !job.result?.images?.[0]?.url) {
      throw new Error(job.error || 'Failed to generate image');
    }

    const imageUrl = job.result.images[0].url;
    console.log(`✅ Generated ${assetType}:`, imageUrl);

    return res.status(200).json({
      success: true,
      imageUrl,
      assetType,
      metadata: {
        childName,
        targetLetter,
        assetType,
        prompt: generatedPrompt,
        customPromptUsed: !!customPrompt,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating Letter Hunt asset:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
