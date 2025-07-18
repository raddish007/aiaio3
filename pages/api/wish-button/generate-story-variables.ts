import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { openai } from '@/lib/ai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { childName, theme, age } = req.body;

    if (!childName || !theme) {
      return res.status(400).json({ success: false, error: 'Missing required fields: childName, theme' });
    }

    console.log(`🎭 Generating Wish Button story variables for ${childName} (${theme} theme)`);

    // Get child information from database to use stored descriptions
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .select('id, name, age, child_description, pronouns, sidekick_description')
      .eq('name', childName)
      .single();

    if (childError || !childData) {
      console.error('❌ Error fetching child data:', childError);
      return res.status(400).json({ 
        success: false,
        error: 'Child not found in database. Please ensure child profile exists with descriptions.' 
      });
    }

    console.log('✅ Using child data from database:', {
      name: childData.name,
      hasChildDescription: !!childData.child_description,
      hasSidekickDescription: !!childData.sidekick_description
    });

    // Generate story variables using AI based on child's theme and interests
    // BUT use database descriptions for character and sidekick
    const storyPrompt = `Create personalized story variables for "The Wish Button" story for ${childName}, a ${age}-year-old who loves ${theme}.

IMPORTANT: I will provide the character and sidekick descriptions from the database - do NOT generate these.

Generate variables for this story structure:
- A child finds a magic wish button and gets what they want, but learns it's too much
- Story teaches moderation and appreciating what you have

Based on the ${theme} theme, generate these variables as SIMPLE TEXT STRINGS (not objects):

1. Visual Style: Choose ONE art style that fits ${theme}: "2D Pixar Style", "Disney Animation Style", "Studio Ghibli Style", "Cartoon Network Style", or "Nick Jr Style"

2. Wish Result Items: What would a ${theme}-loving child want more of? (simple text like "toy cars and trucks")

3. Button Location: Where would they find the magic button? (${theme}-themed location, simple text)

4. Magic Button Description: What does the magical button look like? (themed description like "shiny red button shaped like a dog paw")

5. Chaotic Actions: What goes wrong when they get too many items? (simple action description)

6. Realization Emotion: How do they feel when they realize it's too much? (simple emotion)

7. Missed Simple Thing: What simple thing did they lose/miss in the chaos? (simple text)

8. Final Scene: Peaceful ending location that fits ${theme} (simple text)

CRITICAL: Return ONLY valid JSON with these exact keys: visualStyle, wishResultItems, buttonLocation, magicButton, chaoticActions, realizationEmotion, missedSimpleThing, finalScene

DO NOT include mainCharacter or sidekick - these will be provided from the database.
Each value must be a simple text string, NOT an object or array. Age-appropriate for ${age} years old.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert children's story creator who creates personalized, age-appropriate story variables. Return valid JSON only."
        },
        {
          role: "user",
          content: storyPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error('❌ No content in OpenAI response');
      return res.status(500).json({ success: false, error: 'Failed to generate story variables' });
    }

    console.log('📝 OpenAI raw response:', content);

    // Parse the JSON response
    let aiStoryVariables;
    try {
      // Clean the content - remove any markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiStoryVariables = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      console.error('Raw content:', content);
      return res.status(500).json({ success: false, error: 'Failed to parse story variables' });
    }

    // Combine AI-generated variables with database character descriptions
    const storyVariables = {
      ...aiStoryVariables,
      childName: childData.name,
      theme: theme,
      mainCharacter: childData.child_description || `${childData.name}, a friendly and curious child`,
      sidekick: childData.sidekick_description || 'a loyal and magical companion'
    };

    console.log('✅ Wish Button story variables generated successfully:', {
      aiGenerated: Object.keys(aiStoryVariables),
      fromDatabase: ['mainCharacter', 'sidekick'],
      childName: childData.name
    });
    
    res.status(200).json({ success: true, storyVariables });

  } catch (error) {
    console.error('❌ Error generating Wish Button story variables:', error);
    res.status(500).json({ success: false, error: 'Failed to generate story variables' });
  }
}
