import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { openai } from '@/lib/ai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StoryVariables {
  childName: string;
  theme: string;
  visualStyle: string;
  mainCharacter: string;
  sidekick: string;
  wishResultItems: string;
  buttonLocation: string;
  magicButton: string;
  chaoticActions: string;
  realizationEmotion: string;
  missedSimpleThing: string;
  finalScene: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storyVariables, pages, projectId }: { storyVariables: StoryVariables; pages: string[]; projectId?: string } = req.body;

    if (!storyVariables || !pages || pages.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: storyVariables, pages' });
    }

    console.log(`🎨 Generating illustration prompts for Wish Button story: ${pages.join(', ')}`);
    console.log('📊 Received story variables:', JSON.stringify(storyVariables, null, 2));

    const generatedPrompts: { [key: string]: { image: string; audio: string; safeZone: string } } = {};

    // Generate prompts for each requested page
    for (const page of pages) {
      console.log(`🎯 Generating prompts for ${page}...`);
      const pagePrompts = await generatePagePrompts(page, storyVariables);
      generatedPrompts[page] = pagePrompts;
      console.log(`✅ Generated ${page} prompts - Image: ${pagePrompts.image.length} chars, Audio: ${pagePrompts.audio.length} chars`);
    }

    // Save prompts to database for tracking
    console.log('💾 Saving prompts to database...');
    await savePromptsToDatabase(storyVariables, generatedPrompts, projectId);

    console.log('✅ Generated and saved Wish Button story prompts');

    return res.status(200).json({
      success: true,
      prompts: generatedPrompts,
      message: `Generated prompts for ${pages.length} page(s)`
    });

  } catch (error) {
    console.error('Error generating wish button prompts:', error);
    return res.status(500).json({
      error: 'Failed to generate prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generatePagePrompts(page: string, variables: StoryVariables): Promise<{ image: string; audio: string; safeZone: string }> {
  let pageContent = '';
  let audioScript = '';
  let safeZone = 'story_right_safe'; // Default for story pages

  // Fixed components for consistency - exactly as specified
  const mainCharacterBase = "a young boy with messy brown hair, wearing denim overalls and a striped yellow shirt, around 5 years old, friendly expression, barefoot";
  const visualStyle = "children's book illustration in a soft digital painting style, warm pastel color palette, watercolor texture, clean line art, gentle shadows, flat lighting";
  const layoutInstruction = "composition anchored to the left side of the image, right half of the image is intentionally empty with a soft, uncluttered pastel background for overlaying text";

  // Define page-specific content based on the Wish Button story structure from spec
  switch (page) {
    case 'page1':
      // Title Page
      pageContent = `${mainCharacterBase}, standing in a sunny field waving hello, with ${variables.sidekick} by his feet. Storybook title in playful hand-drawn lettering on the right side
${visualStyle}
${layoutInstruction}`;
      audioScript = `${variables.childName} and the Wish Button`;
      safeZone = 'story_right_safe';
      break;
      
    case 'page2':
      // Character Trait / Desire
      pageContent = `${mainCharacterBase}, excitedly talking about how much he loves ${variables.wishResultItems}, imagining ${variables.wishResultItems}, in a cheerful playroom, ${variables.sidekick} sits beside him
${visualStyle}
${layoutInstruction}`;
      audioScript = `${variables.childName} loved ${variables.wishResultItems}. Not just a little—a lot! More ${variables.wishResultItems}, more everything!`;
      safeZone = 'story_right_safe';
      break;

    case 'page3':
      // Discovery of the Wish Button
      pageContent = `${mainCharacterBase}, discovering a ${variables.magicButton} in ${variables.buttonLocation}, looking curious and amazed, ${variables.sidekick} is nearby looking curious
${visualStyle}
${layoutInstruction}`;
      audioScript = `One day, ${variables.childName} found a shiny button in the ${variables.buttonLocation}. It said: 'PRESS FOR MORE ${variables.wishResultItems.toUpperCase()}.'`;
      safeZone = 'story_right_safe';
      break;

    case 'page4':
      // First Wish Granted
      pageContent = `${mainCharacterBase}, pressing the button with excitement, surrounded by appearing ${variables.wishResultItems}, with ${variables.sidekick} joining in, POOF effect with magical sparkles
${visualStyle}
${layoutInstruction}`;
      audioScript = `${variables.childName} pressed the button. POOF! A ${variables.wishResultItems.split(' ')[0]} appeared. Then another! And another!`;
      safeZone = 'story_right_safe';
      break;

    case 'page5':
      // It Gets Worse
      pageContent = `${mainCharacterBase}, looking overwhelmed as dozens of ${variables.wishResultItems} ${variables.chaoticActions}, in a messy living room, ${variables.sidekick} is amid the chaos
${visualStyle}
${layoutInstruction}`;
      audioScript = `But soon, the ${variables.wishResultItems} started to ${variables.chaoticActions}. There were too many! It was too much.`;
      safeZone = 'story_right_safe';
      break;

    case 'page6':
      // The Realization
      pageContent = `${mainCharacterBase}, sitting in a messy room looking ${variables.realizationEmotion}, thinking sadly, ${variables.sidekick} looking concerned nearby
${visualStyle}
${layoutInstruction}`;
      audioScript = `${variables.childName} looked around. He had everything he wished for. But he felt ${variables.realizationEmotion}. He missed ${variables.missedSimpleThing}.`;
      safeZone = 'story_right_safe';
      break;

    case 'page7':
      // Final Wish
      pageContent = `${mainCharacterBase}, whispering into the ${variables.magicButton}, glowing light returning to the room, ${variables.sidekick} watching hopefully, magical glow around the button
${visualStyle}
${layoutInstruction}`;
      audioScript = `So he pressed the button one last time. 'I wish things could go back to how they were,' he whispered.`;
      safeZone = 'story_right_safe';
      break;

    case 'page8':
      // Outcome
      pageContent = `${mainCharacterBase}, sitting quietly with ${variables.sidekick} in ${variables.finalScene}, room calm and warm, just the right amount of ${variables.wishResultItems} around them
${visualStyle}
${layoutInstruction}`;
      audioScript = `Now ${variables.childName} had what he really wanted: just enough. Just right.`;
      safeZone = 'story_right_safe';
      break;

    case 'page9':
      // The End
      pageContent = `${mainCharacterBase}, peacefully sitting with ${variables.sidekick} in ${variables.finalScene} at sunset, both of them calm and happy, waving goodbye
${visualStyle}
${layoutInstruction}`;
      audioScript = `The End.`;
      safeZone = 'story_right_safe';
      break;
      
    default:
      throw new Error(`Unknown page: ${page}`);
  }

  // Return the exact spec-based prompts without AI generation
  return {
    image: pageContent,
    audio: audioScript,
    safeZone
  };
}

async function generateDetailedImagePrompt(pageDescription: string, variables: StoryVariables, safeZone: string): Promise<string> {
  const promptGenerationRequest = `Create a detailed illustration prompt for a children's storybook page.

Story Context:
- Theme: ${variables.theme}
- Visual Style: ${variables.visualStyle}
- Main Character: ${variables.mainCharacter}
- Sidekick: ${variables.sidekick}
- Target Age: 3-5 years old
- Safe Zone: ${safeZone} (${safeZone === 'right_safe' ? 'RIGHT THIRD OF IMAGE MUST BE COMPLETELY EMPTY for text overlay' : safeZone === 'center_safe' ? 'Center area should be clear for title text' : 'Follow safe zone requirements'})

Page Description: ${pageDescription}

CRITICAL SAFE ZONE REQUIREMENTS:
${safeZone === 'right_safe' ? 
  '- The RIGHT THIRD (33%) of the image MUST be completely empty - no characters, objects, or visual elements\n- All story elements must be contained in the LEFT TWO-THIRDS of the image\n- This creates space for text overlay on the right side' :
  safeZone === 'center_safe' ?
  '- Center area should have space for title text overlay\n- Visual elements can frame the center but leave space for text' :
  '- Follow standard composition guidelines for the specified safe zone'
}

Requirements:
- ${variables.visualStyle} art style
- Bright, warm, cheerful colors appropriate for ${variables.theme} theme
- Child-friendly and safe imagery (ages 3-5)
- Clear composition suitable for storybook layout with proper safe zone compliance
- ${variables.theme} theme elements integrated naturally
- Character consistency: ${variables.mainCharacter} and ${variables.sidekick}
- MUST respect safe zone requirements for text placement

Generate a detailed prompt for AI image generation that will create a beautiful, engaging illustration for this storybook page in ${variables.visualStyle} while strictly following the safe zone requirements.`;

  console.log('🤖 Sending to OpenAI:', promptGenerationRequest.substring(0, 200) + '...');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert children\'s book illustrator who creates detailed prompts for AI image generation. You understand the critical importance of safe zones for text overlay and always include specific spatial instructions in your prompts. Focus on creating vivid, age-appropriate, and thematically consistent artwork that respects layout requirements.'
      },
      {
        role: 'user',
        content: promptGenerationRequest
      }
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  const result = completion.choices[0]?.message?.content || pageDescription;
  console.log('🎨 AI generated prompt length:', result.length, 'chars');
  
  return result;
}

async function savePromptsToDatabase(variables: StoryVariables, prompts: { [key: string]: { image: string; audio: string; safeZone: string } }, projectId?: string) {
  try {
    let project;
    
    if (projectId) {
      // Use existing project
      console.log(`📝 Using existing project: ${projectId}`);
      const { data: existingProject, error: projectError } = await supabaseAdmin
        .from('content_projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) {
        console.error('Error fetching existing project:', projectError);
        throw new Error(`Failed to fetch existing project: ${projectError.message}`);
      }
      
      project = existingProject;
    } else {
      // Create a new project record for this Wish Button story
      console.log('🆕 Creating new project for Wish Button story');
      const { data: newProject, error: projectError } = await supabaseAdmin
        .from('content_projects')
        .insert({
          title: `Wish Button Story - ${variables.childName}`,
          theme: variables.theme,
          target_age: '3-5',
          duration: Object.keys(prompts).length * 30, // Rough estimate: 30 seconds per page
          status: 'prompts_generated',
          metadata: {
            template: 'wish-button',
            child_name: variables.childName,
            story_variables: variables,
            template_type: 'wish-button',
            pages_count: Object.keys(prompts).length
          }
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        throw new Error(`Failed to create project: ${projectError.message}`);
      }
      
      project = newProject;
    }

    console.log(`✅ Using project: ${project.id} for child ${variables.childName}`);

    // Save individual prompts
    const promptRecords = [];
    
    for (const [page, pagePrompts] of Object.entries(prompts)) {
      // Image prompt
      promptRecords.push({
        project_id: project.id,
        asset_type: 'image',
        theme: variables.theme,
        style: variables.visualStyle,
        safe_zone: pagePrompts.safeZone,
        prompt_text: pagePrompts.image,
        status: 'pending',
        metadata: {
          template: 'wish-button',
          page: page,
          asset_purpose: `${page}_image`,
          child_name: variables.childName,
          theme: variables.theme,
          safe_zone: pagePrompts.safeZone,
          story_context: variables
        }
      });

      // Audio prompt (script)
      promptRecords.push({
        project_id: project.id,
        asset_type: 'audio',
        theme: variables.theme,
        style: 'narrator',
        safe_zone: 'not_applicable',
        prompt_text: pagePrompts.audio,
        status: 'pending',
        metadata: {
          template: 'wish-button',
          page: page,
          asset_purpose: `${page}_audio`,
          child_name: variables.childName,
          theme: variables.theme,
          story_context: variables,
          script: pagePrompts.audio
        }
      });
    }

    const { error: promptsError } = await supabaseAdmin
      .from('prompts')
      .insert(promptRecords);

    if (promptsError) {
      console.error('Error saving prompts:', promptsError);
      throw new Error(`Failed to save prompts: ${promptsError.message}`);
    } else {
      console.log(`✅ Saved ${promptRecords.length} prompts to database`);
    }

  } catch (error) {
    console.error('Error in savePromptsToDatabase:', error);
  }
}
