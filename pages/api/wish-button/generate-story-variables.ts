import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { openai } from '@/lib/ai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { childName, theme, age } = req.body;

    if (!childName || !theme) {
      return res.status(400).json({ error: 'Missing required fields: childName, theme' });
    }

    console.log(`🎭 Generating Wish Button story variables for ${childName} (${theme} theme)`);

    // Generate story variables using AI based on child's theme and interests
    const storyPrompt = `Create personalized story variables for "The Wish Button" story for ${childName}, a ${age}-year-old who loves ${theme}.

Generate variables for this story structure:
- A child finds a magic wish button and gets what they want, but learns it's too much
- Story teaches moderation and appreciating what you have

Based on the ${theme} theme, generate these variables as SIMPLE TEXT STRINGS (not objects):

1. Visual Style: Choose ONE art style that fits ${theme}: "2D Pixar Style", "Disney Animation Style", "Studio Ghibli Style", "Cartoon Network Style", or "Nick Jr Style"

2. Main Character Description: Describe ${childName} as a character in ONE clear sentence - their appearance, personality, clothing in ${theme} style

3. Sidekick Character: A small companion animal/creature that fits ${theme} - describe in ONE clear sentence

4. Wish Result Items: What would a ${theme}-loving child want more of? (simple text like "toy cars and trucks")

5. Button Location: Where would they find the magic button? (${theme}-themed location, simple text)

6. Magic Button Description: What does the magical button look like? (themed description like "shiny red button shaped like a dog paw")

7. Chaotic Actions: What goes wrong when they get too many items? (simple action description)

8. Realization Emotion: How do they feel when they realize it's too much? (simple emotion)

9. Missed Simple Thing: What simple thing did they lose/miss in the chaos? (simple text)

10. Final Scene: Peaceful ending location that fits ${theme} (simple text)

CRITICAL: Return ONLY valid JSON with these exact keys: visualStyle, mainCharacter, sidekick, wishResultItems, buttonLocation, magicButton, chaoticActions, realizationEmotion, missedSimpleThing, finalScene

Each value must be a simple text string, NOT an object or array. Age-appropriate for ${age} years old.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert children\'s story writer who creates personalized, educational stories. ALWAYS return valid JSON with simple string values only. Do not use objects, arrays, or complex structures - just simple text strings for each field.'
        },
        {
          role: 'user',
          content: storyPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    let storyVariables;
    try {
      storyVariables = JSON.parse(responseContent);
      
      // Validate that all values are strings (not objects)
      const requiredFields = ['visualStyle', 'mainCharacter', 'sidekick', 'wishResultItems', 'buttonLocation', 'magicButton', 'chaoticActions', 'realizationEmotion', 'missedSimpleThing', 'finalScene'];
      
      for (const field of requiredFields) {
        if (!storyVariables[field] || typeof storyVariables[field] !== 'string') {
          console.warn(`Invalid or missing field ${field}:`, storyVariables[field]);
          // Fallback to default if field is invalid
          storyVariables = generateFallbackVariables(childName, theme);
          break;
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseContent);
      // Fallback to default values if AI response is malformed
      storyVariables = generateFallbackVariables(childName, theme);
    }

    // Add the child name and theme to the variables
    storyVariables.childName = childName;
    storyVariables.theme = theme;

    console.log('✅ Generated story variables:', storyVariables);

    return res.status(200).json({
      success: true,
      storyVariables
    });

  } catch (error) {
    console.error('Error generating story variables:', error);
    
    // Return fallback variables if AI generation fails
    const fallbackVariables = generateFallbackVariables(req.body.childName, req.body.theme);
    fallbackVariables.childName = req.body.childName;
    fallbackVariables.theme = req.body.theme;
    
    return res.status(200).json({
      success: true,
      storyVariables: fallbackVariables,
      note: 'Used fallback variables due to AI generation error'
    });
  }
}

function generateFallbackVariables(childName: string, theme: string) {
  // Theme-specific fallback variables
  const themeDefaults: { [key: string]: any } = {
    dogs: {
      visualStyle: '2D Pixar Style',
      mainCharacter: `${childName}, a young child with bright eyes wearing a dog-themed t-shirt and comfortable play clothes`,
      sidekick: 'a small, fluffy golden retriever puppy with a wagging tail',
      wishResultItems: 'puppies and dog toys',
      buttonLocation: 'dog park under a shady tree',
      magicButton: 'shiny red button shaped like a dog paw',
      chaoticActions: 'bark loudly and run around everywhere',
      realizationEmotion: 'overwhelmed and tired',
      missedSimpleThing: 'quiet cuddle time with just one puppy',
      finalScene: 'cozy living room with a single friendly dog'
    },
    halloween: {
      visualStyle: 'Cartoon Network Style',
      mainCharacter: `${childName}, a young child wearing a fun Halloween costume with a big smile`,
      sidekick: 'a friendly little ghost with a cute hat',
      wishResultItems: 'pumpkins and Halloween treats',
      buttonLocation: 'spooky but friendly haunted garden',
      magicButton: 'glowing orange button shaped like a tiny pumpkin',
      chaoticActions: 'roll around and pile up everywhere',
      realizationEmotion: 'confused and a bit scared',
      missedSimpleThing: 'the peaceful moonlight',
      finalScene: 'calm pumpkin patch under the stars'
    },
    space: {
      visualStyle: 'Disney Animation Style',
      mainCharacter: `${childName}, a young child wearing a silver space suit with a helmet under their arm`,
      sidekick: 'a small, round robot with blinking lights',
      wishResultItems: 'rockets and space toys',
      buttonLocation: 'space station control room',
      magicButton: 'silver button shaped like a tiny rocket ship',
      chaoticActions: 'zoom around and make loud rocket noises',
      realizationEmotion: 'dizzy and confused',
      missedSimpleThing: 'the quiet beauty of the stars',
      finalScene: 'peaceful observation deck overlooking Earth'
    }
  };

  return themeDefaults[theme.toLowerCase()] || {
    visualStyle: '2D Pixar Style',
    mainCharacter: `${childName}, a young child with a bright smile wearing comfortable play clothes`,
    sidekick: 'a small, friendly companion animal',
    wishResultItems: 'toys and treats',
    buttonLocation: 'magical garden',
    magicButton: 'shiny golden button with magical sparkles',
    chaoticActions: 'pile up and make a big mess',
    realizationEmotion: 'overwhelmed',
    missedSimpleThing: 'the peaceful quiet',
    finalScene: 'cozy room with just the right amount of everything'
  };
}
