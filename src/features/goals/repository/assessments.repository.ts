// ============================================================================
// ASSESSMENTS REPOSITORY - Supabase Queries Only
// ============================================================================

import { supabase } from '@/shared/config/supabase';
import type {
  Assessment,
  CreateAssessmentRequest,
} from '../types';

/**
 * Parse JSON fields from assessment
 */
const parseAssessment = (assessment: any): Assessment => {
  return {
    ...assessment,
    action_items: assessment.action_items 
      ? (typeof assessment.action_items === 'string' 
        ? JSON.parse(assessment.action_items) 
        : assessment.action_items)
      : [],
    attachments: assessment.attachments
      ? (typeof assessment.attachments === 'string'
        ? JSON.parse(assessment.attachments)
        : assessment.attachments)
      : null,
  };
};

/**
 * Fetch assessment by checkpoint ID
 */
export const fetchAssessmentByCheckpointId = async (checkpointId: string) => {
  const response = await supabase
    .from('assessments')
    .select(`
      *,
      reviewer:user_profiles!assessments_reviewer_id_fkey(id, full_name),
      checkpoint:checkpoints(*)
    `)
    .eq('checkpoint_id', checkpointId)
    .single();

  if (response.data) {
    response.data = parseAssessment(response.data);
  }

  return response;
};

/**
 * Fetch assessments by reviewer
 */
export const fetchAssessmentsByReviewer = async (reviewerId: string, limit?: number) => {
  let query = supabase
    .from('assessments')
    .select(`
      *,
      checkpoint:checkpoints(
        *,
        goal:goals(id, title, user_id)
      )
    `)
    .eq('reviewer_id', reviewerId)
    .order('reviewed_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const response = await query;

  if (response.data) {
    response.data = response.data.map(parseAssessment);
  }

  return response;
};

/**
 * Create a new assessment
 */
export const createAssessment = async (reviewerId: string, data: CreateAssessmentRequest) => {
  const response = await supabase
    .from('assessments')
    .insert({
      checkpoint_id: data.checkpoint_id,
      reviewer_id: reviewerId,
      passed: data.passed,
      score: data.score || null,
      feedback_text: data.feedback_text || null,
      strengths: data.strengths || null,
      areas_for_improvement: data.areas_for_improvement || null,
      action_items: data.action_items ? JSON.stringify(data.action_items) : null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      review_duration_minutes: data.review_duration_minutes || null,
      reviewed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (response.data) {
    response.data = parseAssessment(response.data);
  }

  return response;
};

/**
 * Update an assessment (if allowed)
 */
export const updateAssessment = async (
  assessmentId: string,
  data: Partial<Assessment>
) => {
  return supabase
    .from('assessments')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .select()
    .single();
};
