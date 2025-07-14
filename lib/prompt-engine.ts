import OpenAI from 'openai';

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

export interface PromptEngineContext {
  theme: string;
  templateType: string;
  ageRange: string;
  safeZone: string;
  aspectRatio: '16:9' | '9:16';
  artStyle: string;
  promptCount: number;
  childName?: string;
  additionalContext?: string;
}

export interface ThemeVariation {
  category: string;
  variants: string[];
  ageAppropriate: Record<string, string[]>; // age range -> filtered variants
  educationalValue: number; // 1-10 scale
}

export interface SafeZoneRule {
  id: string;
  description: string;
  compositionInstructions: string;
  negativeInstructions: string;
  templateCompatibility: string[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  baseInstructions: string;
  supportedSafeZones: string[];
  contentRules: string[];
  artStyleModifiers: Record<string, string>;
}

export class PromptEngine {
  private static readonly THEME_VARIATIONS: Record<string, ThemeVariation> = {
    dogs: {
      category: 'animals',
      variants: [
        'Golden Retriever', 'Beagle', 'Pug', 'Border Collie', 'Husky', 
        'Labrador', 'Corgi', 'Poodle', 'Bulldog', 'German Shepherd',
        'Chihuahua', 'Dachshund', 'Shih Tzu', 'Boxer', 'Cocker Spaniel'
      ],
      ageAppropriate: {
        '2-4': ['Golden Retriever', 'Beagle', 'Pug', 'Labrador', 'Corgi', 'Poodle'],
        '3-5': ['Golden Retriever', 'Beagle', 'Pug', 'Border Collie', 'Husky', 'Labrador', 'Corgi', 'Poodle'],
        '4-6': ['Golden Retriever', 'Beagle', 'Pug', 'Border Collie', 'Husky', 'Labrador', 'Corgi', 'Poodle', 'Bulldog'],
        '5-7': ['Golden Retriever', 'Beagle', 'Pug', 'Border Collie', 'Husky', 'Labrador', 'Corgi', 'Poodle', 'Bulldog', 'German Shepherd']
      },
      educationalValue: 8
    },
    cats: {
      category: 'animals',
      variants: [
        'Persian cat', 'Siamese cat', 'Maine Coon', 'British Shorthair', 'Ragdoll cat',
        'Tabby cat', 'Calico cat', 'Orange tabby', 'Tuxedo cat', 'Russian Blue'
      ],
      ageAppropriate: {
        '2-4': ['Persian cat', 'Tabby cat', 'Calico cat', 'Orange tabby', 'Tuxedo cat'],
        '3-5': ['Persian cat', 'Siamese cat', 'Tabby cat', 'Calico cat', 'Orange tabby', 'Tuxedo cat'],
        '4-6': ['Persian cat', 'Siamese cat', 'Maine Coon', 'British Shorthair', 'Ragdoll cat', 'Tabby cat'],
        '5-7': ['Persian cat', 'Siamese cat', 'Maine Coon', 'British Shorthair', 'Ragdoll cat', 'Tabby cat', 'Russian Blue']
      },
      educationalValue: 7
    },
    space: {
      category: 'educational',
      variants: [
        'friendly astronaut', 'colorful rocket ship', 'smiling planet Earth', 'twinkling stars',
        'cheerful moon', 'space station', 'solar system', 'friendly alien', 'satellite', 'comet'
      ],
      ageAppropriate: {
        '2-4': ['friendly astronaut', 'colorful rocket ship', 'smiling planet Earth', 'twinkling stars', 'cheerful moon'],
        '3-5': ['friendly astronaut', 'colorful rocket ship', 'smiling planet Earth', 'twinkling stars', 'cheerful moon', 'space station'],
        '4-6': ['friendly astronaut', 'colorful rocket ship', 'smiling planet Earth', 'twinkling stars', 'cheerful moon', 'space station', 'solar system'],
        '5-7': ['friendly astronaut', 'colorful rocket ship', 'smiling planet Earth', 'twinkling stars', 'cheerful moon', 'space station', 'solar system', 'friendly alien']
      },
      educationalValue: 10
    },
    ocean: {
      category: 'nature',
      variants: [
        'friendly dolphin', 'colorful fish', 'sea turtle', 'octopus', 'seahorse',
        'whale', 'starfish', 'coral reef', 'jellyfish', 'crab', 'submarine'
      ],
      ageAppropriate: {
        '2-4': ['friendly dolphin', 'colorful fish', 'sea turtle', 'seahorse', 'starfish'],
        '3-5': ['friendly dolphin', 'colorful fish', 'sea turtle', 'octopus', 'seahorse', 'whale', 'starfish'],
        '4-6': ['friendly dolphin', 'colorful fish', 'sea turtle', 'octopus', 'seahorse', 'whale', 'starfish', 'coral reef'],
        '5-7': ['friendly dolphin', 'colorful fish', 'sea turtle', 'octopus', 'seahorse', 'whale', 'starfish', 'coral reef', 'jellyfish', 'submarine']
      },
      educationalValue: 9
    },
    farm: {
      category: 'animals',
      variants: [
        'friendly cow', 'fluffy sheep', 'pink pig', 'brown horse', 'white duck',
        'red chicken', 'playful goat', 'barn owl', 'farm cat', 'rooster'
      ],
      ageAppropriate: {
        '2-4': ['friendly cow', 'fluffy sheep', 'pink pig', 'white duck', 'red chicken'],
        '3-5': ['friendly cow', 'fluffy sheep', 'pink pig', 'brown horse', 'white duck', 'red chicken', 'playful goat'],
        '4-6': ['friendly cow', 'fluffy sheep', 'pink pig', 'brown horse', 'white duck', 'red chicken', 'playful goat', 'barn owl'],
        '5-7': ['friendly cow', 'fluffy sheep', 'pink pig', 'brown horse', 'white duck', 'red chicken', 'playful goat', 'barn owl', 'farm cat', 'rooster']
      },
      educationalValue: 8
    },
    forest: {
      category: 'nature',
      variants: [
        'friendly bear', 'cute rabbit', 'wise owl', 'playful squirrel', 'gentle deer',
        'colorful butterfly', 'busy bee', 'red fox', 'hedgehog', 'raccoon'
      ],
      ageAppropriate: {
        '2-4': ['cute rabbit', 'wise owl', 'playful squirrel', 'colorful butterfly', 'busy bee'],
        '3-5': ['friendly bear', 'cute rabbit', 'wise owl', 'playful squirrel', 'gentle deer', 'colorful butterfly'],
        '4-6': ['friendly bear', 'cute rabbit', 'wise owl', 'playful squirrel', 'gentle deer', 'colorful butterfly', 'red fox'],
        '5-7': ['friendly bear', 'cute rabbit', 'wise owl', 'playful squirrel', 'gentle deer', 'colorful butterfly', 'red fox', 'hedgehog', 'raccoon']
      },
      educationalValue: 9
    },
    monsters: {
      category: 'fantasy',
      variants: [
        'friendly purple monster', 'happy green monster', 'smiling blue monster', 'cute orange monster',
        'cheerful pink monster', 'gentle yellow monster', 'kind red monster', 'playful teal monster',
        'warm brown monster', 'soft lavender monster'
      ],
      ageAppropriate: {
        '2-4': ['friendly purple monster', 'happy green monster', 'smiling blue monster', 'cute orange monster'],
        '3-5': ['friendly purple monster', 'happy green monster', 'smiling blue monster', 'cute orange monster', 'cheerful pink monster', 'gentle yellow monster'],
        '4-6': ['friendly purple monster', 'happy green monster', 'smiling blue monster', 'cute orange monster', 'cheerful pink monster', 'gentle yellow monster', 'kind red monster'],
        '5-7': ['friendly purple monster', 'happy green monster', 'smiling blue monster', 'cute orange monster', 'cheerful pink monster', 'gentle yellow monster', 'kind red monster', 'playful teal monster']
      },
      educationalValue: 8
    }
  };

  private static readonly SAFE_ZONE_RULES: Record<string, SafeZoneRule> = {
    left_safe: {
      id: 'left_safe',
      description: 'Character on right side, left area clear for text',
      compositionInstructions: 'Character positioned confidently in the right half of the frame, creating a natural visual flow from left to right. The left half of the image maintains clean, uncluttered space with subtle background elements that won\'t compete with overlaid content.',
      negativeInstructions: 'No visual elements, text, or busy details in the left half of the composition. Avoid central positioning or elements that extend into the left half of the frame.',
      templateCompatibility: ['name-video', 'educational']
    },
    right_safe: {
      id: 'right_safe',
      description: 'Character on left side, right area clear for text',
      compositionInstructions: 'Character positioned dynamically in the left half of the frame, with the character facing toward or engaging with the right side of the composition. The right half maintains open, clean space suitable for content overlay.',
      negativeInstructions: 'No visual elements, text, or complex details in the right half of the composition. Avoid character elements extending into the right half of the frame.',
      templateCompatibility: ['name-video', 'educational']
    },
    center_safe: {
      id: 'center_safe',
      description: 'Decorative frame with completely empty center for name insertion',
      compositionInstructions: 'Create ONLY a decorative border or frame design around the outer edges of the image. The frame should be thematic (e.g., paw prints for dogs, leaves for forest themes, stars for space themes) and ornamental. The entire center area must remain completely empty and clear for text placement. Focus exclusively on the border design - NO characters, animals, or objects should be placed anywhere in the image.',
      negativeInstructions: 'Absolutely NO characters, animals, people, or main subject elements anywhere in the image. NO visual elements, objects, or decorative details in the center area. The image should consist ONLY of a decorative border/frame around the edges. The center must be completely empty with solid background color.',
      templateCompatibility: ['name-video', 'educational', 'lullaby', 'letter-hunt']
    },
    intro_safe: {
      id: 'intro_safe',
      description: 'Opening frame with decorative border and space for title',
      compositionInstructions: 'Create a decorative border or frame design around the outer edges of the image with an opening or clear space in the upper center area for title text. The frame should be thematic and welcoming (e.g., paw prints for dogs, stars for space themes, leaves for forest themes) and establish the video\'s mood. The upper-center area (approximately 40% of the image) must remain clear for title placement. Focus on border design - NO characters, animals, or objects should be placed anywhere in the image.',
      negativeInstructions: 'Absolutely NO characters, animals, people, or main subject elements anywhere in the image. NO visual elements, objects, or decorative details in the upper-center title area. The image should consist ONLY of a decorative border/frame around the edges with clear space for title text. Avoid overwhelming details or busy compositions.',
      templateCompatibility: ['name-video', 'lullaby', 'educational']
    },
    outro_safe: {
      id: 'outro_safe',
      description: 'Closing frame with decorative border and space for farewell message',
      compositionInstructions: 'Create a peaceful decorative border or frame design around the outer edges of the image with an opening or clear space in the center area for farewell messages and end credits. The frame should be thematic and provide closure (e.g., sleepy elements for lullabies, graduation caps for educational content). The center area (approximately 50% of the image) must remain clear for text placement. Focus exclusively on border design - NO characters, animals, or objects should be placed anywhere in the image.',
      negativeInstructions: 'Absolutely NO characters, animals, people, or main subject elements anywhere in the image. NO visual elements, objects, or decorative details in the center text area. The image should consist ONLY of a decorative border/frame around the edges with clear space for farewell text. Avoid jarring or overly energetic elements.',
      templateCompatibility: ['name-video', 'lullaby', 'educational']
    },
    slideshow: {
      id: 'slideshow',
      description: 'Full frame content for slideshow presentation',
      compositionInstructions: 'Complete, engaging composition that fills the frame beautifully. Designed to be viewed as standalone imagery in a slideshow format, with balanced visual weight and clear focal points.',
      negativeInstructions: 'Avoid empty spaces or incomplete compositions. No embedded text or elements that assume overlay content.',
      templateCompatibility: ['lullaby', 'educational', 'name-show', 'letter-hunt']
    },
    frame: {
      id: 'frame',
      description: 'Frame composition with center area empty for title text',
      compositionInstructions: 'Create a beautiful decorative frame or border design around the outer edges of the image with the center area completely empty for title text overlay. The frame should be thematic and peaceful, perfectly suited for bedtime or lullaby content (e.g., stars and moons, soft clouds, gentle flowers, sleepy animals as border elements). The entire center area must remain completely clear and empty for text placement. Focus on creating an elegant, soothing frame design around the edges only.',
      negativeInstructions: 'Absolutely NO characters, animals, people, or main subject elements anywhere in the image center. NO visual elements, objects, or decorative details in the center area where title text will be placed. The image should consist ONLY of a decorative border/frame around the outer edges. The center must be completely empty with solid background color.',
      templateCompatibility: ['lullaby']
    },
    all_ok: {
      id: 'all_ok',
      description: 'General composition without specific restrictions',
      compositionInstructions: 'Balanced, engaging composition with creative freedom. Character or subject positioned naturally within the frame to create visual interest and appeal.',
      negativeInstructions: 'Avoid overly busy or chaotic compositions. Maintain age-appropriate, clear, and appealing visual presentation.',
      templateCompatibility: ['name-video', 'lullaby', 'educational', 'custom', 'name-show', 'letter-hunt']
    }
  };

  private static readonly TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
    'name-video': {
      id: 'name-video',
      name: 'Name Video',
      baseInstructions: `You are creating prompts for educational children's videos featuring single characters or objects. Content must be 100% appropriate for ages 2-5 years old with bright, warm, inviting colors. Characters must always appear happy, calm, and friendly. All imagery must be gentle and non-startling.`,
      supportedSafeZones: ['left_safe', 'right_safe', 'center_safe', 'intro_safe', 'outro_safe', 'all_ok'],
      contentRules: [
        'Single character or object only (no groups or busy scenes)',
        'Simple, clear pose (sitting, standing, smiling calmly)',
        'Light colored background suitable for black text overlay - use bright whites, soft creams, or pale solid colors that ensure excellent readability',
        'No props, toys, or additional decorations unless explicitly requested',
        'ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image',
        'NO books, signs, labels, papers, or any objects with text or writing on them',
        'NO alphabet letters, numbers, symbols, or readable characters of any kind'
      ],
      artStyleModifiers: {
        '2D Pixar Style': 'Rendered in vibrant 2D Pixar animation style with smooth, rounded features and expressive but gentle character design',
        'Watercolor': 'Created in soft watercolor technique with gentle color bleeds and organic, flowing brushstrokes',
        'Crayon Drawing': 'Illustrated in child-like crayon drawing style with vibrant, waxy textures and simple, endearing forms'
      }
    },
    namevideo: {
      id: 'namevideo',
      name: 'NameVideo',
      baseInstructions: `You are creating prompts for personalized children's name videos featuring single characters or objects. Content must be 100% appropriate for ages 2-5 years old with bright, warm, inviting colors. Characters must always appear happy, calm, and friendly. All imagery must be gentle and non-startling.`,
      supportedSafeZones: ['left_safe', 'right_safe', 'center_safe', 'intro_safe', 'outro_safe', 'all_ok'],
      contentRules: [
        'Single character or object only (no groups or busy scenes)',
        'Simple, clear pose (sitting, standing, smiling calmly)',
        'Light colored background suitable for black text overlay - use bright whites, soft creams, or pale solid colors that ensure excellent readability',
        'No props, toys, or additional decorations unless explicitly requested',
        'ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image',
        'NO books, signs, labels, papers, or any objects with text or writing on them',
        'NO alphabet letters, numbers, symbols, or readable characters of any kind'
      ],
      artStyleModifiers: {
        '2D Pixar Style': 'Rendered in vibrant 2D Pixar animation style with smooth, rounded features and expressive but gentle character design',
        'Watercolor': 'Created in soft watercolor technique with gentle color bleeds and organic, flowing brushstrokes',
        'Crayon Drawing': 'Illustrated in child-like crayon drawing style with vibrant, waxy textures and simple, endearing forms'
      }
    },
    'name-show': {
      id: 'name-show',
      name: 'Name Show',
      baseInstructions: `You are creating prompts for game show-style title cards featuring "THE [NAME] SHOW" in big, bold, readable letters for preschool children (ages 2-5). The text should be the main focus with themed decorative elements around it that don't block the letters. Content must be bright, exciting, and game show-like while remaining age-appropriate.`,
      supportedSafeZones: ['all_ok', 'slideshow'],
      contentRules: [
        'Large, bold, block letters spelling "THE [NAME] SHOW" prominently displayed in the center',
        'Text must be highly readable for young children - use thick, rounded, child-friendly fonts',
        'Bright, vibrant colors with strong contrast between text and background',
        'Themed decorative elements scattered around the text but NOT blocking or overlapping the letters',
        'Game show atmosphere - exciting, celebratory, fun energy',
        'Background should complement but not compete with the text readability',
        'Decorative elements should be small to medium sized and positioned around the edges or corners',
        'Text should be the clear focal point of the entire composition'
      ],
      artStyleModifiers: {
        '2D Pixar Style': 'Rendered in vibrant 2D Pixar animation style with bold, chunky letters and colorful themed decorations',
        'Cartoon Style': 'Created in bright cartoon style with thick outlined letters and fun decorative elements',
        'Game Show Style': 'Illustrated in classic game show aesthetic with shiny, dimensional letters and celebratory themed decorations'
      }
    },
    'lullaby': {
      id: 'lullaby',
      name: 'Lullaby Video',
      baseInstructions: `You are creating prompts for calming bedtime lullaby videos. Content must convey peaceful, sleepy themes suitable for ages 2-5 years old. All imagery must be gentle, soothing, and sleep-inducing with darker, rich colors that will make white text clearly visible. Characters must appear calm, peaceful, and ready for sleep.`,
      supportedSafeZones: ['slideshow', 'center_safe', 'intro_safe', 'outro_safe', 'frame'],
      contentRules: [
        'Calm, bedtime poses or states (lying down asleep, curled up peacefully)',
        'Eyes closed in calm rest or sitting sleepily',
        'Darker, rich color backgrounds only (deep blues, purples, forest greens, warm browns) - NO pastel or light colors',
        'Background must provide strong contrast for white text overlay',
        'Bedtime props allowed if calming (blanket, pillow, teddy bear, moon, stars)',
        'Entire image must convey peaceful bedtime concept',
        'ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image',
        'NO books with visible text, signs with words, or any readable content'
      ],
      artStyleModifiers: {
        '2D Pixar Style': 'Rendered in gentle 2D Pixar style with soft lighting, muted colors, and peaceful expressions',
        'Watercolor': 'Created in dreamy watercolor style with soft, flowing colors and sleepy, tranquil atmosphere',
        'Felt Art': 'Illustrated in cozy felt art style with soft textures and warm, comforting appearance'
      }
    },
    'educational': {
      id: 'educational',
      name: 'Educational Content',
      baseInstructions: `You are creating prompts for educational children's content focusing on learning and discovery. Content must be engaging and informative while remaining age-appropriate for the target audience. Characters should appear curious, friendly, and excited about learning.`,
      supportedSafeZones: ['left_safe', 'right_safe', 'center_safe', 'intro_safe', 'outro_safe', 'slideshow', 'all_ok'],
      contentRules: [
        'Educational or learning-focused subjects',
        'Clear, identifiable objects or characters',
        'Bright, engaging colors that promote learning',
        'Simple compositions that highlight educational elements',
        'Age-appropriate complexity and detail level',
        'ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CONTENT anywhere in the image',
        'NO books with visible text, educational charts with words, or any readable content'
      ],
      artStyleModifiers: {
        '2D Pixar Style': 'Rendered in bright, engaging 2D Pixar style that promotes curiosity and learning',
        'Storybook Illustration': 'Created in classic storybook illustration style with educational appeal',
        'Digital Cartoon': 'Illustrated in modern digital cartoon style with clear, educational presentation'
      }
    },
    'letter-hunt': {
      id: 'letter-hunt',
      name: 'Letter Hunt',
      baseInstructions: `You are creating prompts for letter hunt educational content featuring a target letter prominently displayed for preschool children (ages 2-5). The letter should be the main focus and star of the image, similar to how "THE [NAME] SHOW" text is featured in name show content. Include themed decorative elements and learning objects around the letter but never blocking it.`,
      supportedSafeZones: ['all_ok', 'slideshow'],
      contentRules: [
        'Large, bold, uppercase letter prominently displayed as the central focal point of the image',
        'Letter must be highly readable for young children - use thick, rounded, child-friendly fonts',
        'Bright, vibrant colors with strong contrast between letter and background',
        'Letter should fill a significant portion of the image space, similar to title text prominence',
        'Include 2-3 themed objects that start with the target letter positioned around the edges',
        'Educational atmosphere - encouraging learning, discovery, and letter recognition',
        'Background should complement but not compete with the letter readability',
        'Decorative elements should enhance the letter\'s prominence, not distract from it',
        'The letter is the STAR of the image, not a border or frame element'
      ],
      artStyleModifiers: {
        '2D Pixar Style': 'Rendered in vibrant 2D Pixar animation style with a bold, chunky letter as the centerpiece and colorful themed learning objects around it',
        'Cartoon Style': 'Created in bright cartoon style with a thick outlined letter as the main character and fun educational decorative elements supporting it',
        'Educational Style': 'Illustrated in child-friendly educational style with a clear, dimensional letter taking center stage and themed learning objects as supporting cast'
      }
    }
  };

  static async generatePrompts(context: PromptEngineContext): Promise<{
    images: string[];
    metadata: {
      template: string;
      safeZone: string;
      theme: string;
      ageRange: string;
      aspectRatio: string;
      artStyle: string;
      variations: string[];
      generatedAt: string;
    };
  }> {
    try {
      // Get theme variations
      const themeVariations = this.getThemeVariations(context.theme, context.ageRange);
      
      // Get template definition
      const template = this.TEMPLATE_DEFINITIONS[context.templateType];
      if (!template) {
        throw new Error(`Unknown template type: ${context.templateType}`);
      }

      // Get safe zone rule
      const safeZoneRule = this.SAFE_ZONE_RULES[context.safeZone];
      if (!safeZoneRule) {
        throw new Error(`Unknown safe zone: ${context.safeZone}`);
      }

      // Validate safe zone compatibility
      if (!safeZoneRule.templateCompatibility.includes(context.templateType)) {
        throw new Error(`Safe zone ${context.safeZone} is not compatible with template ${context.templateType}`);
      }

      // Generate prompts using the new system
      const prompts = await this.generateVariedPrompts(context, template, safeZoneRule, themeVariations);

      return {
        images: prompts,
        metadata: {
          template: context.templateType,
          safeZone: context.safeZone,
          theme: context.theme,
          ageRange: context.ageRange,
          aspectRatio: context.aspectRatio,
          artStyle: context.artStyle,
          variations: themeVariations,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error in PromptEngine.generatePrompts:', error);
      throw error;
    }
  }

  private static getThemeVariations(theme: string, ageRange: string): string[] {
    const normalizedTheme = theme.toLowerCase().trim();
    
    // Direct match
    if (this.THEME_VARIATIONS[normalizedTheme]) {
      const themeData = this.THEME_VARIATIONS[normalizedTheme];
      const availableVariations = themeData.ageAppropriate[ageRange] || themeData.variants.slice(0, 6);
      // Randomize the order and return up to 6 variations
      return this.shuffleArray([...availableVariations]).slice(0, 6);
    }

    // Partial match
    for (const [key, themeData] of Object.entries(this.THEME_VARIATIONS)) {
      if (normalizedTheme.includes(key) || key.includes(normalizedTheme)) {
        const availableVariations = themeData.ageAppropriate[ageRange] || themeData.variants.slice(0, 6);
        // Randomize the order and return up to 6 variations
        return this.shuffleArray([...availableVariations]).slice(0, 6);
      }
    }

    // Fallback - create semantic variations
    return this.generateSemanticVariations(theme, ageRange);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static generateSemanticVariations(theme: string, ageRange: string): string[] {
    // Simple fallback variations for unknown themes
    const baseVariations = [
      `friendly ${theme}`,
      `colorful ${theme}`,
      `happy ${theme}`,
      `cute ${theme}`,
      `gentle ${theme}`,
      `playful ${theme}`
    ];

    // Randomize and limit to 4 variations for unknown themes
    return this.shuffleArray(baseVariations).slice(0, 4);
  }

  private static async generateVariedPrompts(
    context: PromptEngineContext,
    template: TemplateDefinition,
    safeZoneRule: SafeZoneRule,
    variations: string[]
  ): Promise<string[]> {
    const systemPrompt = `You are an expert at creating detailed image prompts for preschool children's educational content (ages 2-7). When generating image prompts, you must ALWAYS include explicit instructions that the generated images contain ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, SIGNS, LABELS, OR ANY WRITTEN CONTENT of any kind. This is critical for text overlay functionality. You must follow the provided instructions EXACTLY and return ONLY valid JSON.`;

    const artStyleModifier = template.artStyleModifiers[context.artStyle] || 
      `Rendered in ${context.artStyle} with child-friendly appeal`;

    const userPrompt = `${template.baseInstructions}

COMPOSITION REQUIREMENTS:
${safeZoneRule.compositionInstructions}    ${context.safeZone === 'center_safe' ? `
IMPORTANT: You are creating ONLY a decorative border/frame design. NO characters or animals should appear anywhere in the image. Focus exclusively on creating thematic border elements (e.g., paw prints for dogs, stars for space, leaves for nature themes) around the edges only.
` : context.safeZone === 'intro_safe' ? `
IMPORTANT: You are creating ONLY a decorative border/frame design with space for title text. NO characters or animals should appear anywhere in the image. Focus exclusively on creating thematic border elements around the edges with clear upper-center area for title placement.
` : context.safeZone === 'outro_safe' ? `
IMPORTANT: You are creating ONLY a decorative border/frame design with space for farewell text. NO characters or animals should appear anywhere in the image. Focus exclusively on creating thematic border elements around the edges with clear center area for closing text.
` : ''}

CONTENT RULES:
${template.contentRules.map(rule => `• ${rule}`).join('\n')}

NEGATIVE INSTRUCTIONS:
${safeZoneRule.negativeInstructions}
${context.templateType === 'name-show' ? `
• Decorative elements must NOT block, overlap, or obscure the main text "THE [NAME] SHOW"
• Text must remain clearly readable - avoid busy backgrounds behind the letters
• No additional text or words beyond "THE [NAME] SHOW"
• Decorative elements should be positioned around the edges, corners, or scattered in non-text areas
` : `
• ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, OR WRITTEN CHARACTERS ANYWHERE IN THE IMAGE
• NO signs, labels, books, papers, or any items with text or writing on them
• NO alphabet letters, numbers, symbols, or any form of written language
• NO books with visible text, signs with words, or any readable content
`}
• NO scary, frightening, or intense imagery
• NO violence, conflict, or aggressive behavior
• NO dark themes, shadows, or ominous elements

ART STYLE:
${artStyleModifier}

MANDATORY PROMPT ADDITIONS:
${context.templateType === 'name-show' ? `
Every single image prompt you generate MUST include these exact phrases:
- "large bold text reading 'THE ${context.childName?.toUpperCase() || '[NAME]'} SHOW' prominently displayed in the center"
- "text is highly readable for preschool children ages ${context.ageRange}"
- "themed decorative elements from ${context.theme} scattered around but not blocking the text"
- "game show title card style for children"
` : `
Every single image prompt you generate MUST include these exact phrases:
- "absolutely no text, letters, words, numbers, signs, labels, or written content anywhere in the image"
- "completely text-free image for preschool children ages ${context.ageRange}"
- "no books with visible text, no signs with words, no readable content of any kind"
`}

THEME VARIATIONS TO USE:
Create ${context.promptCount} different prompts using these variations: ${variations.join(', ')}
${['center_safe', 'intro_safe', 'outro_safe'].includes(context.safeZone) ? 
  'Each prompt should create a BORDER/FRAME design themed around the variation (e.g., paw prints for dogs, rocket shapes for space, etc.)' : 
  context.templateType === 'name-show' ?
  'Each prompt should feature themed decorative elements from the variation scattered around the main text "THE [NAME] SHOW" (e.g., small dogs around the text for dogs theme, space items for space theme, etc.)' :
  'Each prompt should feature a DIFFERENT variation to ensure variety.'
}

IMPORTANT: Make each prompt significantly different by varying:
• Character poses and expressions (sitting, lying, standing, playing, etc.)
• Background colors and settings
• Specific breed/type characteristics  
• Environmental details and mood
• Lighting and atmosphere
• Character accessories or natural elements

TARGET DETAILS:
• Age Range: ${context.ageRange} years old
• Template: ${template.name}
• Composition Style: ${safeZoneRule.description}
${context.childName ? `• Child Name Context: ${context.childName}` : ''}
${context.additionalContext ? `• Additional Context: ${context.additionalContext}` : ''}

TASK:
Generate ${context.promptCount} detailed image prompts. Each prompt must:
1. Use a DIFFERENT theme variation from the list above
2. Follow all composition and safety requirements
3. Include the art style specification
4. Be complete and detailed for image generation
${context.templateType === 'name-show' ? `5. PROMINENTLY FEATURE the text "THE ${context.childName?.toUpperCase() || '[NAME]'} SHOW" in large, readable letters
6. Include themed decorative elements that complement but don't block the text` : `5. CONTAIN ABSOLUTELY NO TEXT, LETTERS, WORDS, OR WRITTEN CONTENT OF ANY KIND`}

${context.templateType === 'name-show' ? `
CRITICAL TEXT REQUIREMENT: The main text "THE ${context.childName?.toUpperCase() || '[NAME]'} SHOW" must be prominently displayed and highly readable for young children. Themed decorative elements should enhance the design without blocking or interfering with text readability.
` : `
CRITICAL TEXT RESTRICTION: The generated images must be completely free of any text, letters, numbers, words, signs, labels, books with visible text, or any form of written language. This is essential for proper text overlay functionality.
`}

Return a JSON object with this exact structure:
{
  "images": [
    "Complete detailed prompt for image 1 using first variation",
    "Complete detailed prompt for image 2 using second variation",
    "Complete detailed prompt for image 3 using third variation"
  ]
}

CRITICAL: Return ONLY the JSON object, no additional text or explanation.`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.8, // Increased for more variation
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.images || [];
  }

  static getAvailableTemplates(): string[] {
    return Object.keys(this.TEMPLATE_DEFINITIONS);
  }

  static getSafeZonesForTemplate(templateType: string): string[] {
    const template = this.TEMPLATE_DEFINITIONS[templateType];
    return template ? template.supportedSafeZones : [];
  }

  static getThemeCategories(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    for (const [theme, data] of Object.entries(this.THEME_VARIATIONS)) {
      if (!categories[data.category]) {
        categories[data.category] = [];
      }
      categories[data.category].push(theme);
    }
    
    return categories;
  }
}
