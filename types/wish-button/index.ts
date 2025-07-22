export interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  theme?: string;
  child_description?: string;
  pronouns?: string;
  sidekick_description?: string;
}

export interface StoryVariables {
  childName: string;
  pronouns: string;
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

export type AssetStatusType = 'missing' | 'generating' | 'ready' | 'pending' | 'pending_review' | 'completed' | 'approved' | 'rejected' | 'failed';

export interface AssetStatus {
  type: 'image' | 'audio';
  name: string;
  description: string;
  status: AssetStatusType;
  url?: string;
  id?: string; // Database ID for tracking
}

export interface WishButtonAssets {
  // Page 1: Title Page
  page1_image: AssetStatus;
  page1_audio: AssetStatus;
  
  // Page 2: Character Trait / Desire  
  page2_image: AssetStatus;
  page2_audio: AssetStatus;

  // Page 3: Discovery
  page3_image: AssetStatus;
  page3_audio: AssetStatus;

  // Page 4: First Wish
  page4_image: AssetStatus;
  page4_audio: AssetStatus;

  // Page 5: Things Appear
  page5_image: AssetStatus;
  page5_audio: AssetStatus;

  // Page 6: Chaos
  page6_image: AssetStatus;
  page6_audio: AssetStatus;

  // Page 7: Realization
  page7_image: AssetStatus;
  page7_audio: AssetStatus;

  // Page 8: Learning
  page8_image: AssetStatus;
  page8_audio: AssetStatus;

  // Page 9: Happy Ending
  page9_image: AssetStatus;
  page9_audio: AssetStatus;

  // Background Music
  background_music: AssetStatus;
}

export interface WishButtonPayload {
  childName: string;
  theme: string;
  storyVariables: StoryVariables;
  metadata: {
    template: string;
    version: string;
    generatedAt: string;
    projectId: string;
  };
  assets: {
    // Page assets for testing (Pages 1-2)
    page1_image: AssetStatus;
    page1_audio: AssetStatus;
    page2_image: AssetStatus;
    page2_audio: AssetStatus;
    
    // Background music
    background_music: AssetStatus;
    
    // Future expansion for all 9 pages
    page3_image?: AssetStatus;
    page3_audio?: AssetStatus;
    page4_image?: AssetStatus;
    page4_audio?: AssetStatus;
    page5_image?: AssetStatus;
    page5_audio?: AssetStatus;
    page6_image?: AssetStatus;
    page6_audio?: AssetStatus;
    page7_image?: AssetStatus;
    page7_audio?: AssetStatus;
    page8_image?: AssetStatus;
    page8_audio?: AssetStatus;
    page9_image?: AssetStatus;
    page9_audio?: AssetStatus;
  };
}

export type WishButtonStep = 'child' | 'stories' | 'variables' | 'prompts' | 'images' | 'image-review' | 'audio' | 'audio-generation' | 'audio-review' | 'payload' | 'submit' | 'review';

export interface VideoSubmissionResult {
  success: boolean;
  job_id?: string;
  render_id?: string;
  output_url?: string;
  error?: string;
}

export interface PromptProgress {
  current: number;
  total: number;
  currentPage: string;
}

export interface ContentProject {
  id: string;
  title: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}
