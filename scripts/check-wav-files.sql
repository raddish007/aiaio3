-- Check for audio files with .wav extensions in the database
SELECT 
    id,
    type,
    theme,
    file_url,
    status,
    metadata->>'audio_class' as audio_class,
    metadata->>'letter' as letter,
    created_at
FROM assets 
WHERE type = 'audio' 
  AND file_url LIKE '%.wav'
ORDER BY created_at DESC;

-- Count total .wav files
SELECT 
    COUNT(*) as total_wav_files,
    COUNT(CASE WHEN metadata->>'audio_class' = 'letter_audio' THEN 1 END) as letter_audio_wav_files,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_wav_files
FROM assets 
WHERE type = 'audio' 
  AND file_url LIKE '%.wav';

-- Check for any remaining .wav files by audio class
SELECT 
    metadata->>'audio_class' as audio_class,
    COUNT(*) as count
FROM assets 
WHERE type = 'audio' 
  AND file_url LIKE '%.wav'
GROUP BY metadata->>'audio_class'
ORDER BY count DESC; 