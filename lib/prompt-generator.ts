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
  imageType?: 'titleCard' | 'signImage' | 'bookImage' | 'groceryImage' | 'endingVideo' | 'characterImage' | 'sceneImage' | 'bedtime_intro' | 'bedtime_outro' | 'bedtime_scene' | 'letterImageLeftSafe' | 'letterImageRightSafe' | 'introScene' | 'outroScene' | 'nameVideoTitleCard'; // New structured approach
  targetLetter?: string; // Add target letter for letter hunt
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
    targetLetter?: string; // Add target letter to metadata
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

    // Force legacy generation for lullaby with imageType to use asset-specific instructions
    if (context.template === 'lullaby' && context.imageType) {
      console.log('Using legacy generation for lullaby template with imageType to preserve asset-specific context');
      return this.legacyGeneratePrompts(context);
    }

    // Force legacy generation for name-video to ensure proper safe zone context
    if (context.template === 'name-video') {
      console.log('Using legacy generation for name-video template to preserve safe zone context');
      return this.legacyGeneratePrompts(context);
    }

    // Map legacy safe zone names to new system
    const safeZone = this.mapLegacySafeZone(context.safeZone, context.template, context.imageType);
    
    // Convert to new engine context
    const aspectRatio = context.aspectRatio === '9:16' ? '9:16' : '16:9'; // Default to landscape
    const engineContext: PromptEngineContext = {
      theme: context.theme,
      templateType: context.template,
      ageRange: context.ageRange,
      safeZone: safeZone,
      aspectRatio: aspectRatio,
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
          aspectRatio: aspectRatio,
          artStyle: context.artStyle || '2D Pixar Style',
          imageType: context.imageType || context.assetType, // Include the new imageType metadata
          targetLetter: context.targetLetter, // Include target letter in metadata
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

  private static mapLegacySafeZone(safeZone: string | undefined, template: string, imageType?: string): string {
    if (!safeZone) {
      return this.getDefaultSafeZone(template, imageType);
    }

    // Map legacy safe zone names
    const mappings: Record<string, string> = {
      'frame': 'center_safe',
      'not_applicable': 'all_ok'
    };

    return mappings[safeZone] || safeZone;
  }

  private static getDefaultSafeZone(template: string, imageType?: string): string {
    // Handle specific image types that override template defaults
    if (imageType === 'letterImageLeftSafe') {
      return 'left_safe'; // Character on right, text safe on left
    }
    if (imageType === 'letterImageRightSafe') {
      return 'right_safe'; // Character on left, text safe on right
    }
    if (imageType === 'introScene') {
      return 'frame'; // Frame safe zone for intro
    }
    if (imageType === 'outroScene') {
      return 'frame'; // Frame safe zone for outro
    }
    if (imageType === 'nameVideoTitleCard') {
      return 'all_ok'; // No safe zone restrictions for title card
    }

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
    
    // For letter-hunt with custom image types, use custom instructions
    if (context.template === 'letter-hunt' && context.imageType && 
        ['signImage', 'bookImage', 'groceryImage'].includes(context.imageType)) {
      // This is a custom prompt from letter hunt request - use simplified instructions
      instructions = `You are generating prompts for letter hunt educational content for preschool children (ages 2-5). Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎯 CUSTOM PROMPT REQUIREMENTS:
Follow the specific visual requirements provided in the task description EXACTLY.
Focus entirely on the target letter as specified.
Use 2D Pixar animation style with bright, cheerful colors.
No additional objects, text, or elements beyond what's specified.
The letter should be the clear focal point.

📝 PROMPT STRUCTURE
Each prompt must include art style, the specific visual requirements from the task description, and appropriate background as specified.`;
    } else if (context.template === 'name-video' && context.imageType && 
        ['letterImageLeftSafe', 'letterImageRightSafe', 'introScene', 'outroScene', 'nameVideoTitleCard'].includes(context.imageType)) {
      // Handle name-video with specific image types
      instructions = this.getNameVideoAssetInstructions(context.imageType);
    } else if (context.template === 'lullaby') {
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

    const safeZone = context.safeZone || this.getDefaultSafeZone(context.template, context.imageType);
    
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
      const aspectRatio = context.aspectRatio === '9:16' ? '9:16' : '16:9'; // Default to landscape
      return {
        ...parsed,
        metadata: {
          template: context.template,
          safeZone,
          theme: context.theme,
          ageRange: context.ageRange,
          aspectRatio: aspectRatio,
          artStyle: context.artStyle || '2D Pixar Style',
          imageType: context.imageType || context.assetType, // Include the new imageType metadata
          targetLetter: context.targetLetter, // Include target letter in metadata
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
All imagery must be gentle, soothing, and sleep-inducing with darker, rich colors that will make white text clearly visible. Characters must appear calm, peaceful, and ready for sleep.
All imagery must be gentle, non-startling, and soothing.
Themes must be interpreted in the most innocent, cozy, sleepy way possible.

🎨 IMAGE REQUIREMENTS
May include more than one character or object, but keep compositions simple, uncluttered, and clear.
Calm, bedtime poses or states (lying down asleep, curled up peacefully).
Eyes closed in calm rest or sitting sleepily.
Darker, rich color backgrounds only (deep blues, purples, forest greens, warm browns) - NO pastel or light colors.
Background must provide strong contrast for white text overlay.
Bedtime props allowed if calming (blanket, pillow, teddy bear, moon, stars).
Entire image must convey peaceful bedtime concept.
ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image.
NO books with visible text, signs with words, or any readable content.

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
Light colored background suitable for black text overlay - use bright whites, soft creams, or pale solid colors that ensure excellent readability.
No props, toys, or additional decorations unless explicitly requested.
ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image.
NO books, signs, labels, papers, or any objects with text or writing on them.
NO alphabet letters, numbers, symbols, or readable characters of any kind.

� POSITIONING REQUIREMENTS
Follow the safe zone positioning instructions provided in the context exactly.
Pay careful attention to character placement relative to text overlay areas.

�📝 PROMPT STRUCTURE
Each prompt must include art style, theme description with species/breed/type, color details, expression, pose, background description, positioning instructions, and negative instructions.`;
  }

  private static getNameVideoAssetInstructions(imageType: string): string {
    const baseInstructions = this.getNameVideoInstructions();
    
    switch (imageType) {
      case 'letterImageLeftSafe':
        return `You are generating prompts for preschool educational videos with left-side text placement. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting (avoid dark or muted tones).
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 LETTER IMAGE LEFT SAFE REQUIREMENTS
SINGLE character or object only (no groups, pairs, or busy scenes).
Character positioned confidently in the RIGHT HALF of the frame.
Character should face forward or slightly toward the left side.
The LEFT HALF of the image must remain clean and uncluttered for text overlay.
Simple, clear pose (sitting, standing, smiling calmly).
Light colored background suitable for black text overlay - use bright whites, soft creams, or pale solid colors.
No props, toys, or additional decorations in the left text area.
ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image.

📝 PROMPT STRUCTURE
Each prompt must include art style, theme description with species/breed/type, color details, expression, pose, RIGHT-SIDE positioning, background description, and negative instructions.`;

      case 'letterImageRightSafe':
        return `You are generating prompts for preschool educational videos with right-side text placement. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting (avoid dark or muted tones).
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 LETTER IMAGE RIGHT SAFE REQUIREMENTS
SINGLE character or object only (no groups, pairs, or busy scenes).
Character positioned dynamically in the LEFT HALF of the frame.
Character should face forward or slightly toward the right side.
The RIGHT HALF of the image must remain clean and uncluttered for text overlay.
Simple, clear pose (sitting, standing, smiling calmly).
Light colored background suitable for black text overlay - use bright whites, soft creams, or pale solid colors.
No props, toys, or additional decorations in the right text area.
ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image.

📝 PROMPT STRUCTURE
Each prompt must include art style, theme description with species/breed/type, color details, expression, pose, LEFT-SIDE positioning, background description, and negative instructions.`;

      case 'introScene':
        return `You are generating prompts for name-video intro scenes with frame-safe design for preschool children. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting (avoid dark or muted tones).
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 INTRO SCENE REQUIREMENTS
Create ONLY a decorative border or frame design around the outer edges of the image.
The frame should be thematic and welcoming, setting an engaging tone for the video.
The entire center area must remain completely empty and clear for title text placement.
Frame elements should be inviting and introduce the theme effectively.
Use bright, cheerful colors that complement the theme.
Focus exclusively on border design - NO characters, animals, or objects in the center area.
ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image.

📝 PROMPT STRUCTURE
Each prompt must include art style, thematic frame design description, color details, welcoming atmosphere, and negative instructions emphasizing the empty center area.`;

      case 'outroScene':
        return `You are generating prompts for name-video outro scenes with frame-safe design for preschool children. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting (avoid dark or muted tones).
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 OUTRO SCENE REQUIREMENTS
Create ONLY a decorative border or frame design around the outer edges of the image.
The frame should be thematic and provide a sense of closure and accomplishment.
The entire center area must remain completely empty and clear for farewell text placement.
Frame elements should convey completion and encourage the child.
Use warm, satisfying colors that complement the theme.
Focus exclusively on border design - NO characters, animals, or objects in the center area.
ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image.

📝 PROMPT STRUCTURE
Each prompt must include art style, thematic frame design description, color details, closing atmosphere, and negative instructions emphasizing the empty center area.`;

      case 'nameVideoTitleCard':
        return `You are generating prompts for name-video title cards featuring the child's name prominently for preschool children (ages 2-5). Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎨 TITLE CARD REQUIREMENTS
The child's name should be the main focus, displayed prominently in the center.
Text must be highly readable for young children - use thick, rounded, child-friendly fonts.
Bright, vibrant colors with strong contrast between text and background.
Include theme-specific decorative elements that complement but don't compete with the name.
Celebratory, welcoming atmosphere that makes the child feel special.
Background should enhance readability while being visually engaging.
Full composition allowed - no safe zone restrictions.

📝 PROMPT STRUCTURE
Each prompt must include the child's name prominently, art style, theme-specific decorative elements, background description, and celebratory atmosphere.`;

      default:
        return baseInstructions;
    }
  }

  private static getNameShowInstructions(): string {
    return `You are generating prompts for game show-style title cards featuring "THE [NAME] SHOW" in big, bold, readable letters for preschool children (ages 2-5). The text should be the main focus with ONE SINGLE theme-specific decorative item positioned to the side that doesn't block the letters. Content must be bright, exciting, and game show-like while remaining age-appropriate.

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
ONE SINGLE theme-specific decorative item positioned to the side of the text, NOT blocking or overlapping the letters.
Game show atmosphere - exciting, celebratory, fun energy.
Background should complement but not compete with the text readability.
The single decorative item should be positioned in a corner or edge area.
Text should be the clear focal point of the entire composition.

📝 PROMPT STRUCTURE
Each prompt must include the text "THE [NAME] SHOW" prominently, art style, ONE SINGLE theme-specific decorative item, background description, and text positioning instructions.`;
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
Clean, simple design that doesn't distract from the letter.
Educational atmosphere - encouraging learning, discovery, and letter recognition.
Background should complement but not compete with the letter readability.
The letter should be large enough to fill a significant portion of the image.
Letter should be the clear focal point of the entire composition.
Focus entirely on making the letter prominent and easy to read.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed, art style, simple background description. The letter should be the star of the image, not a border or frame.`;
  }

  private static getLetterHuntAssetInstructions(assetType: string): string {
    const baseInstructions = this.getLetterHuntInstructions();
    
    switch (assetType) {
      case 'titleCard':
        return `You are generating prompts for Letter Hunt title cards featuring "Letter Hunt for [NAME]" in big, bold, readable letters for preschool children (ages 2-5). The text should be the main focus with ONE SINGLE theme-specific decorative item positioned to the side that doesn't block the letters. Content must be bright, exciting, and game show-like while remaining age-appropriate.

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
ONE SINGLE theme-specific decorative item positioned to the side of the text, NOT blocking or overlapping the letters.
Game show atmosphere - exciting, celebratory, fun energy.
Background should complement but not compete with the text readability.
The single decorative item should be positioned in a corner or edge area.
Text should be the clear focal point of the entire composition.

📝 PROMPT STRUCTURE
Each prompt must include the text "Letter Hunt for [NAME]" prominently, art style, ONE SINGLE theme-specific decorative item, background description, and text positioning instructions.`;

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
Focus on clean, simple sign designs that make the letter stand out clearly.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed on signs, art style, simple background description. The letter should be the sole focus - no additional objects or decorative elements needed.`;

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
Focus on clean, simple book designs that make the letter stand out clearly.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed on books, art style, simple background description. The letter should be the sole focus - no additional objects or decorative elements needed.`;

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
Focus on clean, simple product designs that make the letter stand out clearly.

📝 PROMPT STRUCTURE
Each prompt must include the target letter prominently displayed on grocery items, art style, simple background description. The letter should be the sole focus - no additional objects or decorative elements needed.`;

      case 'endingVideo':
        return `You are generating prompts for letter hunt educational content featuring a celebratory target letter for preschool children (ages 2-5). This is the concluding video showing the letter in a triumphant way.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting.
All imagery must be gentle and non-startling.
Themes must be interpreted in the most innocent, playful way possible.

🎯 ENDING VIDEO SPECIFIC:
This is the concluding video for the Letter Hunt video.
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

    // Additional context should only be used for admin-added context, not our custom prompts
    const themeContext = context.additionalContext 
      ? `\nAdditional context: ${context.additionalContext}`
      : '';

    // Remove aspectRatioText since aspect ratio is handled by API parameters, not prompt text
    const artStyleText = context.artStyle ? `\nArt Style: ${context.artStyle}` : '';

    // Extract target letter for letter-hunt template
    let targetLetterText = '';
    let imageTypeText = '';
    if (context.template === 'letter-hunt') {
      // Use imageType if available, fallback to assetType
      const imageType = context.imageType || context.assetType;
      if (imageType) {
        imageTypeText = `\nImage Type: ${imageType}`;
      }
      
      // Use targetLetter from context if available
      if (context.targetLetter) {
        targetLetterText = `\nTarget Letter: ${context.targetLetter.toUpperCase()}`;
      }
    }

    // Build task text based on context and imageType
    let taskText;
    if (context.template === 'letter-hunt') {
      const imageType = context.imageType || context.assetType;
      const targetLetter = context.targetLetter || 'A';
      
      if (imageType === 'titleCard') {
        const childNameText = context.childName || '[NAME]';
        taskText = `Generate ${context.promptCount || 3} image prompts for "Letter Hunt for ${childNameText}" title cards with a ${context.theme}-themed background targeting ${context.ageRange} year olds. Each image should show the title text prominently with ONE SINGLE theme-specific item positioned to the side.`;
      } else if (imageType === 'signImage') {
        taskText = `Generate ${context.promptCount || 3} image prompts for: A simple, colorful street sign that displays only the letter "${targetLetter}" in large, bold, clear text. The letter should be the ONLY text visible on the sign - no other words, numbers, or letters. The sign should be bright and cheerful with a clean, simple design in 2D Pixar animation style. Set against a simple background like a park or street scene. Focus entirely on making the letter "${targetLetter}" prominent and easy to read.`;
      } else if (imageType === 'bookImage') {
        taskText = `Generate ${context.promptCount || 3} image prompts for: A children's book with the letter "${targetLetter}" prominently displayed on the front cover in large, bold, clear text. The letter should be the main focus of the book cover - no other text or letters visible. Simple, clean book design in 2D Pixar animation style with bright, cheerful colors. The book can be shown on a simple surface or held, but the letter "${targetLetter}" should be the clear focal point.`;
      } else if (imageType === 'groceryImage') {
        taskText = `Generate ${context.promptCount || 3} image prompts for: A grocery store product (can, box, or jar) with the letter "${targetLetter}" prominently displayed on the label in large, bold, clear text. The letter should be the ONLY visible text on the product - no brand names, other letters, or words. Simple, clean product design in 2D Pixar animation style with bright, cheerful colors. The product should be clearly visible, with the letter "${targetLetter}" as the main focal point.`;
      } else {
        taskText = `Generate ${context.promptCount || 3} image prompts featuring the target letter prominently for a letter hunt targeting ${context.ageRange} year olds. Each image should show the letter as the main focus with clean, simple design.`;
      }
    } else if (context.template === 'name-video' && context.imageType) {
      // Handle specific name-video image types with automatic safe zone handling
      switch (context.imageType) {
        case 'letterImageLeftSafe':
          taskText = `Generate ${context.promptCount || 3} image prompts for a single ${context.theme} character positioned in the right half of the frame, with the left half kept clear for text overlay. The character should be facing forward or slightly toward the left side of the image.`;
          break;
        case 'letterImageRightSafe':
          taskText = `Generate ${context.promptCount || 3} image prompts for a single ${context.theme} character positioned in the left half of the frame, with the right half kept clear for text overlay. The character should be facing forward or slightly toward the right side of the image.`;
          break;
        case 'introScene':
          taskText = `Generate ${context.promptCount || 3} image prompts for intro frame designs with ${context.theme} theme. Create decorative borders around the edges with the center area completely empty for title text. The frame should be welcoming and set an engaging tone.`;
          break;
        case 'outroScene':
          taskText = `Generate ${context.promptCount || 3} image prompts for outro frame designs with ${context.theme} theme. Create decorative borders around the edges with the center area completely empty for farewell text. The frame should convey completion and accomplishment.`;
          break;
        case 'nameVideoTitleCard':
          const childNameText = context.childName || '[CHILD NAME]';
          taskText = `Generate ${context.promptCount || 3} image prompts for title cards featuring "${childNameText}" prominently with ${context.theme} theme. Include theme-specific decorative elements that make the child feel special and celebrated.`;
          break;
        default:
          taskText = `Generate ${context.promptCount || 3} image prompts for a ${context.theme} video targeting ${context.ageRange} year olds.`;
      }
    } else if (context.template === 'lullaby' && context.imageType) {
      // Use asset-specific context for lullaby images to match v2 generator
      let specificContext = '';
      switch (context.imageType) {
        case 'bedtime_intro':
          specificContext = `Create a peaceful nighttime intro scene for a lullaby video with ${context.theme} theme. The scene should be calming and set the mood for bedtime. Include gentle, dreamy elements that would help a child feel relaxed and ready for sleep.`;
          break;
        case 'bedtime_outro':
          specificContext = `Create a serene goodnight conclusion scene for a lullaby video with ${context.theme} theme. The scene should convey a sense of peaceful ending and sweet dreams. Include elements that suggest rest, comfort, and gentle closure to the bedtime story.`;
          break;
        case 'bedtime_scene':
          specificContext = `Create soothing bedtime imagery for a lullaby slideshow with ${context.theme} theme. The scene should be calming and dreamlike, perfect for helping a child drift off to sleep. Include soft, comforting elements that create a peaceful atmosphere.`;
          break;
        default:
          specificContext = `Create peaceful bedtime imagery with ${context.theme} theme suitable for a lullaby video.`;
      }
      taskText = `Generate ${context.promptCount || 3} image prompts with this specific context: ${specificContext} Content must be appropriate for ages ${context.ageRange} with soothing, sleep-inducing colors that will make white text clearly visible.`;
    } else {
      taskText = `Generate ${context.promptCount || 3} image prompts for a ${context.theme} video targeting ${context.ageRange} year olds.`;
    }

    // Only include safe zone in context if it's not 'all_ok' (which means no restrictions)
    const safeZoneText = safeZone !== 'all_ok' ? `\nSafe Zone: ${safeZone}` : '';
    
    // Add safe zone descriptions for proper positioning context
    let safeZoneDescription = '';
    if (safeZone !== 'all_ok') {
      switch (safeZone) {
        case 'left_safe':
          safeZoneDescription = '\nCharacter positioned confidently in the right half of the frame, creating a natural visual flow from left to right. The left half of the image maintains clean, uncluttered space with subtle background elements that won\'t compete with overlaid content.';
          break;
        case 'right_safe':
          safeZoneDescription = '\nCharacter positioned dynamically in the left half of the frame, with the character facing toward or engaging with the right side of the composition. The right half maintains open, clean space suitable for content overlay.';
          break;
        case 'center_safe':
          safeZoneDescription = '\nCreate ONLY a decorative border or frame design around the outer edges of the image. The frame should be thematic and ornamental. The entire center area must remain completely empty and clear for text placement. Focus exclusively on the border design - NO characters, animals, or objects should be placed anywhere in the image.';
          break;
        case 'intro_safe':
          safeZoneDescription = '\nCreate a decorative border or frame design around the outer edges of the image with an opening or clear space in the upper center area for title text. The frame should be thematic and welcoming. The upper-center area (approximately 40% of the image) must remain clear for title placement. Focus on border design - NO characters, animals, or objects should be placed anywhere in the image.';
          break;
        case 'outro_safe':
          safeZoneDescription = '\nCreate a peaceful decorative border or frame design around the outer edges of the image with an opening or clear space in the center area for farewell messages and end credits. The frame should be thematic and provide closure. The center area (approximately 50% of the image) must remain clear for text placement. Focus exclusively on border design - NO characters, animals, or objects should be placed anywhere in the image.';
          break;
        case 'slideshow':
          safeZoneDescription = '\nComplete, engaging composition that fills the frame beautifully. Designed to be viewed as standalone imagery in a slideshow format, with balanced visual weight and clear focal points.';
          break;
        case 'frame':
          safeZoneDescription = '\nCreate a beautiful decorative frame or border design around the outer edges of the image with the center area completely empty for title text overlay. The frame should be thematic and peaceful. The entire center area must remain completely clear and empty for text placement. Focus on creating an elegant, soothing frame design around the edges only.';
          break;
      }
    }

    return `${instructions}

CONTEXT:
Theme: ${context.theme}
Age Range: ${context.ageRange}
Template: ${context.template}${safeZoneText}${artStyleText}${targetLetterText}${imageTypeText}
${personalization}${themeContext}${safeZoneDescription}

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
- Each prompt must follow the exact format and safety requirements above${safeZone !== 'all_ok' ? '\n- Include the safe zone placement instructions in each image prompt' : ''}
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