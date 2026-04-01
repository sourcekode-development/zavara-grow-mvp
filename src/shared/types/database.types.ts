export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          action_items: Json | null
          areas_for_improvement: string | null
          attachments: Json | null
          checkpoint_id: string
          created_at: string
          feedback_text: string | null
          id: string
          passed: boolean
          review_duration_minutes: number | null
          reviewed_at: string
          reviewer_id: string | null
          score: number | null
          strengths: string | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          areas_for_improvement?: string | null
          attachments?: Json | null
          checkpoint_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          passed: boolean
          review_duration_minutes?: number | null
          reviewed_at?: string
          reviewer_id?: string | null
          score?: number | null
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          areas_for_improvement?: string | null
          attachments?: Json | null
          checkpoint_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          passed?: boolean
          review_duration_minutes?: number | null
          reviewed_at?: string
          reviewer_id?: string | null
          score?: number | null
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_sessions: {
        Row: {
          calendar_event_id: string | null
          completed_at: string | null
          completed_effort: number
          created_at: string
          description: string | null
          duration_minutes: number
          goal_id: string
          id: string
          is_auto_generated: boolean
          milestone_id: string | null
          scheduled_date: string | null
          session_effort: number
          session_index: number | null
          skip_reason: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["cadence_session_status"]
          summary_text: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          calendar_event_id?: string | null
          completed_at?: string | null
          completed_effort?: number
          created_at?: string
          description?: string | null
          duration_minutes?: number
          goal_id: string
          id?: string
          is_auto_generated?: boolean
          milestone_id?: string | null
          scheduled_date?: string | null
          session_effort?: number
          session_index?: number | null
          skip_reason?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cadence_session_status"]
          summary_text?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          calendar_event_id?: string | null
          completed_at?: string | null
          completed_effort?: number
          created_at?: string
          description?: string | null
          duration_minutes?: number
          goal_id?: string
          id?: string
          is_auto_generated?: boolean
          milestone_id?: string | null
          scheduled_date?: string | null
          session_effort?: number
          session_index?: number | null
          skip_reason?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cadence_session_status"]
          summary_text?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_sessions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_sessions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoints: {
        Row: {
          assigned_reviewer_id: string | null
          created_at: string
          description: string | null
          goal_id: string
          id: string
          milestone_id: string | null
          review_started_at: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["checkpoint_status"]
          title: string
          trigger_config: Json | null
          trigger_type: string | null
          type: Database["public"]["Enums"]["checkpoint_type"]
          updated_at: string
        }
        Insert: {
          assigned_reviewer_id?: string | null
          created_at?: string
          description?: string | null
          goal_id: string
          id?: string
          milestone_id?: string | null
          review_started_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["checkpoint_status"]
          title: string
          trigger_config?: Json | null
          trigger_type?: string | null
          type: Database["public"]["Enums"]["checkpoint_type"]
          updated_at?: string
        }
        Update: {
          assigned_reviewer_id?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string
          id?: string
          milestone_id?: string | null
          review_started_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["checkpoint_status"]
          title?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          type?: Database["public"]["Enums"]["checkpoint_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_assigned_reviewer_id_fkey"
            columns: ["assigned_reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoints_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoints_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_reviews: {
        Row: {
          action: string
          changes_made: Json | null
          comments: string | null
          created_at: string
          goal_id: string
          id: string
          new_status: Database["public"]["Enums"]["goal_status"]
          previous_status: Database["public"]["Enums"]["goal_status"]
          reviewer_id: string
        }
        Insert: {
          action: string
          changes_made?: Json | null
          comments?: string | null
          created_at?: string
          goal_id: string
          id?: string
          new_status: Database["public"]["Enums"]["goal_status"]
          previous_status: Database["public"]["Enums"]["goal_status"]
          reviewer_id: string
        }
        Update: {
          action?: string
          changes_made?: Json | null
          comments?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["goal_status"]
          previous_status?: Database["public"]["Enums"]["goal_status"]
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_reviews_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_streak_history: {
        Row: {
          created_at: string
          date: string
          goal_id: string
          id: string
          sessions_completed_today: number
          streak_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          goal_id: string
          id?: string
          sessions_completed_today?: number
          streak_count: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          goal_id?: string
          id?: string
          sessions_completed_today?: number
          streak_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_streak_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_streak_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_templates: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          actual_end_date: string | null
          assigned_by: string | null
          completed_effects: number
          completed_effort: number
          completed_sessions: number
          created_at: string
          created_by: string
          current_streak: number
          description: string | null
          duplicated_from: string | null
          duplication_count: number
          effects: number | null
          effects_description: string | null
          effort: number | null
          effort_description: string | null
          frequency_config: Json | null
          frequency_type: Database["public"]["Enums"]["frequency_type"] | null
          id: string
          is_public: boolean
          last_effort_date: string | null
          longest_streak: number
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"]
          target_end_date: string | null
          template_id: string | null
          title: string
          total_duration_days: number | null
          total_sessions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end_date?: string | null
          assigned_by?: string | null
          completed_effects?: number
          completed_effort?: number
          completed_sessions?: number
          created_at?: string
          created_by: string
          current_streak?: number
          description?: string | null
          duplicated_from?: string | null
          duplication_count?: number
          effects?: number | null
          effects_description?: string | null
          effort?: number | null
          effort_description?: string | null
          frequency_config?: Json | null
          frequency_type?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          is_public?: boolean
          last_effort_date?: string | null
          longest_streak?: number
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_end_date?: string | null
          template_id?: string | null
          title: string
          total_duration_days?: number | null
          total_sessions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end_date?: string | null
          assigned_by?: string | null
          completed_effects?: number
          completed_effort?: number
          completed_sessions?: number
          created_at?: string
          created_by?: string
          current_streak?: number
          description?: string | null
          duplicated_from?: string | null
          duplication_count?: number
          effects?: number | null
          effects_description?: string | null
          effort?: number | null
          effort_description?: string | null
          frequency_config?: Json | null
          frequency_type?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          is_public?: boolean
          last_effort_date?: string | null
          longest_streak?: number
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_end_date?: string | null
          template_id?: string | null
          title?: string
          total_duration_days?: number | null
          total_sessions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_duplicated_from_fkey"
            columns: ["duplicated_from"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "goal_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          duration_days: number | null
          estimated_sessions: number | null
          goal_id: string
          id: string
          order_index: number
          started_at: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          estimated_sessions?: number | null
          goal_id: string
          id?: string
          order_index: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          estimated_sessions?: number | null
          goal_id?: string
          id?: string
          order_index?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_by: string | null
          created_at: string
          joined_at: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          joined_at?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          joined_at?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_upskill_stats: {
        Row: {
          company_id: string
          created_at: string
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          total_programs_completed: number
          total_programs_started: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          total_programs_completed?: number
          total_programs_started?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          total_programs_completed?: number
          total_programs_started?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_upskill_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_upskill_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upskill_module_effort_logs: {
        Row: {
          created_at: string
          effort_used: number
          id: string
          logged_on: string
          module_id: string
          notes: string | null
          program_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effort_used: number
          id?: string
          logged_on?: string
          module_id: string
          notes?: string | null
          program_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          effort_used?: number
          id?: string
          logged_on?: string
          module_id?: string
          notes?: string | null
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upskill_module_effort_logs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "upskill_program_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_module_effort_logs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "upskill_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_module_effort_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upskill_program_modules: {
        Row: {
          content: Json | null
          content_plain_text: string | null
          created_at: string
          description: string | null
          effort: number | null
          id: string
          order_index: number
          program_id: string
          status: Database["public"]["Enums"]["upskill_module_status"]
          template_module_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          content_plain_text?: string | null
          created_at?: string
          description?: string | null
          effort?: number | null
          id?: string
          order_index?: number
          program_id: string
          status?: Database["public"]["Enums"]["upskill_module_status"]
          template_module_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          content_plain_text?: string | null
          created_at?: string
          description?: string | null
          effort?: number | null
          id?: string
          order_index?: number
          program_id?: string
          status?: Database["public"]["Enums"]["upskill_module_status"]
          template_module_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upskill_program_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "upskill_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_program_modules_template_module_id_fkey"
            columns: ["template_module_id"]
            isOneToOne: false
            referencedRelation: "upskill_template_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      upskill_program_reviews: {
        Row: {
          comments: string | null
          created_at: string
          decision: Database["public"]["Enums"]["upskill_review_decision"]
          id: string
          program_id: string
          responded_at: string | null
          review_round: number
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["upskill_review_decision"]
          id?: string
          program_id: string
          responded_at?: string | null
          review_round?: number
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["upskill_review_decision"]
          id?: string
          program_id?: string
          responded_at?: string | null
          review_round?: number
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upskill_program_reviews_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "upskill_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_program_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upskill_program_templates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          is_published: boolean
          title: string
          total_effort: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          title: string
          total_effort?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          title?: string
          total_effort?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upskill_program_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_program_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upskill_programs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          completed_at: string | null
          completed_modules: number
          created_at: string
          created_by: string
          current_streak: number
          description: string | null
          id: string
          last_activity_date: string | null
          longest_streak: number
          review_round: number
          started_at: string | null
          status: Database["public"]["Enums"]["upskill_program_status"]
          template_id: string | null
          title: string
          total_effort: number | null
          total_modules: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          completed_at?: string | null
          completed_modules?: number
          created_at?: string
          created_by: string
          current_streak?: number
          description?: string | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          review_round?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["upskill_program_status"]
          template_id?: string | null
          title: string
          total_effort?: number | null
          total_modules?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          completed_at?: string | null
          completed_modules?: number
          created_at?: string
          created_by?: string
          current_streak?: number
          description?: string | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          review_round?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["upskill_program_status"]
          template_id?: string | null
          title?: string
          total_effort?: number | null
          total_modules?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upskill_programs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_programs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_programs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "upskill_program_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upskill_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upskill_template_modules: {
        Row: {
          content: Json | null
          content_plain_text: string | null
          created_at: string
          description: string | null
          effort: number | null
          id: string
          order_index: number
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          content_plain_text?: string | null
          created_at?: string
          description?: string | null
          effort?: number | null
          id?: string
          order_index?: number
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          content_plain_text?: string | null
          created_at?: string
          description?: string | null
          effort?: number | null
          id?: string
          order_index?: number
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upskill_template_modules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "upskill_program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_kpis: {
        Row: {
          created_at: string
          created_by: string
          developer_id: string
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["kpi_status"]
          template_id: string | null
          total_target_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          developer_id: string
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["kpi_status"]
          template_id?: string | null
          total_target_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          developer_id?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["kpi_status"]
          template_id?: string | null
          total_target_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_kpis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_kpis_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_kpis_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "kpi_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string
          claim_id: string
          comment_text: string | null
          created_at: string
          id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string
          claim_id: string
          comment_text?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string
          claim_id?: string
          comment_text?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_audit_logs_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          awarded_points: number | null
          created_at: string
          evidence_attachments: Json | null
          evidence_text: string
          id: string
          kpi_id: string
          metric_id: string
          status: Database["public"]["Enums"]["claim_status"]
          submitter_id: string
          updated_at: string
        }
        Insert: {
          awarded_points?: number | null
          created_at?: string
          evidence_attachments?: Json | null
          evidence_text: string
          id?: string
          kpi_id: string
          metric_id: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitter_id: string
          updated_at?: string
        }
        Update: {
          awarded_points?: number | null
          created_at?: string
          evidence_attachments?: Json | null
          evidence_text?: string
          id?: string
          kpi_id?: string
          metric_id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "assigned_kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "kpi_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dimensions: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          scope: Database["public"]["Enums"]["scope_enum"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          scope: Database["public"]["Enums"]["scope_enum"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["scope_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimensions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_dimensions: {
        Row: {
          created_at: string
          dimension_id: string
          kpi_id: string
          weight_percentage: number
        }
        Insert: {
          created_at?: string
          dimension_id: string
          kpi_id: string
          weight_percentage: number
        }
        Update: {
          created_at?: string
          dimension_id?: string
          kpi_id?: string
          weight_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_dimensions_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_dimensions_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "assigned_kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_metrics: {
        Row: {
          created_at: string
          id: string
          is_impact_metric: boolean
          kpi_id: string
          max_points: number
          metric_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_impact_metric?: boolean
          kpi_id: string
          max_points: number
          metric_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_impact_metric?: boolean
          kpi_id?: string
          max_points?: number
          metric_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_metrics_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "assigned_kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_reviewers: {
        Row: {
          created_at: string
          kpi_id: string
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          kpi_id: string
          reviewer_id: string
        }
        Update: {
          created_at?: string
          kpi_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_reviewers_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "assigned_kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_reviewers_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_templates: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          scope: Database["public"]["Enums"]["scope_enum"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          scope: Database["public"]["Enums"]["scope_enum"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["scope_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dimension_id: string
          how_to_measure: string | null
          id: string
          name: string
          scope: Database["public"]["Enums"]["scope_enum"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimension_id: string
          how_to_measure?: string | null
          id?: string
          name: string
          scope: Database["public"]["Enums"]["scope_enum"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimension_id?: string
          how_to_measure?: string | null
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["scope_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_dimensions: {
        Row: {
          created_at: string
          dimension_id: string
          template_id: string
          weight_percentage: number
        }
        Insert: {
          created_at?: string
          dimension_id: string
          template_id: string
          weight_percentage: number
        }
        Update: {
          created_at?: string
          dimension_id?: string
          template_id?: string
          weight_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_dimensions_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_dimensions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "kpi_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_metrics: {
        Row: {
          created_at: string
          max_points: number
          metric_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          max_points: number
          metric_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          max_points?: number
          metric_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_metrics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "kpi_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          allocation_status:
            | Database["public"]["Enums"]["allocation_status_enum"]
            | null
          certifications: Json | null
          company_id: string
          core_skills: Json | null
          created_at: string
          email: string | null
          full_name: string
          github_url: string | null
          id: string
          industry_domains: Json | null
          linkedin_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          seniority_level: string | null
          updated_at: string
        }
        Insert: {
          allocation_status?:
            | Database["public"]["Enums"]["allocation_status_enum"]
            | null
          certifications?: Json | null
          company_id: string
          core_skills?: Json | null
          created_at?: string
          email?: string | null
          full_name: string
          github_url?: string | null
          id: string
          industry_domains?: Json | null
          linkedin_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          seniority_level?: string | null
          updated_at?: string
        }
        Update: {
          allocation_status?:
            | Database["public"]["Enums"]["allocation_status_enum"]
            | null
          certifications?: Json | null
          company_id?: string
          core_skills?: Json | null
          created_at?: string
          email?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          industry_domains?: Json | null
          linkedin_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seniority_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_goal_effort_streak: {
        Args: { p_goal_id: string }
        Returns: {
          current_streak: number
          last_effort_date: string
          longest_streak: number
        }[]
      }
    }
    Enums: {
      allocation_status_enum: "BILLABLE" | "BENCH" | "INTERNAL_PROJECT"
      audit_action: "SUBMITTED" | "APPROVED" | "REJECTED" | "COMMENTED"
      cadence_session_status:
        | "TO_DO"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "DUE"
        | "MISSED"
        | "SKIPPED"
      checkpoint_status:
        | "PENDING"
        | "READY_FOR_REVIEW"
        | "REVIEW_IN_PROGRESS"
        | "NEEDS_ATTENTION"
        | "PASSED"
        | "SKIPPED"
      checkpoint_type: "MANUAL_REVIEW" | "AI_INTERVIEW"
      claim_status: "PENDING" | "APPROVED" | "REJECTED"
      frequency_type: "DAILY" | "WEEKDAYS" | "WEEKENDS" | "CUSTOM"
      goal_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "CHANGES_REQUESTED"
        | "APPROVED"
        | "IN_PROGRESS"
        | "ON_HOLD"
        | "BLOCKED"
        | "COMPLETED"
        | "ABANDONED"
      invite_status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"
      kpi_status: "ACTIVE" | "CLOSED"
      milestone_status: "PENDING" | "ACTIVE" | "COMPLETED"
      scope_enum: "PLATFORM" | "COMPANY"
      upskill_module_status:
        | "TODO"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "WONT_DO"
      upskill_program_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "APPROVED"
        | "IN_PROGRESS"
        | "COMPLETED"
      upskill_review_decision:
        | "PENDING"
        | "APPROVED"
        | "CHANGES_REQUESTED"
        | "AUTO_CLOSED"
      user_role: "COMPANY_ADMIN" | "TEAM_LEAD" | "DEVELOPER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      allocation_status_enum: ["BILLABLE", "BENCH", "INTERNAL_PROJECT"],
      audit_action: ["SUBMITTED", "APPROVED", "REJECTED", "COMMENTED"],
      cadence_session_status: [
        "TO_DO",
        "IN_PROGRESS",
        "COMPLETED",
        "DUE",
        "MISSED",
        "SKIPPED",
      ],
      claim_status: ["PENDING", "APPROVED", "REJECTED"],
      checkpoint_status: [
        "PENDING",
        "READY_FOR_REVIEW",
        "REVIEW_IN_PROGRESS",
        "NEEDS_ATTENTION",
        "PASSED",
        "SKIPPED",
      ],
      checkpoint_type: ["MANUAL_REVIEW", "AI_INTERVIEW"],
      frequency_type: ["DAILY", "WEEKDAYS", "WEEKENDS", "CUSTOM"],
      goal_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "CHANGES_REQUESTED",
        "APPROVED",
        "IN_PROGRESS",
        "ON_HOLD",
        "BLOCKED",
        "COMPLETED",
        "ABANDONED",
      ],
      invite_status: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
      kpi_status: ["ACTIVE", "CLOSED"],
      milestone_status: ["PENDING", "ACTIVE", "COMPLETED"],
      scope_enum: ["PLATFORM", "COMPANY"],
      upskill_module_status: [
        "TODO",
        "IN_PROGRESS",
        "COMPLETED",
        "WONT_DO",
      ],
      upskill_program_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "APPROVED",
        "IN_PROGRESS",
        "COMPLETED",
      ],
      upskill_review_decision: [
        "PENDING",
        "APPROVED",
        "CHANGES_REQUESTED",
        "AUTO_CLOSED",
      ],
      user_role: ["COMPANY_ADMIN", "TEAM_LEAD", "DEVELOPER"],
    },
  },
} as const
