import OpenAI from 'openai';
import { openai } from './ai';

interface EnhancedStoryContext {
  // Child Information (from database)
  childName: string;
  childAge: number;
  childDescription: string;
  pronouns: string;
  sidekickDescription: string;
  
  // Story Variables
  theme: string;
  wishResultItems: string;
  buttonLocation: string;
  magicButton: string;
  chaoticActions: string;
  realizationEmotion: string;
  missedSimpleThing: string;
  finalScene: string;
  
  // Technical Requirements
  visualStyle: string;
  safeZoneRequirements: SafeZoneConfig;
  targetAgeRange: string;
}

interface SafeZoneConfig {
  layout: 'story_right_safe' | 'center_safe' | 'full_frame';
  description: string;
  textPlacement: string;
}

interface PagePrompts {
  image: string;
  audio: string;
  safeZone: string;
}

export class StoryPromptAssistant {
  private assistantId: string | null = null;

  private readonly ASSISTANT_INSTRUCTIONS = `You are an expert children's book illustrator and prompt engineer specializing in creating detailed image prompts for AI-generated storybook illustrations. You follow the "Wish Button" narrative structure for 9-page illustrated preschool storybooks.

## CRITICAL REQUIREMENTS

### Safe Zone Compliance (MANDATORY)
- ALL illustrations must leave the RIGHT HALF of the image empty or lightly textured
- NO characters, props, or key story elements should appear on the right side
- Title text (Page 1) and story text (Pages 2-9) will be placed on the right half
- Use this phrase in every prompt: "composition anchored to the left side of the image, right half of the image is intentionally empty with a soft, uncluttered pastel background for overlaying text"

### Visual Style Consistency (EXACT PHRASE REQUIRED)
Include this EXACT styling block in every image prompt:
"children's book illustration in a soft digital painting style, warm pastel color palette, watercolor texture, clean line art, gentle shadows, flat lighting"

### Character Consistency (CRITICAL)
- Use the provided child_description EXACTLY as given - never alter clothing, hairstyle, or appearance
- Use the provided sidekick_description EXACTLY as given
- Maintain consistency across all pages

### Age-Appropriate Content
- Characters must appear friendly, cute, and expressive
- Actions must be safe, silly, magical, or cozy—not scary or threatening
- Limit chaos to playful messes (spilled snacks, bouncy toys)
- No sharp objects, dark scenes, or overwhelming sadness

## PAGE SPECIFICATIONS

### Page 1: Title Page
- Child + sidekick in cheerful outdoor setting
- Include "storybook title in playful hand-drawn lettering on the right side"
- Audio: "A Wish Button for {child_name}"

### Page 2: Desire/Trait
- Child daydreaming or playing with desired items
- Show 2-3 themed objects related to wish_result_items
- Audio: "{child_name} loved {wish_result_items}. Not just a little—a lot! More {related_items}, more everything!"

### Page 3: Discovery
- Child discovering magic_button in button_location
- Include curious, amazed expression
- Audio: "One day, {child_name} found a shiny button in the {button_location}. It said: 'PRESS FOR MORE {wish_result_items_uppercase}.'"

### Page 4: First Wish
- Child pressing button, first wishes appearing with POOF effect
- Show magical sparkles and excitement
- Audio: "{child_name} pressed the button. POOF! A {wish_result_item} appeared. Then another! And another!"

### Page 5: Chaos
- Child overwhelmed by chaotic_actions from too many items
- Keep chaos on left side only
- Audio: "But soon, the {wish_result_items} started to {chaotic_actions}. There were too many! It was too much."

### Page 6: Realization
- Child sitting alone, reflective mood in messy environment
- Show emotional realization_emotion
- Audio: "{child_name} looked around. {pronouns} had everything {pronouns} wished for. But {pronouns} felt {realization_emotion}. {pronouns} missed {missed_simple_thing}."

### Page 7: Final Wish
- Child pressing button with calm determination
- Show magical glow or peaceful transition
- Audio: "So {pronouns} pressed the button one last time. 'I wish things could go back to how they were,' {pronouns} whispered."

### Page 8: Resolution
- Child and sidekick in calm, cozy final_scene
- Show peace and contentment
- Audio: "Now {child_name} had what {pronouns} really wanted: just enough. Just right."

### Page 9: The End
- Child and sidekick waving goodbye under tree or sunset
- Include "The End" in soft lettering on right side
- Audio: "The End."

## OUTPUT FORMAT
When generating prompts, provide:
1. Complete image prompt with all required elements
2. Exact audio script text
3. Safe zone designation (always "story_right_safe")

Remember: NEVER deviate from provided character descriptions. ALWAYS include safe zone spacing. ALWAYS use exact visual style phrase.`;

  async createOrGetAssistant(): Promise<string> {
    if (this.assistantId) {
      return this.assistantId;
    }

    try {
      // Try to find existing assistant first
      const assistants = await openai.beta.assistants.list({
        limit: 20
      });

      const existingAssistant = assistants.data.find(
        assistant => assistant.name === "Children's Story Prompt Generator - Wish Button"
      );

      if (existingAssistant) {
        console.log('📚 Using existing OpenAI Assistant:', existingAssistant.id);
        this.assistantId = existingAssistant.id;
        return this.assistantId;
      }

      // Create new assistant if none exists
      console.log('🤖 Creating new OpenAI Assistant for story prompts...');
      const assistant = await openai.beta.assistants.create({
        name: "Children's Story Prompt Generator - Wish Button",
        instructions: this.ASSISTANT_INSTRUCTIONS,
        model: "gpt-4-turbo-preview",
        tools: []
      });

      this.assistantId = assistant.id;
      console.log('✅ Created OpenAI Assistant:', this.assistantId);
      return this.assistantId;

    } catch (error) {
      console.error('❌ Error creating/getting OpenAI Assistant:', error);
      throw new Error('Failed to initialize OpenAI Assistant');
    }
  }

  async generatePagePrompts(
    context: EnhancedStoryContext, 
    pageNumber: number
  ): Promise<PagePrompts> {
    console.log(`🎭 StoryPromptAssistant.generatePagePrompts called for page ${pageNumber}`);
    console.log('📋 Context received:', {
      childName: context.childName,
      childDescription: context.childDescription,
      sidekickDescription: context.sidekickDescription,
      pronouns: context.pronouns
    });
    
    try {
      const assistantId = await this.createOrGetAssistant();
      
      console.log(`🤖 Using assistant ID: ${assistantId}`);
      
      // Create a thread for this specific prompt generation
      const thread = await openai.beta.threads.create();

      // Prepare context variables for the page
      const pageContext = this.preparePageContext(context, pageNumber);
      
      const userMessage = `Generate prompts for Page ${pageNumber} of the Wish Button story.

CONTEXT:
- Child: ${context.childDescription}
- Pronouns: ${context.pronouns}
- Sidekick: ${context.sidekickDescription}
- Theme: ${context.theme}
- Wish Items: ${context.wishResultItems}
- Button Location: ${context.buttonLocation}
- Magic Button: ${context.magicButton}
- Chaotic Actions: ${context.chaoticActions}
- Realization Emotion: ${context.realizationEmotion}
- Missed Thing: ${context.missedSimpleThing}
- Final Scene: ${context.finalScene}

REQUIREMENTS:
1. Generate a complete image prompt following Page ${pageNumber} specifications
2. Provide the exact audio script text for this page
3. Ensure safe zone compliance (right half empty)
4. Use EXACT character descriptions provided
5. Include required visual style phrase
6. Make content age-appropriate for ${context.targetAgeRange}

Please provide the output in this format:
IMAGE_PROMPT: [complete detailed image prompt]
AUDIO_SCRIPT: [exact audio script text]
SAFE_ZONE: story_right_safe`;

      console.log('📝 Sending message to assistant:', userMessage);
      
      // Create message with page context
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      if (runStatus.status === 'completed') {
        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data[0];
        
        if (assistantMessage.role === 'assistant' && assistantMessage.content[0].type === 'text') {
          const response = assistantMessage.content[0].text.value;
          return this.parseAssistantResponse(response);
        }
      }

      throw new Error(`Assistant run failed with status: ${runStatus.status}`);

    } catch (error) {
      console.error(`❌ Error generating prompts for page ${pageNumber}:`, error);
      throw error;
    }
  }

  private preparePageContext(context: EnhancedStoryContext, pageNumber: number): any {
    // Add any page-specific context preparation here
    return {
      ...context,
      pageNumber,
      childNamePronoun: context.pronouns.split('/')[0], // he, she, they
      childObjectPronoun: context.pronouns.includes('they') ? 'them' : 
                         context.pronouns.includes('she') ? 'her' : 'him'
    };
  }

  private parseAssistantResponse(response: string): PagePrompts {
    try {
      // Parse the structured response from the assistant
      const imageMatch = response.match(/IMAGE_PROMPT:\s*([\s\S]*?)(?=AUDIO_SCRIPT:|$)/);
      const audioMatch = response.match(/AUDIO_SCRIPT:\s*([\s\S]*?)(?=SAFE_ZONE:|$)/);
      const safeZoneMatch = response.match(/SAFE_ZONE:\s*(.*?)$/);

      if (!imageMatch || !audioMatch) {
        throw new Error('Could not parse assistant response properly');
      }

      return {
        image: imageMatch[1].trim(),
        audio: audioMatch[1].trim(),
        safeZone: safeZoneMatch ? safeZoneMatch[1].trim() : 'story_right_safe'
      };

    } catch (error) {
      console.error('❌ Error parsing assistant response:', error);
      // Fallback to the raw response as image prompt
      return {
        image: response,
        audio: "Audio script generation failed",
        safeZone: 'story_right_safe'
      };
    }
  }

  async generateAllPagePrompts(context: EnhancedStoryContext): Promise<{ [key: string]: PagePrompts }> {
    const results: { [key: string]: PagePrompts } = {};
    
    for (let i = 1; i <= 9; i++) {
      console.log(`🎨 Generating prompts for page ${i}...`);
      try {
        const pagePrompts = await this.generatePagePrompts(context, i);
        results[`page${i}`] = pagePrompts;
        console.log(`✅ Generated page ${i} prompts`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to generate prompts for page ${i}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}

export default StoryPromptAssistant;
