-- Add a column for asset class-based display image selection
ALTER TABLE template_defaults ADD COLUMN IF NOT EXISTS default_display_image_class TEXT;

-- For Letter Hunt, set the default_display_image_class to 'titleCard' if appropriate
UPDATE template_defaults SET default_display_image_class = 'titleCard' WHERE template_type = 'letter-hunt'; 