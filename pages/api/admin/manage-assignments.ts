import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        return await createAssignment(req, res);
      case 'PUT':
        return await updateAssignment(req, res);
      case 'GET':
        return await getAssignments(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in video assignments API:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

async function createAssignment(req: NextApiRequest, res: NextApiResponse) {
  const {
    child_id,
    template_type,
    priority = 'normal',
    due_date,
    assigned_by,
    notes
  } = req.body;

  if (!child_id || !template_type) {
    return res.status(400).json({
      error: 'Missing required fields: child_id, template_type'
    });
  }

  // Check if assignment already exists
  const { data: existing } = await supabase
    .from('child_video_assignments')
    .select('id')
    .eq('child_id', child_id)
    .eq('template_type', template_type)
    .single();

  if (existing) {
    return res.status(400).json({
      error: 'Assignment already exists for this child and template type'
    });
  }

  const { data, error } = await supabase
    .from('child_video_assignments')
    .insert({
      child_id,
      template_type,
      priority,
      due_date,
      assigned_by,
      notes,
      status: 'assigned'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating assignment: ${error.message}`);
  }

  return res.status(201).json({
    success: true,
    assignment: data
  });
}

async function updateAssignment(req: NextApiRequest, res: NextApiResponse) {
  const {
    assignment_id,
    status,
    priority,
    due_date,
    notes,
    rejection_reason,
    output_video_url,
    generated_assets,
    updated_by
  } = req.body;

  if (!assignment_id) {
    return res.status(400).json({
      error: 'Missing required field: assignment_id'
    });
  }

  const updateData: any = {};

  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (due_date) updateData.due_date = due_date;
  if (notes) updateData.notes = notes;
  if (rejection_reason) updateData.rejection_reason = rejection_reason;
  if (output_video_url) updateData.output_video_url = output_video_url;
  if (generated_assets) updateData.generated_assets = generated_assets;

  console.log('Updating assignment:', assignment_id, 'with data:', updateData);

  // Set status-specific timestamps
  if (status === 'in_progress' && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  }
  if (status === 'completed' && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }
  if (status === 'approved' && updated_by) {
    updateData.approved_by = updated_by;
    updateData.approved_at = new Date().toISOString();
  }
  if (status === 'rejected' && updated_by) {
    updateData.rejected_by = updated_by;
    updateData.rejected_at = new Date().toISOString();
  }

  // Use admin client for updates to bypass RLS
  if (!supabaseAdmin) {
    throw new Error('Admin client not available - check SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  const { error } = await supabaseAdmin
    .from('child_video_assignments')
    .update(updateData)
    .eq('id', assignment_id);

  console.log('Update result - error:', error);

  if (error) {
    throw new Error(`Error updating assignment: ${error.message}`);
  }

  console.log('Update successful, fetching updated record...');

  // Fetch the updated record separately
  const { data: updatedAssignment, error: fetchError } = await supabase
    .from('child_video_assignment_summary')
    .select('*')
    .eq('id', assignment_id)
    .single();

  console.log('Fetch result - error:', fetchError, 'data status:', updatedAssignment?.status);

  if (fetchError || !updatedAssignment) {
    return res.status(404).json({
      error: 'Assignment updated but could not fetch updated data'
    });
  }

  return res.status(200).json({
    success: true,
    assignment: updatedAssignment
  });
}

async function getAssignments(req: NextApiRequest, res: NextApiResponse) {
  const { child_id, template_type, status } = req.query;

  // Use the assignment summary view which has all the joins we need
  let query = supabase
    .from('child_video_assignment_summary')
    .select('*')
    .order('assigned_at', { ascending: false });

  if (child_id) {
    query = query.eq('child_id', child_id);
  }
  if (template_type) {
    query = query.eq('template_type', template_type);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching assignments: ${error.message}`);
  }

  return res.status(200).json({
    success: true,
    assignments: data || []
  });
}
