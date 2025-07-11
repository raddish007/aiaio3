import OpenAI from 'openai';
import { PromptEngine, PromptEngineContext } from './prompt-engine';

// OpenAI Configuration - only instantiate on server-side
const getOpenAIClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI client should only be used on the server-side');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export interface PromptContext {
  childName?: string;
  theme: string;
  ageRange: string;
  template: 'lullaby' | 'name-video' | 'educational' | 'name-show';
  personalization?: 'general' | 'personalized';
  safeZone?: 'left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable' | 'frame' | 'slideshow';
  aspectRatio?: '16:9' | '9:16';
  artStyle?: string;
  promptCount?: number;
  additionalContext?: string;
}

export interface GeneratedPrompts {
  images: string[];
  metadata: {
    template: string;
    safeZone: string;
    theme: string;
    ageRange: string;
    aspectRatio: string;
    artStyle: string;
    variations?: string[];
    generatedAt: string;
  };
}

export class PromptGenerator {
  static async generatePrompts(context: PromptContext): Promise<GeneratedPrompts> {
    try {
      // Map legacy safe zone names to new system
      const safeZone = this.mapLegacySafeZone(context.safeZone, context.template);
      
      // Convert to new engine context
      const engineContext: PromptEngineContext = {
        theme: context.theme,
        templateType: context.template,
        ageRange: context.ageRange,
        safeZone: safeZone,
        aspectRatio: context.aspectRatio || '16:9',
        artStyle: context.artStyle || '2D Pixar Style',
        promptCount: context.promptCount || 3,
        childName: context.childName,
        additionalContext: context.additionalContext
      };

      // Use the new prompt engine
      const result = await PromptEngine.generatePrompts(engineContext);
      
      return {
        images: result.images,
        metadata: {
          template: context.template,
          safeZone: safeZone,
          theme: context.theme,
          ageRange: context.ageRange,
          aspectRatio: context.aspectRatio || '16:9',
          artStyle: context.artStyle || '2D Pixar Style',
          variations: result.metadata.variations,
          generatedAt: result.metadata.generatedAt
        }
      };

    } catch (error) {
      console.error('Error generating prompts:', error);
      
      // Fallback to legacy system if new engine fails
      console.log('Falling back to legacy prompt generation...');
      return this.legacyGeneratePrompts(context);
    }
  }

  private static mapLegacySafeZone(safeZone: string | undefined, template: string): string {
    if (!safeZone) {
      return this.getDefaultSafeZone(template);
    }

    // Map legacy safe zone names
    const mappings: Record<string, string> = {
      'frame': 'center_safe',
      'not_applicable': 'all_ok'
    };

    return mappings[safeZone] || safeZone;
  }

  private static getDefaultSafeZone(template: string): string {
    switch (template) {
      case 'lullaby':
        return 'slideshow';
      case 'name-video':
        return 'center_safe';
      case 'educational':
        return 'center_safe';
      default:
        return 'center_safe';
    }
  }

  // Legacy fallback method
  private static async legacyGeneratePrompts(context: PromptContext): Promise<GeneratedPrompts> {
    const instructions = context.template === 'lullaby' 
      ? this.getLullabyInstructions() 
      : this.getNameVideoInstructions();

    const safeZone = context.safeZone || this.getDefaultSafeZone(context.template);
    
    const systemPrompt = `You are an expert content creator for children's educational videos. You must follow the provided instructions EXACTLY and return ONLY valid JSON.`;

    const userPrompt = this.buildUserPrompt(context, instructions, safeZone);

    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return {
        ...parsed,
        metadata: {
          template: context.template,
          safeZone,
          theme: context.theme,
          ageRange: context.ageRange,
          aspectRatio: context.aspectRatio || '16:9',
          artStyle: context.artStyle || '2D Pixar Style',
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error generating prompts:', error);
      throw new Error('Failed to generate prompts');
    }
  }

  private static getLullabyInstructions(): string {
    return `You are generating prompts for preschool lullaby videos with a calming bedtime theme. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
NO dark themes, shadows, or ominous elements.
Characters and imagery must ALWAYS appear calm, peaceful, and friendly.
Colors must be soft, warm, and inviting (avoid dark, overly saturated, or harsh tones).
All imagery must be gentle, non-startling, and soothing.
Themes must be interpreted in the most innocent, cozy, sleepy way possible.

🎨 IMAGE REQUIREMENTS
May include more than one character or object, but keep compositions simple, uncluttered, and clear.
Calm, bedtime poses or states such as lying down asleep, curled up peacefully, eyes closed in calm rest.
Light, soft solid color backgrounds only.
Bedtime props are allowed if calming and simple (blanket, pillow, teddy bear, moon, stars).
No text or letters included in the image itself.

🛌 BEDTIME THEME REQUIREMENTS
The entire image must convey a peaceful bedtime or sleeping concept.
Characters or items are asleep, resting, or in quiet bedtime preparation.
Eyes closed if appropriate (animals, people).

📝 PROMPT STRUCTURE
Each prompt must include art style, theme description with species/breed/type, color details, expressions, pose, background description, and negative instructions.`;
  }

  private static getNameVideoInstructions(): string {
    return `You are generating prompts for preschool educational videos. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting (avoid dark or muted tones).
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 IMAGE REQUIREMENTS
SINGLE character or object only (no groups, pairs, or busy scenes).
Simple, clear pose (sitting, standing, smiling calmly).
Light, solid color background only.
No props, toys, or additional decorations unless explicitly requested.
No text or letters included in the image itself.

📝 PROMPT STRUCTURE
Each prompt must include art style, theme description with species/breed/type, color details, expression, pose, background description, and negative instructions.`;
  }

  private static buildUserPrompt(context: PromptContext, instructions: string, safeZone: string): string {
    const personalization = context.personalization === 'personalized' && context.childName
      ? `This content is personalized for a child named ${context.childName}.`
      : 'This is general content for children.';

    const themeContext = context.additionalContext 
      ? `\nAdditional context: ${context.additionalContext}`
      : '';

    const aspectRatioText = context.aspectRatio ? `\nAspect Ratio: ${context.aspectRatio}` : '';
    const artStyleText = context.artStyle ? `\nArt Style: ${context.artStyle}` : '';

    return `${instructions}

CONTEXT:
Theme: ${context.theme}
Age Range: ${context.ageRange}
Template: ${context.template}
Safe Zone: ${safeZone}${aspectRatioText}${artStyleText}
${personalization}${themeContext}

TASK:
Generate ${context.promptCount || 3} image prompts for a ${context.theme} video targeting ${context.ageRange} year olds.

Return a JSON object with the following structure:
{
  "images": [
    "Complete detailed prompt for image 1",
    "Complete detailed prompt for image 2", 
    "Complete detailed prompt for image 3"
  ]
}

IMPORTANT:
- Each prompt must follow the exact format and safety requirements above
- Include the safe zone placement instructions in each image prompt
- Make content engaging and age-appropriate
- Ensure all prompts are consistent with the theme
- Return ONLY the JSON object, no additional text`;
  }

  static async savePromptsToDatabase(projectId: string, prompts: GeneratedPrompts) {
    // This would save the generated prompts to the database
    // Implementation depends on your database schema
    console.log('Saving prompts to database for project:', projectId);
    console.log('Prompts:', JSON.stringify(prompts, null, 2));
    
    // TODO: Implement database save logic
    return { success: true, projectId };
  }
} 