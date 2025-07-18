-- Fix remaining children profiles
-- Add descriptions for Jack, Liam, and Sophia, and fix Sophia's pronouns

UPDATE children 
SET child_description = CASE 
  WHEN name = 'Jack' AND child_description IS NULL THEN 'a young boy with dark brown hair, light skin, wearing a striped red and white shirt and navy blue shorts, with a cheerful grin'
  WHEN name = 'Liam' AND child_description IS NULL THEN 'a young boy with light brown hair, freckles, light skin, wearing a green hoodie and jeans, with a curious and friendly expression'
  WHEN name = 'Sophia' AND child_description IS NULL THEN 'a young girl with wavy auburn hair, light skin, wearing a lavender sweater and dark leggings, with a sweet and confident smile'
  ELSE child_description
END,
pronouns = CASE 
  WHEN name = 'Sophia' THEN 'she/her'
  WHEN name IN ('Jack', 'Liam') THEN 'he/him'
  ELSE pronouns
END,
sidekick_description = CASE 
  WHEN name = 'Jack' AND sidekick_description IS NULL THEN 'a playful black and white border collie puppy with bright eyes, a wagging tail, and boundless energy'
  WHEN name = 'Liam' AND sidekick_description IS NULL THEN 'a clever red fox kit with fluffy fur, bright amber eyes, and a mischievous but kind personality'
  WHEN name = 'Sophia' AND sidekick_description IS NULL THEN 'a gentle white rabbit with soft gray patches, long ears, and a calm, nurturing personality'
  ELSE sidekick_description
END
WHERE name IN ('Jack', 'Liam', 'Sophia');

-- Verify all children now have complete profiles
SELECT id, name, child_description, pronouns, sidekick_description 
FROM children 
WHERE child_description IS NULL OR sidekick_description IS NULL
ORDER BY name;
