import OpenAI from 'openai';

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PromptContext {
  childName?: string;
  theme: string;
  ageRange: string;
  template: 'lullaby' | 'name-video';
  personalization?: 'general' | 'personalized';
  safeZone?: 'left_safe' | 'right_safe' | 'center_safe' | 'frame' | 'slideshow';
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
    generatedAt: string;
  };
}

export class PromptGenerator {
  private static readonly LULLABY_INSTRUCTIONS = `You are generating prompts for preschool lullaby videos with a calming bedtime theme. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
NO dark themes, shadows, or ominous elements.
NO realistic depictions of dangerous situations.
Characters and imagery must ALWAYS appear calm, peaceful, and friendly.
Colors must be soft, warm, and inviting (avoid dark, overly saturated, or harsh tones).
All imagery must be gentle, non-startling, and soothing.
NO sudden movements, loud implications, or jarring visual themes.
Themes must be interpreted in the most innocent, cozy, sleepy way possible.

🎨 IMAGE REQUIREMENTS
May include more than one character or object, but keep compositions simple, uncluttered, and clear.
Calm, bedtime poses or states, such as:
- Lying down asleep
- Curled up peacefully
- Eyes closed in calm rest
- Sitting sleepily with a blanket or pillow
Light, soft solid color backgrounds only.
No gradients, patterns, detailed scenery, or environmental complexity.
Must be a single light, soothing color that ensures black text is readable (for slideshow) or contrasts with the frame (for intro/outro).
Bedtime props are allowed if calming and simple (e.g. blanket, pillow, teddy bear, moon, stars).
No text or letters included in the image itself.

🛌 BEDTIME THEME REQUIREMENTS
The entire image must convey a peaceful bedtime or sleeping concept:
Characters or items are asleep, resting, or in quiet bedtime preparation.
Eyes closed if appropriate (e.g. animals, people).
For objects (like moon, stars, sun), depict them with closed eyes and peaceful expressions.
For animals, show them curled up or lying down calmly.
For human-like characters, show them in pajamas or tucked into bed if applicable.

🖼️ SAFE ZONE REQUIREMENTS
Incorporate these placement rules directly into each prompt:
FRAME (intro/outro): The image acts as a decorative frame around the edges, leaving the center area completely empty for a programmatically added title or ending text. No elements should enter or overlap the center area. The edges can have bedtime-themed decorations, characters, or objects.
SLIDESHOW: The image is a simple, calm bedtime scene filling the entire frame. Composition must remain uncluttered, soothing, and age-appropriate. No text is included.

📝 GENERAL PROMPT STRUCTURE
Each prompt must include:
Art Style: State the specified style (e.g. Pixar style).
Theme Description: Clearly describe the bedtime characters or objects, including:
- Species/breed/type if animals
- Color details (fur, pajamas, blankets, pillows, etc.)
- Expressions (calm, sleeping, peaceful)
- Pose (lying down asleep, curled up, sitting sleepily)
Placement Instructions:
- FRAME: Characters and objects arranged around the edges only; center area completely empty for title overlay with no overlap.
- SLIDESHOW: Calm, simple bedtime scene filling the frame with minimal elements and no text.
Background Description: State it is a single light, soft solid color background with no gradients, patterns, textures, scenery, or text.
Negative Instructions: Reinforce exclusion of complex backgrounds, busy scenes, text, dramatic poses, or frightening elements.`;

  private static readonly NAME_VIDEO_INSTRUCTIONS = `You are generating prompts for preschool educational videos. Follow these rules carefully.

🧒 CHILD SAFETY REQUIREMENTS (CRITICAL)
Content must be 100% appropriate for ages 2-5 years old.
NO scary, frightening, or intense imagery whatsoever.
NO violence, conflict, or aggressive behavior (even cartoon style).
NO dark themes, shadows, or ominous elements.
NO realistic depictions of dangerous situations.
Characters must ALWAYS appear happy, calm, and friendly.
Colors must be bright, warm, and inviting (avoid dark or muted tones).
All imagery must be gentle and non-startling.
NO sudden movements, loud implications, or jarring visual themes.
Themes must be interpreted in the most innocent, playful way possible.

🎨 IMAGE REQUIREMENTS
SINGLE character or object only (no groups, pairs, or busy scenes).
Simple, clear pose (e.g. sitting, standing, smiling calmly).
Light, solid color background only.
No gradients, patterns, textures, scenery, or environmental elements.
Must be a single light color that ensures black text is readable.
No props, toys, or additional decorations unless explicitly requested.
No text or letters included in the image itself.

🖼️ SAFE ZONE REQUIREMENTS
Incorporate these placement rules directly into each prompt:
LEFT_SAFE: Character placed entirely on RIGHT side, left 40% completely empty for text overlay. No part of the character overlaps into the left area.
RIGHT_SAFE: Character placed entirely on LEFT side, right 40% completely empty for text overlay. No part of the character overlaps into the right area.
CENTER_SAFE: The image acts as a decorative frame around the edges, leaving the center area completely empty for text overlay. No elements should enter or overlap the center area. The edges can have themed decorations, characters, or objects.

📝 GENERAL PROMPT STRUCTURE
Each prompt must include:
Art Style: State the specified style (e.g. Pixar style).
Theme Description: Clearly describe the single character or object, including:
- Species/breed/type if animal
- Color details (fur, eyes, collar, etc.)
- Expression (happy, calm, smiling)
- Pose (sitting, standing, simple non-dynamic pose)
Placement Instructions:
- LEFT_SAFE: Character is on RIGHT side; LEFT 40% completely empty for text overlay with no overlap.
- RIGHT_SAFE: Character is on LEFT side; RIGHT 40% completely empty for text overlay with no overlap.
- CENTER_SAFE: Characters and objects arranged around the edges only; center area completely empty for text overlay with no overlap.
Background Description: State it is a single light solid color background with no gradients, patterns, textures, scenery, other objects, or text.
Negative Instructions: Reinforce exclusion of extra elements, props, scenery, text, multiple characters, or dynamic poses.`;

  static async generatePrompts(context: PromptContext): Promise<GeneratedPrompts> {
    const instructions = context.template === 'lullaby' 
      ? this.LULLABY_INSTRUCTIONS 
      : this.NAME_VIDEO_INSTRUCTIONS;

    const safeZone = context.safeZone || this.getDefaultSafeZone(context.template);
    
    const systemPrompt = `You are an expert content creator for children's educational videos. You must follow the provided instructions EXACTLY and return ONLY valid JSON.`;

    const userPrompt = this.buildUserPrompt(context, instructions, safeZone);

    try {
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

  private static getDefaultSafeZone(template: string): string {
    switch (template) {
      case 'lullaby':
        return 'slideshow';
      case 'name-video':
        return 'center_safe';
      default:
        return 'center_safe';
    }
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