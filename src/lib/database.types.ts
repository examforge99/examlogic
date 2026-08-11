// lib/database.types.ts
// Supabase generated types — run `supabase gen types typescript` to regenerate
// This is a manual version matching our schema

export type Database = {
  public: {
    Tables: {
      subjects: {
        Row: {
          id:            string
          name:          string
          slug:          string
          icon:          string
          color:         string
          total_topics:  number
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>
      }

      topics: {
        Row: {
          id:               string
          subject_id:       string
          name:             string
          slug:             string
          description:      string | null
          difficulty_level: number
          total_questions:  number
          created_at:       string
        }
        Insert: Omit<Database['public']['Tables']['topics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['topics']['Insert']>
      }

      questions: {
        Row: {
          id:               string
          subject_id:       string
          topic_id:         string
          text:             string
          options:          { id: string; text: string }[]
          correct_option_id: string
          explanation:      string | null
          difficulty_level: number
          year:             number | null
          created_at:       string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['questions']['Insert']>
      }

      sessions: {
        Row: {
          id:               string
          user_id:          string
          mode:             string
          status:           string
          total_questions:  number
          correct_answers:  number
          incorrect_answers: number
          score:            number
          duration_seconds: number
          points_earned:    number
          subject_id:       string | null
          started_at:       string
          completed_at:     string | null
          created_at:       string
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }

      session_answers: {
        Row: {
          id:                 string
          session_id:         string
          question_id:        string
          selected_option_id: string
          is_correct:         boolean
          time_spent_seconds: number
          created_at:         string
        }
        Insert: Omit<Database['public']['Tables']['session_answers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['session_answers']['Insert']>
      }

      user_daily_analytics: {
        Row: {
          id:               string
          user_id:          string
          date:             string
          total_questions:  number
          correct_answers:  number
          accuracy:         number
          study_time_mins:  number
          sessions_count:   number
          points_earned:    number
          current_streak:   number
          best_streak:      number
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['user_daily_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_daily_analytics']['Insert']>
      }

      user_daily_subject_analytics: {
        Row: {
          id:               string
          user_id:          string
          date:             string
          subject_id:       string
          total_questions:  number
          correct_answers:  number
          accuracy:         number
          study_time_mins:  number
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['user_daily_subject_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_daily_subject_analytics']['Insert']>
      }

      user_daily_topic_analytics: {
        Row: {
          id:               string
          user_id:          string
          date:             string
          topic_id:         string
          subject_id:       string
          total_questions:  number
          correct_answers:  number
          accuracy:         number
          last_practiced:   string
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['user_daily_topic_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_daily_topic_analytics']['Insert']>
      }

      user_daily_difficulty_analytics: {
        Row: {
          id:               string
          user_id:          string
          date:             string
          difficulty_level: number
          total_questions:  number
          correct_answers:  number
          accuracy:         number
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['user_daily_difficulty_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_daily_difficulty_analytics']['Insert']>
      }

      user_daily_mode_analytics: {
        Row: {
          id:               string
          user_id:          string
          date:             string
          mode:             string
          sessions_count:   number
          total_questions:  number
          correct_answers:  number
          accuracy:         number
          best_score:       number
          study_time_mins:  number
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['user_daily_mode_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_daily_mode_analytics']['Insert']>
      }

      user_progress: {
        Row: {
          id:                    string
          user_id:               string
          current_level:         number
          current_points:        number
          points_to_next_level:  number
          next_level_threshold:  number
          total_points_earned:   number
          created_at:            string
          updated_at:            string
        }
        Insert: Omit<Database['public']['Tables']['user_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_progress']['Insert']>
      }
    }

    Functions: {
      compute_session_analytics: {
        Args: { p_session_id: string }
        Returns: void
      }
      compute_streak: {
        Args: { p_user_id: string; p_date: string }
        Returns: void
      }
    }
  }
}
