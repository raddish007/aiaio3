import OpenAI from 'openai';
import axios from 'axios';

// OpenAI Configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// FAL.ai Configuration for image generation
export const falAiConfig = {
  apiKey: process.env.FAL_AI_API_KEY,
  baseURL: 'https://fal.run/fal-ai',
};

// AI Service Functions
export class AIService {
  // Generate prompts for content creation
  static async generatePrompt(
    template: string,
    theme: string,
    style: string,
    childName?: string,
    age?: number
  ): Promise<string> {
    const prompt = `Create a ${template} prompt for a ${age}-year-old child named ${childName} who loves ${theme}. 
    Style: ${style}
    Requirements:
    - Age-appropriate and safe
    - Engaging and educational
    - Personalized for the child
    - ${theme} themed
    
    Generate a detailed prompt:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content creator for children\'s educational videos. Generate engaging, safe, and age-appropriate prompts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || '';
  }

  // Generate image using FAL.ai
  static async generateImage(
    prompt: string,
    style: string = 'pixar',
    safeZone: string = 'center'
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${falAiConfig.baseURL}/imagen`,
        {
          prompt,
          style,
          safe_zone: safeZone,
          aspect_ratio: '16:9',
          quality: 'high',
        },
        {
          headers: {
            'Authorization': `Key ${falAiConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.image_url;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  // Generate enhanced prompts for different asset types
  static async generateAssetPrompts(project: any) {
    const systemPrompt = `You are an expert content creator for children's educational videos. Generate specific, detailed prompts for different types of assets needed for a video project.`;

    const userPrompt = `Create prompts for a ${project.theme} video targeting ${project.target_age} year olds with ${project.duration} seconds duration.

    Generate separate prompts for:
    1. Background images (scenes and environments)
    2. Character images (friendly, animated characters)
    3. Props and objects (items and elements)
    4. Voiceover script (narrative content)
    5. Background music (mood and style)

    Requirements:
    - Age-appropriate and safe
    - Engaging and educational
    - Consistent with the theme
    - Suitable for ${project.duration} seconds of content

    Return as JSON with keys: backgrounds, characters, props, voiceover, music`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    try {
      const content = completion.choices[0]?.message?.content || '';
      return JSON.parse(content);
    } catch (error) {
      // Fallback to template prompts if JSON parsing fails
      return {
        backgrounds: `Create a colorful, child-friendly background for a ${project.theme} story targeting ${project.target_age} year olds`,
        characters: `Design friendly, animated characters for a ${project.theme} story for ${project.target_age} year olds`,
        props: `Generate fun props and objects related to ${project.theme} for children aged ${project.target_age}`,
        voiceover: `Create a warm, engaging voiceover script for a ${project.theme} story for ${project.target_age} year olds`,
        music: `Compose cheerful background music suitable for a ${project.theme} story for ${project.target_age} year olds`
      };
    }
  }

  // Generate personalized voiceover script
  static async generateVoiceoverScript(
    childName: string,
    theme: string,
    contentType: 'name-video' | 'bedtime-song' | 'letter-hunt' | 'episode-segment',
    age: number
  ): Promise<string> {
    const prompt = `Create a ${contentType} script for ${childName}, a ${age}-year-old who loves ${theme}.
    
    Requirements:
    - Use the child's name naturally throughout
    - Include ${theme} elements
    - Age-appropriate language and concepts
    - Educational value
    - Engaging and fun tone
    - 2-4 minutes duration
    
    Generate the script:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert children\'s content writer. Create engaging, educational scripts that are personalized and age-appropriate.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '';
  }
} 