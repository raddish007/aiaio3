import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateType } = req.query;

    // Get all children with their video assignments
    const { data: assignmentData, error: assignmentsError } = await supabase
      .from('child_video_assignment_summary')
      .select('*')
      .order('child_name');

    if (assignmentsError) {
      throw new Error(`Error fetching assignments: ${assignmentsError.message}`);
    }

    if (!assignmentData || assignmentData.length === 0) {
      return res.status(200).json({
        success: true,
        templateType: templateType || 'all',
        totalChildren: 0,
        childrenMissingVideos: [],
        childrenWithAssignments: [],
        summary: 'No video assignments found'
      });
    }

    // Filter by template type if specified
    let filteredData = assignmentData;
    if (templateType && templateType !== 'all') {
      filteredData = assignmentData.filter(assignment => 
        assignment.template_type === templateType
      );
    }

    // Get list of all children (to find those without assignments)
    const { data: allChildren, error: childrenError } = await supabase
      .from('children')
      .select(`
        id,
        name,
        age,
        primary_interest,
        parent_id,
        users!parent_id(email)
      `)
      .order('name');

    if (childrenError) {
      throw new Error(`Error fetching children: ${childrenError.message}`);
    }

    // Analyze assignments vs children to find missing assignments
    const childrenMissingVideos = [];
    const childrenWithAssignments = [];

    for (const child of allChildren || []) {
      if (templateType && templateType !== 'all') {
        // Check if this child has an assignment for the specific template type
        const assignment = filteredData.find(a => 
          a.child_id === child.id && a.template_type === templateType
        );

        if (!assignment) {
          // No assignment at all for this template type
          childrenMissingVideos.push({
            id: child.id,
            name: child.name,
            age: child.age,
            primary_interest: child.primary_interest,
            parent_email: (child as any).users?.email,
            missingReason: `No ${templateType} assignment`,
            status: 'unassigned',
            template_type: templateType
          });
        } else if (assignment.status !== 'approved') {
          // Has assignment but not approved yet
          childrenMissingVideos.push({
            id: child.id,
            name: child.name,
            age: child.age,
            primary_interest: child.primary_interest,
            parent_email: assignment.parent_email,
            missingReason: `Assignment status: ${assignment.status_description}`,
            status: assignment.status,
            template_type: assignment.template_type,
            assigned_at: assignment.assigned_at,
            due_date: assignment.due_date,
            is_overdue: assignment.is_overdue
          });
        } else {
          // Has approved assignment
          childrenWithAssignments.push({
            id: child.id,
            name: child.name,
            template_type: assignment.template_type,
            status: assignment.status,
            approved_at: assignment.approved_at,
            output_video_url: assignment.output_video_url
          });
        }
      } else {
        // Check all template types for this child
        const childAssignments = filteredData.filter(a => a.child_id === child.id);
        
        if (childAssignments.length === 0) {
          // No assignments at all
          childrenMissingVideos.push({
            id: child.id,
            name: child.name,
            age: child.age,
            primary_interest: child.primary_interest,
            parent_email: (child as any).users?.email,
            missingReason: 'No video assignments',
            status: 'unassigned'
          });
        } else {
          // Check if any assignments are not approved
          const unapprovedAssignments = childAssignments.filter(a => a.status !== 'approved');
          if (unapprovedAssignments.length > 0) {
            childrenMissingVideos.push({
              id: child.id,
              name: child.name,
              age: child.age,
              primary_interest: child.primary_interest,
              parent_email: (child as any).users?.email,
              missingReason: `${unapprovedAssignments.length} pending assignments`,
              status: 'partial',
              assignments: unapprovedAssignments.map(a => ({
                template_type: a.template_type,
                status: a.status,
                status_description: a.status_description
              }))
            });
          } else {
            // All assignments approved
            childrenWithAssignments.push({
              id: child.id,
              name: child.name,
              assignments: childAssignments.map(a => ({
                template_type: a.template_type,
                status: a.status,
                approved_at: a.approved_at
              }))
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      templateType: templateType || 'all',
      totalChildren: allChildren?.length || 0,
      totalAssignments: filteredData.length,
      childrenMissingVideos,
      childrenWithAssignments,
      summary: `${childrenMissingVideos.length} of ${allChildren?.length || 0} children need attention`,
      stats: {
        unassigned: childrenMissingVideos.filter(c => c.status === 'unassigned').length,
        pending: childrenMissingVideos.filter(c => c.status && c.status !== 'unassigned').length,
        approved: childrenWithAssignments.length
      }
    });

  } catch (error) {
    console.error('Error checking video assignments:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
