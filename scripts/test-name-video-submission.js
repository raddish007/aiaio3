require('dotenv').config({ path: '.env.local' });

async function testNameVideoSubmission() {
  console.log('🧪 Testing NameVideo API submission...\n');

  const payload = {
    childName: "Nolan",
    childAge: 3,
    childTheme: "halloween",
    childId: "85177f52-38ee-4ca3-baa8-9504b17c187a",
    submitted_by: "1cb80063-9b5f-4fff-84eb-309f12bd247d",
    introImageUrl: "", // No intro image
    outroImageUrl: "", // No outro image
    letterImageUrls: [
      "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_tqu9kxu47.png",
      "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_07m3d64cx.png",
      "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_c4t2b0skf.png",
      "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_mxymk8qdo.png"
    ],
    introAudioUrl: "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752007789962_2c5345f6-58c9-4edb-916d-ed1284cf21bf.wav",
    outroAudioUrl: "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/elevenlabs_1752095478062_248nvfaZe8BXhKntjmpp.mp3",
    letterAudioUrls: {
      "N": {
        "id": "3f1fb53a-8977-46c6-b26e-5c6403cb6e74",
        "file_url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.wav",
        "theme": "N",
        "metadata": {
          "letter": "N",
          "audio_class": "letter_audio"
        }
      },
      "O": {
        "id": "c7fc5bd5-c888-423b-84f2-f4e994e92626",
        "file_url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.wav",
        "theme": "O",
        "metadata": {
          "letter": "O",
          "audio_class": "letter_audio"
        }
      },
      "L": {
        "id": "c6f8b267-9100-4f5b-9952-0e2870c82659",
        "file_url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.wav",
        "theme": "L",
        "metadata": {
          "letter": "L",
          "audio_class": "letter_audio"
        }
      },
      "A": {
        "id": "d27d4d6a-a2bc-4995-bbe6-91050e891d1d",
        "file_url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752101241031_60a6ea3c-4658-413c-b66d-cffa571955c6.wav",
        "theme": "A",
        "metadata": {
          "letter": "A",
          "audio_class": "letter_audio"
        }
      }
    }
  };

  console.log('📤 Submitting payload to /api/videos/generate-name-video...');
  console.log('Payload preview:', {
    childName: payload.childName,
    childAge: payload.childAge,
    childTheme: payload.childTheme,
    letterCount: Object.keys(payload.letterAudioUrls).length,
    hasIntroAudio: !!payload.introAudioUrl,
    hasOutroAudio: !!payload.outroAudioUrl
  });

  try {
    const response = await fetch('http://localhost:3000/api/videos/generate-name-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ NameVideo submission successful!');
      console.log('📊 Response:', {
        job_id: result.job_id,
        render_id: result.render_id,
        output_url: result.output_url,
        job_tracking_url: result.job_tracking_url
      });
      
      console.log('\n🔍 Next steps:');
      console.log(`1. Check job status: node scripts/check-render-details.js ${result.render_id}`);
      console.log(`2. Monitor progress: http://localhost:3000/monitor-job?renderId=${result.render_id}`);
      console.log(`3. View admin jobs: ${result.job_tracking_url}`);
      
    } else {
      console.error('❌ NameVideo submission failed:');
      console.error('Status:', response.status);
      console.error('Error:', result.error);
      console.error('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on port 3000');
  }
}

testNameVideoSubmission(); 