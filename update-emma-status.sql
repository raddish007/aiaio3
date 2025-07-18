-- Update Emma's project status from planning to completed
UPDATE content_projects 
SET status = 'completed'
WHERE id LIKE 'efb969d4%' AND status = 'planning';
