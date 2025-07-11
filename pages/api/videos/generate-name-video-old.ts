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

    // Get background music asset from database - use the correct asset ID
    let backgroundMusicUrl = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752096424386.mp3'; // Use correct asset ID
    try {
      // Try to get a background music asset, but fallback to a working audio file
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

    // IMPROVED: Get name audio asset for intro/outro with better debugging
    let nameAudioUrl = '';
    console.log(`🔍 DEBUGGING: Looking for name audio for child: "${childName}"`);
    
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

      console.log(`🔍 DEBUGGING: Query completed`);
      console.log(`🔍 DEBUGGING: Error:`, nameAudioError);
      console.log(`🔍 DEBUGGING: Data:`, nameAudioAssets);
      console.log(`🔍 DEBUGGING: Found ${nameAudioAssets?.length || 0} results`);

      if (!nameAudioError && nameAudioAssets && nameAudioAssets.length > 0) {
        nameAudioUrl = nameAudioAssets[0].file_url;
        console.log(`✅ DEBUGGING: Using name audio for ${childName}: ${nameAudioUrl}`);
      } else {
        console.error(`❌ DEBUGGING: No name audio found for child: ${childName}`);
        console.error(`❌ DEBUGGING: Error details:`, nameAudioError);
        
        // FIXED: Don't fail the whole request - just proceed without name audio
        console.log(`⚠️ Proceeding without name audio for ${childName}`);
        
        // Try a broader search for debugging
        const { data: debugAssets } = await supabaseAdmin
          .from('assets')
          .select('metadata->child_name, metadata->audio_class, status')
          .eq('type', 'audio')
          .eq('metadata->>child_name', childName);
        console.log(`🔍 DEBUGGING: All audio for ${childName}:`, debugAssets);
      }
    } catch (error) {
      console.error('❌ DEBUGGING: Exception in name audio fetch:', error);
      // FIXED: Don't fail the whole request
      console.log(`⚠️ Proceeding without name audio due to error`);
    }

    // IMPROVED: Fetch theme-appropriate background images
    let processedLetterImages: { url: string; safeZone: 'left' | 'right' }[] = [];
    let processedIntroImage = '';
    let processedOutroImage = '';

    try {
      console.log(`�️ Fetching background images for theme: ${childTheme}`);
      
      // Query for theme-matching images with proper safe zone filtering
      const { data: themeImages, error: themeImagesError } = await supabaseAdmin
        .from('assets')
        .select('id, file_url, theme, safe_zone, tags, metadata')
        .eq('type', 'image')
        .eq('status', 'approved')
        .or(`theme.ilike.%${childTheme || 'halloween'}%,tags.cs.{${(childTheme || 'halloween').toLowerCase()}}`)
        .limit(50);

      if (themeImagesError) {
        console.warn('Error fetching theme images:', themeImagesError);
      } else if (themeImages && themeImages.length > 0) {
        console.log(`Found ${themeImages.length} theme images`);
        
        // Filter images by safe zones
        const centerSafeImages = themeImages.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('center_safe');
        });
        
        const leftSafeImages = themeImages.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('left_safe');
        });
        
        const rightSafeImages = themeImages.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('right_safe');
        });

        // Select intro/outro images from center-safe images
        if (centerSafeImages.length > 0) {
          processedIntroImage = centerSafeImages[Math.floor(Math.random() * centerSafeImages.length)].file_url;
          processedOutroImage = centerSafeImages[Math.floor(Math.random() * centerSafeImages.length)].file_url;
        }

        // Create letter images with safe zone metadata
        const letterImagePool = [...leftSafeImages, ...rightSafeImages];
        if (letterImagePool.length > 0) {
          // Create enough images for all letters in the name
          for (let i = 0; i < letters.length; i++) {
            const isLeft = i % 2 === 0;
            const availableImages = isLeft ? leftSafeImages : rightSafeImages;
            
            if (availableImages.length > 0) {
              const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
              processedLetterImages.push({
                url: selectedImage.file_url,
                safeZone: isLeft ? 'left' : 'right'
              });
            }
          }
        }
        
        console.log(`🖼️ Processed images:`, {
          centerSafe: centerSafeImages.length,
          leftSafe: leftSafeImages.length,
          rightSafe: rightSafeImages.length,
          processedLetterImages: processedLetterImages.length,
          hasIntroImage: !!processedIntroImage,
          hasOutroImage: !!processedOutroImage
        });
      } else {
        console.warn(`No theme images found for: ${childTheme}`);
      }
    } catch (error) {
      console.warn('Error processing theme images:', error);
    }

    // Use processed images if available, otherwise fall back to provided images
    const finalIntroImage = processedIntroImage || introImageUrl || '';
    const finalOutroImage = processedOutroImage || outroImageUrl || '';
    const finalLetterImages = processedLetterImages.length > 0 ? processedLetterImages.map(img => img.url) : (letterImageUrls || []);
    const finalLetterImagesWithMetadata = processedLetterImages.length > 0 ? processedLetterImages : (letterImagesWithMetadata || []);

    // Convert letterAudioUrls from asset objects to URL strings (_reference format)
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

    // Prepare input props for Lambda - use FLAT structure like working HelloWorldWithImageAndAudio
    const inputProps = {
      childName,
      childAge: childAge || 3,
      childTheme: childTheme || 'default',
      backgroundMusicUrl,
      backgroundMusicVolume: 0.25, // Reduced volume for better balance
      introImageUrl: finalIntroImage,
      outroImageUrl: finalOutroImage,
      letterImageUrls: finalLetterImages,
      // NEW: Pass letter images with safe zone metadata
      letterImagesWithMetadata: finalLetterImagesWithMetadata,
      // Use FLAT structure for letter audio (like working HelloWorldWithImageAndAudio)
      letterAudioUrl: Object.values(letterAudioUrlStrings)[0] || '', // Use first letter audio as flat URL
      letterName: Object.keys(letterAudioUrlStrings)[0] || '', // Use first letter name
      // Keep nested structure for compatibility
      audioAssets: {
        fullName: nameAudioUrl || '', // Empty string instead of placeholder
        letters: letterAudioUrlStrings // Direct letter -> URL mapping
      },
      debugMode: false
    };

    console.log(`🔍 DEBUGGING: Final inputProps:`, {
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
        template_id: 'dcf10e2a-d7df-4e72-ab25-d6c9b1f00bd8', // NameVideo template UUID
        status: 'pending',
        submitted_by: userId,
        assets: [],
        template_data: {
          composition: 'NameVideo',
          props: inputProps // Use the _reference structure
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
      console.log(`🚀 Starting Lambda render with FLAT structure:`, {
        composition: 'NameVideo',
        hasNameAudio: !!nameAudioUrl,
        letterCount: Object.keys(letterAudioUrlStrings).length,
        backgroundMusic: !!backgroundMusicUrl,
        flatLetterAudio: inputProps.letterAudioUrl,
        flatLetterName: inputProps.letterName,
        payloadStructure: 'flat + nested (compatible)'
      });

      // Validate environment variables
      if (!process.env.REMOTION_SITE_URL) {
        throw new Error('REMOTION_SITE_URL environment variable is not set');
      }
      if (!process.env.AWS_LAMBDA_REMOTION_FUNCTION) {
        throw new Error('AWS_LAMBDA_REMOTION_FUNCTION environment variable is not set');
      }

      console.log(`🔧 Using environment variables:`, {
        REMOTION_SITE_URL: process.env.REMOTION_SITE_URL,
        AWS_LAMBDA_REMOTION_FUNCTION: process.env.AWS_LAMBDA_REMOTION_FUNCTION,
        AWS_REGION: process.env.AWS_REGION || 'us-east-1'
      });

      console.log(`🎬 FIXED: Using proper audio timing with startFrom/endAt props`);

      // Enhanced debugging for letter audio
      console.log(`🔍 LETTER AUDIO DEBUGGING:`, {
        letterAudioUrls: letterAudioUrls,
        letterAudioUrlStrings: letterAudioUrlStrings,
        availableLetters: Object.keys(letterAudioUrlStrings),
        flatLetterAudio: inputProps.letterAudioUrl,
        flatLetterName: inputProps.letterName,
        nestedLetters: inputProps.audioAssets.letters
      });

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
          personalization_level: 'child_specific', // Since it's personalized with child name
          approval_status: 'pending_review',
          submitted_by: userId,
          duration_seconds: durationInSeconds,
          template_type: 'name-video',
          template_data: {
            composition: 'NameVideo',
            props: inputProps, // Use the _reference structure
            used_assets: {
              intro_image: introImageUrl,
              outro_image: outroImageUrl,
              letter_images: letterImageUrls,
              name_audio: nameAudioUrl, // Single name audio used for intro/outro
              letter_audios: letterAudioUrlStrings, // Direct letter -> URL mapping
              background_music: backgroundMusicUrl
            }
          }
        })
        .select()
        .single();

      if (approvedVideoError) {
        console.error('Error creating approved video record:', approvedVideoError);
        // Don't fail the whole request, just log the error
      } else {
        console.log('✅ Created child approved video record for moderation:', approvedVideoRecord.id);
        
        // Create moderation queue entry
        const { data: moderationQueueRecord, error: moderationQueueError } = await supabaseAdmin
          .from('video_moderation_queue')
          .insert({
            child_approved_video_id: approvedVideoRecord.id,
            assigned_to: null, // Will be assigned by admin
            priority: 1, // Default priority
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
        output_url: `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`,
        job_tracking_url: `/admin/jobs?job_id=${jobRecord.id}`,
        debug_info: {
          hasNameAudio: !!nameAudioUrl,
          nameAudioUrl: nameAudioUrl || 'not found',
          letterAudioCount: Object.keys(letterAudioUrlStrings).length,
          availableLetters: Object.keys(letterAudioUrlStrings),
          flatLetterAudio: inputProps.letterAudioUrl,
          flatLetterName: inputProps.letterName,
          payloadStructure: 'flat + nested (compatible)'
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