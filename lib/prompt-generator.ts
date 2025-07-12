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
  template: 'lullaby' | 'name-video' | 'educational' | 'name-show' | 'letter-hunt';
  personalization?: 'general' | 'personalized';
  safeZone?: 'left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable' | 'frame' | 'slideshow';
  aspectRatio?: '16:9' | '9:16';
  artStyle?: string;
  promptCount?: number;
  additionalContext?: string;
  assetType?: string; // Keep for backward compatibility
  imageType?: 'titleCard' | 'signImage' | 'bookImage' | 'groceryImage' | 'endingImage' | 'characterImage' | 'sceneImage'; // New structured approach
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
    imageType?: string; // Add imageType to metadata
    variations?: string[];
    generatedAt: string;
  };
}

export class PromptGenerator {
  static async generatePrompts(context: PromptContext): Promise<GeneratedPrompts> {
    // Force legacy generation for letter-hunt to use asset-specific instructions
    if (context.template === 'letter-hunt') {
      console.log('Using legacy generation for letter-hunt template with asset-specific instructions');
      return this.legacyGeneratePrompts(context);
    }

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

    try {
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
          imageType: context.imageType || context.assetType, // Include the new imageType metadata
          variations: result.metadata.variations,
          generatedAt: result.metadata.generatedAt
        }
      };

    } catch (error) {
      console.error('Error in new PromptEngine.generatePrompts:', error);
      console.error('Context that failed:', JSON.stringify(engineContext, null, 2));
      
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
      case 'name-show':
        return 'all_ok';
      case 'letter-hunt':
        return 'all_ok'; // Full composition with letter as focal point
      case 'educational':
        return 'center_safe';
      default:
        return 'center_safe';
    }
  }

  // Legacy fallback method
  private static async legacyGeneratePrompts(context: PromptContext): Promise<GeneratedPrompts> {
    // FIXED: Handle name-show template properly in legacy fallback
    let instructions;
    if (context.template === 'lullaby') {
      instructions = this.getLullabyInstructions();
    } else if (context.template === 'name-show') {
      instructions = this.getNameShowInstructions();
    } else if (context.template === 'letter-hunt') {
      // Use new imageType if available, fallback to assetType for backward compatibility
      const imageType = context.imageType || context.assetType || 'titleCard';
      instructions = this.getLetterHuntAssetInstructions(imageType);
    } else {
      instructions = this.getNameVideoInstructions();
    }

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
          imageType: context.imageType || context.assetType, // Include the new imageType metadata
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

  private static getNameShowInstructions(): string {
    return `You are generating prompts for game show-style title cards featuring "THE [NAME] SHOW" in big, bold, readable letters for preschool children (ages 2-5). The text should be the main focus with themed decorative elements around it that don't block the letters. Content must be bright, exciting, and game show-like while remaining age-appropriate.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 TITLE CARD REQUIREMENTS
Large, bold, block letters spelling "THE [NAME] SHOW" prominently displayed in the center.
Text must be highly readable for young children - use thick, rounded, child-friendly fonts.
Bright, vibrant colors with strong contrast between text and background.
Themed decorative elements scattered around the text but NOT blocking or overlapping the letters.
Game show atmosphere - exciting, celebratory, fun energy.
Background should complement but not compete with the text readability.
Decorative elements should be small to medium sized and positioned around the edges or corners.
Text should be the clear focal point of the entire composition.

📝 PROMPT STRUCTURE
Each prompt must include the text "THE [NAME] SHOW" prominently, art style, themed decorative elements, background description, and text positioning instructions.`;
  }

  private static getLetterHuntInstructions(): string {
    return `You are generating prompts for letter hunt educational content featuring a target letter in big, bold, readable format for preschool children (ages 2-5). The letter should be the main focus with themed decorative elements around it that help children learn and recognize the letter. Content must be bright, engaging, and educational while remaining age-appropriate.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 LETTER HUNT REQUIREMENTS
Large, bold, uppercase letter prominently displayed in the center as the main focal point.
Letter must be highly readable for young children - use thick, rounded, child-friendly fonts.
Bright, vibrant colors with strong contrast between letter and background.
Themed decorative elements scattered around the letter but NOT blocking or overlapping it.
Educational atmosphere - encouraging learning, discovery, and letter recognition.
Background should complement but not compete with the letter readability.
Include 2-3 objects that start with the target letter as visual learning aids positioned around the edges.
The letter should be large enough to fill a significant portion of the image.
Letter should be the clear focal point of the entire composition, similar to how "THE [NAME] SHOW" works for name videos.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed, art style, themed decorative elements, background description, and educational objects that start with the letter. The letter should be the star of the image, not a border or frame.`;
  }

  private static getLetterHuntAssetInstructions(assetType: string): string {
    const baseInstructions = this.getLetterHuntInstructions();
    
    switch (assetType) {
      case 'titleCard':
        return `You are generating prompts for Letter Hunt title cards featuring "Letter Hunt for [NAME]" in big, bold, readable letters for preschool children (ages 2-5). The text should be the main focus with themed decorative elements around it that don't block the letters. Content must be bright, exciting, and game show-like while remaining age-appropriate.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 TITLE CARD REQUIREMENTS
Large, bold, block letters spelling "Letter Hunt for [NAME]" prominently displayed in the center.
Text must be highly readable for young children - use thick, rounded, child-friendly fonts.
Bright, vibrant colors with strong contrast between text and background.
Themed decorative elements scattered around the text but NOT blocking or overlapping the letters.
Game show atmosphere - exciting, celebratory, fun energy.
Background should complement but not compete with the text readability.
Decorative elements should be small to medium sized and positioned around the edges or corners.
Text should be the clear focal point of the entire composition.

📝 PROMPT STRUCTURE
Each prompt must include the text "Letter Hunt for [NAME]" prominently, art style, themed decorative elements, background description, and text positioning instructions.`;

      case 'signImage':
        return `You are generating prompts for letter hunt educational content featuring a target letter displayed on signs for preschool children (ages 2-5). The letter should appear prominently on actual signs with themed decorative elements around them.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎯 SIGN IMAGE SPECIFIC:
Show the target letter prominently displayed ON colorful street signs, directional signs, or playground signs.
The letter should appear AS TEXT on the actual signs - not floating separately.
Include multiple colorful signs with the letter clearly visible as signage text.
Signs should be child-friendly, bright, and easy to read with the letter as the main text element.
Background can include a simple street, playground, or park setting.
The letter displayed ON the signs should be the main focus, not separate decorative elements.
Include 2-3 themed objects that start with the target letter positioned around the edges.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed on signs, art style, themed decorative elements, background description, and educational objects that start with the letter.`;

      case 'bookImage':
        return `You are generating prompts for letter hunt educational content featuring a target letter displayed on books for preschool children (ages 2-5). The letter should appear prominently on book covers with themed decorative elements around them.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎯 BOOK IMAGE SPECIFIC:
Show the target letter prominently on children's book covers or book spines.
Books should be colorful, thick, and obviously meant for young children.
The letter should be the main design element on the book covers.
Include 2-3 books showing the letter in different fun, educational contexts.
Background can be a cozy reading area or bookshelf setting.
Include 2-3 themed objects that start with the target letter positioned around the edges.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed on books, art style, themed decorative elements, background description, and educational objects that start with the letter.`;

      case 'groceryImage':
        return `You are generating prompts for letter hunt educational content featuring a target letter displayed on grocery items for preschool children (ages 2-5). The letter should appear prominently on products with themed decorative elements around them.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎯 GROCERY STORE SPECIFIC:
Show the target letter prominently on grocery store items like cereal boxes, fruit signs, or product labels.
Include colorful, child-friendly grocery items that clearly display the letter.
The letter should be the main identifying feature on the products.
Background should be a bright, welcoming grocery store or market setting.
Focus on healthy, colorful foods that start with the target letter.
Include 2-3 themed objects that start with the target letter positioned around the edges.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed on grocery items, art style, themed decorative elements, background description, and educational objects that start with the letter.`;

      case 'endingImage':
        return `You are generating prompts for letter hunt educational content featuring a celebratory target letter for preschool children (ages 2-5). This is the concluding image showing the letter in a triumphant way.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎯 ENDING IMAGE SPECIFIC:
This is the concluding image for the Letter Hunt video.
Show a large, bold, uppercase letter prominently displayed in a celebratory, "mission accomplished" way.
The letter should be highly readable for young children - use thick, rounded, child-friendly fonts.
Include happy, congratulatory themed elements around the letter but NOT blocking it.
Background should convey completion and success in finding the letter.
The overall mood should be triumphant and encouraging for the child's learning achievement.
Include 2-3 themed objects that start with the target letter positioned around the edges.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed in a celebratory way, art style, themed decorative elements, background description, and educational objects that start with the letter.`;

      default:
        return baseInstructions;
    }
  }

  private static buildUserPrompt(context: PromptContext, instructions: string, safeZone: string): string {
    const personalization = context.personalization === 'personalized' && context.childName
      ? `This content is personalized for a child named ${context.childName}.`
      : 'This is general content for children.';

    const themeContext = context.additionalContext 
      ? `\nAdditional context: ${context.additionalContext}`
      : '';

    // Remove aspectRatioText since aspect ratio is handled by API parameters, not prompt text
    const artStyleText = context.artStyle ? `\nArt Style: ${context.artStyle}` : '';

    // Extract target letter for letter-hunt template
    let targetLetterText = '';
    let imageTypeText = '';
    if (context.template === 'letter-hunt' && context.additionalContext) {
      const letterMatch = context.additionalContext.match(/Target letter:\s*([A-Z])/i);
      if (letterMatch) {
        targetLetterText = `\nTarget Letter: ${letterMatch[1].toUpperCase()}`;
      }
      // Use imageType if available, fallback to assetType
      const imageType = context.imageType || context.assetType;
      if (imageType) {
        imageTypeText = `\nImage Type: ${imageType}`;
      }
    }

    // Special prompt text for letter-hunt
    let taskText;
    if (context.template === 'letter-hunt') {
      const imageType = context.imageType || context.assetType;
      if (imageType === 'titleCard') {
        const childNameText = context.childName || '[NAME]';
        taskText = `Generate ${context.promptCount || 3} image prompts for "Letter Hunt for ${childNameText}" title cards with a ${context.theme}-themed background targeting ${context.ageRange} year olds. Each image should show the title text prominently with themed decorative elements around it.`;
      } else {
        taskText = `Generate ${context.promptCount || 3} image prompts featuring the target letter prominently for a ${context.theme}-themed letter hunt targeting ${context.ageRange} year olds. Each image should show the letter as the main focus with themed objects that start with that letter.`;
      }
    } else {
      taskText = `Generate ${context.promptCount || 3} image prompts for a ${context.theme} video targeting ${context.ageRange} year olds.`;
    }

    return `${instructions}

CONTEXT:
Theme: ${context.theme}
Age Range: ${context.ageRange}
Template: ${context.template}
Safe Zone: ${safeZone}${artStyleText}${targetLetterText}${imageTypeText}
${personalization}${themeContext}

TASK:
${taskText}

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