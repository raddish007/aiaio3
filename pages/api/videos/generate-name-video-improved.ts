import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      childName, 
      childAge, 
      childTheme, 
      childId, 
      submitted_by, 
      introImageUrl, 
      outroImageUrl, 
      letterImageUrls, 
      letterImagesWithMetadata,
      letterAudioUrls, 
      introAudioUrl, 
      outroAudioUrl 
    } = req.body;

    if (!childName || !childId) {
      return res.status(400).json({ 
        error: 'Missing required fields: childName, childId' 
      });
    }

    // Use provided submitted_by or fallback to a default admin user
    const userId = submitted_by || '1cb80063-9b5f-4fff-84eb-309f12bd247d';

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Calculate video duration based on name length
    const letters = childName.toUpperCase().split('');
    const totalSegments = letters.length + 2; // intro + letters + outro
    const durationInSeconds = totalSegments * 4; // 4 seconds per segment

    // Get background music asset from database
    let backgroundMusicUrl = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752096424386.mp3';
    try {
      const { data: musicAsset, error: musicError } = await supabaseAdmin
        .from('assets')
        .select('file_url')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .eq('metadata->>audio_class', 'background_music')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!musicError && musicAsset?.file_url) {
        backgroundMusicUrl = musicAsset.file_url;
        console.log(`✅ Using background music from database: ${backgroundMusicUrl}`);
      } else {
        console.log(`⚠️ No background music found, using default audio file: ${backgroundMusicUrl}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch background music from database, using default audio file:', error);
    }

    // Get name audio asset for intro/outro
    let nameAudioUrl = '';
    console.log(`🔍 Looking for name audio for child: "${childName}"`);
    
    try {
      const { data: nameAudioAssets, error: nameAudioError } = await supabaseAdmin
        .from('assets')
        .select('file_url, metadata')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .eq('metadata->>audio_class', 'name_audio')
        .eq('metadata->>child_name', childName)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!nameAudioError && nameAudioAssets && nameAudioAssets.length > 0) {
        nameAudioUrl = nameAudioAssets[0].file_url;
        console.log(`✅ Using name audio for ${childName}: ${nameAudioUrl}`);
      } else {
        console.log(`⚠️ No name audio found for child: ${childName}, proceeding without it`);
      }
    } catch (error) {
      console.warn('⚠️ Exception in name audio fetch:', error);
    }

    // IMPROVED: Use dedicated API for theme-appropriate background images
    let processedLetterImages: { url: string; safeZone: 'left' | 'right' }[] = [];
    let processedIntroImage = '';
    let processedOutroImage = '';

    try {
      console.log(`🖼️ Fetching background images for theme: ${childTheme}`);
      
      // Use the dedicated get-theme-images API for better image selection
      const imageApiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/assets/get-theme-images?theme=${encodeURIComponent(childTheme || 'halloween')}&childName=${encodeURIComponent(childName)}`;
      
      const imageResponse = await fetch(imageApiUrl);
      if (!imageResponse.ok) {
        throw new Error(`Image API returned ${imageResponse.status}: ${imageResponse.statusText}`);
      }
      
      const imageData = await imageResponse.json();
      console.log(`🖼️ Image API response:`, {
        success: imageData.success,
        statistics: imageData.statistics,
        introImages: imageData.images?.intro_images?.length || 0,
        outroImages: imageData.images?.outro_images?.length || 0,
        letterImages: imageData.images?.letter_images_with_metadata?.length || 0
      });

      if (imageData.success && imageData.images) {
        // Select intro/outro images
        if (imageData.images.intro_images?.length > 0) {
          processedIntroImage = imageData.images.intro_images[0].file_url;
        }
        if (imageData.images.outro_images?.length > 0) {
          processedOutroImage = imageData.images.outro_images[0].file_url;
        }

        // Use the letter images with metadata for proper safe zone handling
        if (imageData.images.letter_images_with_metadata?.length > 0) {
          const letterImagesWithMeta = imageData.images.letter_images_with_metadata;
          
          // Create enough images for all letters in the name
          for (let i = 0; i < letters.length; i++) {
            const isLeft = i % 2 === 0;
            const requestedZone = isLeft ? 'left' : 'right';
            
            // Filter images by the requested safe zone
            const zoneImages = letterImagesWithMeta.filter((img: any) => img.safeZone === requestedZone);
            
            if (zoneImages.length > 0) {
              // Use deterministic selection based on index to prevent flickering
              const imageIndex = i % zoneImages.length;
              const selectedImage = zoneImages[imageIndex];
              
              processedLetterImages.push({
                url: selectedImage.url,
                safeZone: requestedZone
              });
              
              console.log(`🔤 Letter ${i} (${requestedZone}): Selected image ${imageIndex}/${zoneImages.length}`);
            } else {
              // Fallback to any available image
              console.warn(`⚠️ No ${requestedZone} images available, using fallback`);
              const fallbackImage = letterImagesWithMeta[i % letterImagesWithMeta.length];
              processedLetterImages.push({
                url: fallbackImage.url,
                safeZone: requestedZone // Keep the requested zone for layout
              });
            }
          }
        } else {
          console.warn(`⚠️ No letter images with metadata found for theme: ${childTheme}`);
        }
        
        console.log(`🖼️ Processed images:`, {
          hasIntroImage: !!processedIntroImage,
          hasOutroImage: !!processedOutroImage,
          letterImagesCount: processedLetterImages.length,
          letterSafeZones: processedLetterImages.map(img => img.safeZone)
        });
      } else {
        console.warn(`⚠️ Image API returned no data for theme: ${childTheme}`);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching theme images, will use fallback:', error);
    }

    // Use processed images if available, otherwise fall back to provided images
    const finalIntroImage = processedIntroImage || introImageUrl || '';
    const finalOutroImage = processedOutroImage || outroImageUrl || '';
    const finalLetterImages = processedLetterImages.length > 0 ? processedLetterImages.map(img => img.url) : (letterImageUrls || []);
    const finalLetterImagesWithMetadata = processedLetterImages.length > 0 ? processedLetterImages : (letterImagesWithMetadata || []);

    // Convert letterAudioUrls from asset objects to URL strings
    const letterAudioUrlStrings: { [letter: string]: string } = {};
    if (letterAudioUrls) {
      Object.entries(letterAudioUrls).forEach(([letter, asset]) => {
        if (asset && typeof asset === 'object' && 'file_url' in asset) {
          letterAudioUrlStrings[letter] = (asset as any).file_url;
        } else if (typeof asset === 'string') {
          letterAudioUrlStrings[letter] = asset;
        }
      });
    }

    // Prepare input props for Lambda
    const inputProps = {
      childName,
      childAge: childAge || 3,
      childTheme: childTheme || 'default',
      backgroundMusicUrl,
      backgroundMusicVolume: 0.25,
      introImageUrl: finalIntroImage,
      outroImageUrl: finalOutroImage,
      letterImageUrls: finalLetterImages,
      letterImagesWithMetadata: finalLetterImagesWithMetadata,
      letterAudioUrl: Object.values(letterAudioUrlStrings)[0] || '',
      letterName: Object.keys(letterAudioUrlStrings)[0] || '',
      audioAssets: {
        fullName: nameAudioUrl || '',
        letters: letterAudioUrlStrings
      },
      debugMode: false
    };

    console.log(`🔍 Final inputProps:`, {
      hasIntroImage: !!inputProps.introImageUrl,
      hasOutroImage: !!inputProps.outroImageUrl,
      letterImageCount: inputProps.letterImageUrls.length,
      letterImagesWithMetadataCount: inputProps.letterImagesWithMetadata.length,
      audioAssets: inputProps.audioAssets,
      backgroundMusicUrl: inputProps.backgroundMusicUrl
    });

    // Create a video generation job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: 'dcf10e2a-d7df-4e72-ab25-d6c9b1f00bd8',
        status: 'pending',
        submitted_by: userId,
        assets: [],
        template_data: {
          composition: 'NameVideo',
          props: inputProps
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job record:', jobError);
      return res.status(500).json({ error: 'Failed to create job record' });
    }

    try {
      console.log(`🚀 Starting Lambda render for NameVideo composition`);

      // Validate environment variables
      if (!process.env.REMOTION_SITE_URL) {
        throw new Error('REMOTION_SITE_URL environment variable is not set');
      }
      if (!process.env.AWS_LAMBDA_REMOTION_FUNCTION) {
        throw new Error('AWS_LAMBDA_REMOTION_FUNCTION environment variable is not set');
      }

      const result = await renderMediaOnLambda({
        region: (process.env.AWS_REGION as any) || 'us-east-1',
        functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION,
        serveUrl: process.env.REMOTION_SITE_URL,
        composition: 'NameVideo',
        inputProps,
        codec: 'h264',
        imageFormat: 'jpeg',
      });

      const outputUrl = `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`;
      
      console.log(`✅ Lambda render started successfully: ${result.renderId}`);
      
      // Update job with Lambda info
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'submitted',
          lambda_request_id: result.renderId,
          submitted_at: new Date().toISOString(),
          output_url: outputUrl
        })
        .eq('id', jobRecord.id);

      // Create child approved video record for moderation
      const { data: approvedVideoRecord, error: approvedVideoError } = await supabaseAdmin
        .from('child_approved_videos')
        .insert({
          video_generation_job_id: jobRecord.id,
          video_url: outputUrl,
          video_title: `Name Video for ${childName}`,
          child_id: childId,
          child_name: childName,
          child_age: childAge || 3,
          child_theme: childTheme || 'default',
          personalization_level: 'child_specific',
          approval_status: 'pending_review',
          submitted_by: userId,
          duration_seconds: durationInSeconds,
          template_type: 'name-video',
          template_data: {
            composition: 'NameVideo',
            props: inputProps,
            used_assets: {
              intro_image: finalIntroImage,
              outro_image: finalOutroImage,
              letter_images: finalLetterImages,
              name_audio: nameAudioUrl,
              letter_audios: letterAudioUrlStrings,
              background_music: backgroundMusicUrl
            }
          }
        })
        .select()
        .single();

      if (approvedVideoError) {
        console.error('Error creating approved video record:', approvedVideoError);
      } else {
        console.log('✅ Created child approved video record for moderation:', approvedVideoRecord.id);
        
        // Create moderation queue entry
        const { data: moderationQueueRecord, error: moderationQueueError } = await supabaseAdmin
          .from('video_moderation_queue')
          .insert({
            child_approved_video_id: approvedVideoRecord.id,
            assigned_to: null,
            priority: 1,
            status: 'pending_review',
            review_notes: null
          })
          .select()
          .single();

        if (moderationQueueError) {
          console.error('Error creating moderation queue record:', moderationQueueError);
        } else {
          console.log('✅ Created moderation queue record:', moderationQueueRecord.id);
        }
      }

      return res.status(200).json({
        success: true,
        job_id: jobRecord.id,
        render_id: result.renderId,
        output_url: outputUrl,
        job_tracking_url: `/admin/jobs?job_id=${jobRecord.id}`,
        debug_info: {
          hasNameAudio: !!nameAudioUrl,
          nameAudioUrl: nameAudioUrl || 'not found',
          letterAudioCount: Object.keys(letterAudioUrlStrings).length,
          availableLetters: Object.keys(letterAudioUrlStrings),
          imageSelection: {
            introImage: !!finalIntroImage,
            outroImage: !!finalOutroImage,
            letterImages: finalLetterImagesWithMetadata.length,
            usedAPI: true
          }
        }
      });
    } catch (lambdaError) {
      console.error('❌ Lambda render failed:', lambdaError);
      
      // Update job as failed
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: lambdaError instanceof Error ? lambdaError.message : 'Remotion Lambda render failed',
          failed_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id);
      return res.status(500).json({ error: 'Failed to start Remotion Lambda render' });
    }

  } catch (error) {
    console.error('Name video generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate name video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
