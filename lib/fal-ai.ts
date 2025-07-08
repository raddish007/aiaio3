// Configure fal.ai client with new API
const FAL_BASE_URL = 'https://queue.fal.run';

// Get API key dynamically to ensure it's loaded
function getFalApiKey(): string {
  const apiKey = process.env.FAL_AI_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY;
  console.log('Environment check in fal.ai service:', {
    FAL_AI_API_KEY: process.env.FAL_AI_API_KEY ? 'SET' : 'NOT SET',
    FAL_KEY: process.env.FAL_KEY ? 'SET' : 'NOT SET',
    FAL_API_KEY: process.env.FAL_API_KEY ? 'SET' : 'NOT SET',
    finalApiKey: apiKey ? 'AVAILABLE' : 'NOT AVAILABLE'
  });
  if (!apiKey) {
    console.warn('FAL_AI_API_KEY, FAL_KEY, or FAL_API_KEY not configured');
  }
  return apiKey || '';
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: string;
  safeZone?: string;
  model?: 'imagen4' | 'schnell';
}

export interface AudioGenerationRequest {
  prompt: string;
  duration?: number; // in seconds
  style?: string;
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  jobId?: string;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class FalAIService {
  /**
   * Submit a request to the fal.ai queue
   */
  private static async submitRequest(endpoint: string, data: any): Promise<any> {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      throw new Error('FAL_AI_API_KEY not configured');
    }

    const response = await fetch(`${FAL_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Check the status of a request
   */
  private static async checkRequestStatus(endpoint: string, requestId: string): Promise<any> {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      throw new Error('FAL_AI_API_KEY not configured');
    }

    const response = await fetch(`${FAL_BASE_URL}${endpoint}/requests/${requestId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`fal.ai status check error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get the result of a completed request
   */
  private static async getRequestResult(endpoint: string, requestId: string): Promise<any> {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      throw new Error('FAL_AI_API_KEY not configured');
    }

    const response = await fetch(`${FAL_BASE_URL}${endpoint}/requests/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`fal.ai result fetch error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Generate an image using Imagen4 (synchronous with polling)
   */
  static async generateImage(request: ImageGenerationRequest): Promise<GenerationJob> {
    try {
      console.log('Submitting image generation request:', request);

      // Choose endpoint based on model
      const endpoint = request.model === 'schnell' ? '/fal-ai/flux-1/schnell' : '/fal-ai/imagen4/preview';
      
      // Submit the request - always use 16:9 for proper context
      const submitResponse = await this.submitRequest(endpoint, {
        prompt: request.prompt,
        aspect_ratio: '16:9', // Hardcoded to 16:9 for proper context
        num_images: 1,
      });

      const requestId = submitResponse.request_id;
      console.log('Image generation request submitted with ID:', requestId);

      if (!requestId) {
        throw new Error('No request ID received from fal.ai');
      }

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Checking status (attempt ${attempts}/${maxAttempts})...`);
        
        const statusEndpoint = request.model === 'schnell' ? '/fal-ai/flux-1' : '/fal-ai/imagen4';
        const statusResponse = await this.checkRequestStatus(statusEndpoint, requestId);
        console.log('Status response:', statusResponse);

        if (statusResponse.status === 'COMPLETED') {
          // Get the result
          const resultResponse = await this.getRequestResult(statusEndpoint, requestId);
          console.log('Image generation completed:', resultResponse);

          return {
            id: requestId,
            status: 'completed',
            jobId: requestId,
            result: resultResponse,
            createdAt: new Date(),
            completedAt: new Date(),
          };
        } else if (statusResponse.status === 'FAILED') {
          throw new Error(`Image generation failed: ${statusResponse.error || 'Unknown error'}`);
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Image generation timed out after 5 minutes');

    } catch (error) {
      console.error('Error generating image:', error);
      return {
        id: `img_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Generate an image using Schnell (FLUX.1) (synchronous with polling)
   */
  static async generateSchnell(request: ImageGenerationRequest): Promise<GenerationJob> {
    try {
      console.log('Submitting Schnell image generation request:', request);

      // Submit the request - always use 16:9 for proper context
      const submitResponse = await this.submitRequest('/fal-ai/flux-1/schnell', {
        prompt: request.prompt,
        aspect_ratio: '16:9', // Hardcoded to 16:9 for proper context
        num_images: 1,
      });

      const requestId = submitResponse.request_id;
      console.log('Schnell image generation request submitted with ID:', requestId);

      if (!requestId) {
        throw new Error('No request ID received from fal.ai');
      }

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Checking Schnell status (attempt ${attempts}/${maxAttempts})...`);
        
        const statusResponse = await this.checkRequestStatus('/fal-ai/flux-1', requestId);
        console.log('Schnell status response:', statusResponse);

        if (statusResponse.status === 'COMPLETED') {
          // Get the result
          const resultResponse = await this.getRequestResult('/fal-ai/flux-1', requestId);
          console.log('Schnell image generation completed:', resultResponse);

          return {
            id: requestId,
            status: 'completed',
            jobId: requestId,
            result: resultResponse,
            createdAt: new Date(),
            completedAt: new Date(),
          };
        } else if (statusResponse.status === 'FAILED') {
          throw new Error(`Schnell image generation failed: ${statusResponse.error || 'Unknown error'}`);
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Schnell image generation timed out after 5 minutes');

    } catch (error) {
      console.error('Error generating Schnell image:', error);
      return {
        id: `schnell_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Generate audio using Flux (synchronous with polling)
   */
  static async generateAudio(request: AudioGenerationRequest): Promise<GenerationJob> {
    try {
      console.log('Submitting audio generation request:', request);

      // Submit the request
      const submitResponse = await this.submitRequest('/fal-ai/flux/preview', {
        prompt: request.prompt,
        duration: request.duration || 10,
      });

      const requestId = submitResponse.request_id;
      console.log('Audio generation request submitted with ID:', requestId);

      if (!requestId) {
        throw new Error('No request ID received from fal.ai');
      }

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Checking audio status (attempt ${attempts}/${maxAttempts})...`);
        
        const statusResponse = await this.checkRequestStatus('/fal-ai/flux', requestId);
        console.log('Audio status response:', statusResponse);

        if (statusResponse.status === 'COMPLETED') {
          // Get the result
          const resultResponse = await this.getRequestResult('/fal-ai/flux', requestId);
          console.log('Audio generation completed:', resultResponse);

          return {
            id: requestId,
            status: 'completed',
            jobId: requestId,
            result: resultResponse,
            createdAt: new Date(),
            completedAt: new Date(),
          };
        } else if (statusResponse.status === 'FAILED') {
          throw new Error(`Audio generation failed: ${statusResponse.error || 'Unknown error'}`);
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Audio generation timed out after 5 minutes');

    } catch (error) {
      console.error('Error generating audio:', error);
      return {
        id: `audio_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Submit an asynchronous job for image generation
   */
  static async submitImageJob(request: ImageGenerationRequest): Promise<GenerationJob> {
    try {
      const submitResponse = await this.submitRequest('/fal-ai/imagen4/preview', {
        prompt: request.prompt,
        aspect_ratio: '16:9', // Hardcoded to 16:9 for proper context
        num_images: 1,
      });

      return {
        id: submitResponse.request_id || `img_${Date.now()}`,
        status: 'pending',
        jobId: submitResponse.request_id,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error submitting image job:', error);
      return {
        id: `img_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Submit an asynchronous job for audio generation
   */
  static async submitAudioJob(request: AudioGenerationRequest): Promise<GenerationJob> {
    try {
      const submitResponse = await this.submitRequest('/fal-ai/flux/preview', {
        prompt: request.prompt,
        duration: request.duration || 10,
      });

      return {
        id: submitResponse.request_id || `audio_${Date.now()}`,
        status: 'pending',
        jobId: submitResponse.request_id,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error submitting audio job:', error);
      return {
        id: `audio_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Check the status of a job
   */
  static async checkJobStatus(jobId: string, type: 'image' | 'audio' = 'image'): Promise<GenerationJob> {
    try {
      const endpoint = type === 'image' ? '/fal-ai/imagen4' : '/fal-ai/flux';
      const status = await this.checkRequestStatus(endpoint, jobId);
      
      // Map fal.ai status to our internal status
      let mappedStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
      switch (status.status) {
        case 'IN_QUEUE':
          mappedStatus = 'pending';
          break;
        case 'IN_PROGRESS':
          mappedStatus = 'in_progress';
          break;
        case 'COMPLETED':
          mappedStatus = 'completed';
          break;
        default:
          mappedStatus = 'failed';
      }
      
      return {
        id: jobId,
        status: mappedStatus,
        jobId: jobId,
        result: status.status === 'COMPLETED' ? status : undefined,
        error: status.error,
        createdAt: new Date(),
        completedAt: status.status === 'COMPLETED' ? new Date() : undefined,
      };
    } catch (error) {
      console.error('Error checking job status:', error);
      return {
        id: jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Get the result of a completed job
   */
  static async getJobResult(jobId: string, type: 'image' | 'audio' = 'image'): Promise<GenerationJob> {
    try {
      const endpoint = type === 'image' ? '/fal-ai/imagen4' : '/fal-ai/flux';
      const result = await this.getRequestResult(endpoint, jobId);
      
      return {
        id: jobId,
        status: 'completed',
        jobId: jobId,
        result: result,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting job result:', error);
      return {
        id: jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
    }
  }
} 