-- Add foreign key for asset assignment join
ALTER TABLE template_asset_assignments
ADD CONSTRAINT fk_assigned_asset
FOREIGN KEY (assigned_asset_id)
REFERENCES assets(id)
ON DELETE SET NULL; 