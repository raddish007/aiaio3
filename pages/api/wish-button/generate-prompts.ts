import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import StoryPromptAssistant from '@/lib/story-prompt-assistant';

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

interface Child {
  id: string;
  name: string;
  age: number;
  child_description?: string;
  pronouns?: string;
  sidekick_description?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storyVariables, pages, projectId }: { 
      storyVariables: StoryVariables; 
      pages: string[]; 
      projectId?: string;
    } = req.body;

    if (!storyVariables || !pages || pages.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: storyVariables, pages' });
    }

    console.log(`🎨 Generating OpenAI Assistant prompts for Wish Button story: ${pages.join(', ')}`);
    console.log('📊 Received story variables:', JSON.stringify(storyVariables, null, 2));

    // Get child information from database to retrieve descriptions
    const childData = await getChildData(storyVariables.childName);
    
    console.log('👤 Child data fetched:', childData);
    
    if (!childData) {
      console.error('❌ Child not found:', storyVariables.childName);
      return res.status(400).json({ 
        error: 'Child not found in database. Please ensure child profile exists with descriptions.' 
      });
    }

    console.log('✅ Child found:', {
      name: childData.name,
      hasChildDescription: !!childData.child_description,
      childDescription: childData.child_description,
      hasSidekickDescription: !!childData.sidekick_description,
      sidekickDescription: childData.sidekick_description,
      pronouns: childData.pronouns
    });

    // Prepare enhanced context for the OpenAI Assistant
    const enhancedContext = {
      // Child Information (from database)
      childName: storyVariables.childName,
      childAge: childData.age,
      childDescription: childData.child_description || `a young child named ${storyVariables.childName}`,
      pronouns: childData.pronouns || 'he/him',
      sidekickDescription: childData.sidekick_description || 'a friendly animal companion',
      
      // Story Variables
      theme: storyVariables.theme,
      wishResultItems: storyVariables.wishResultItems,
      buttonLocation: storyVariables.buttonLocation,
      magicButton: storyVariables.magicButton,
      chaoticActions: storyVariables.chaoticActions,
      realizationEmotion: storyVariables.realizationEmotion,
      missedSimpleThing: storyVariables.missedSimpleThing,
      finalScene: storyVariables.finalScene,
      
      // Technical Requirements
      visualStyle: "children's book illustration in a soft digital painting style, warm pastel color palette, watercolor texture, clean line art, gentle shadows, flat lighting",
      safeZoneRequirements: {
        layout: 'story_right_safe' as const,
        description: 'Right half must be empty for text overlay',
        textPlacement: 'Right side reserved for story text'
      },
      targetAgeRange: '3-5 years'
    };

    console.log('🧠 Enhanced context prepared:', {
      childName: enhancedContext.childName,
      hasChildDescription: !!enhancedContext.childDescription,
      hasSidekickDescription: !!enhancedContext.sidekickDescription,
      pronouns: enhancedContext.pronouns,
      actualChildDescription: enhancedContext.childDescription,
      actualSidekickDescription: enhancedContext.sidekickDescription
    });

    console.log('🤖 About to call OpenAI Assistant with context:', enhancedContext);

    // Use OpenAI Assistant to generate prompts
    const assistant = new StoryPromptAssistant();
    const generatedPrompts: { [key: string]: { image: string; audio: string; safeZone: string } } = {};

    // Generate prompts for each requested page
    for (const page of pages) {
      const pageNumber = parseInt(page.replace('page', ''));
      console.log(`🎯 Generating prompts for ${page} (Page ${pageNumber})...`);
      
      try {
        const pagePrompts = await assistant.generatePagePrompts(enhancedContext, pageNumber);
        generatedPrompts[page] = pagePrompts;
        console.log(`✅ Generated ${page} prompts - Image: ${pagePrompts.image.length} chars, Audio: ${pagePrompts.audio.length} chars`);
      } catch (error) {
        console.error(`❌ Error generating ${page} prompts:`, error);
        throw new Error(`Failed to generate prompts for ${page}: ${error}`);
      }
    }

    // Save prompts to database for tracking
    console.log('💾 Saving prompts to database...');
    await savePromptsToDatabase(storyVariables, generatedPrompts, projectId);

    console.log('✅ Generated and saved OpenAI Assistant Wish Button story prompts');

    return res.status(200).json({
      success: true,
      prompts: generatedPrompts,
      message: `Generated prompts for ${pages.length} page(s) using OpenAI Assistant`,
      metadata: {
        usedAssistant: true,
        childDescription: enhancedContext.childDescription,
        sidekickDescription: enhancedContext.sidekickDescription,
        pronouns: enhancedContext.pronouns
      }
    });

  } catch (error) {
    console.error('Error generating wish button prompts:', error);
    return res.status(500).json({
      error: 'Failed to generate prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getChildData(childName: string): Promise<Child | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('children')
      .select('id, name, age, child_description, pronouns, sidekick_description')
      .eq('name', childName)
      .single();

    if (error) {
      console.error('Error fetching child data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getChildData:', error);
    return null;
  }
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
