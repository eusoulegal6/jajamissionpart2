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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_email_users: {
        Row: {
          authorized_at: string | null
          created_at: string
          display_name: string | null
          email: string
          expires_at: string | null
          id: string
          is_admin: boolean
          is_authorized: boolean
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          authorized_at?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          authorized_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app2_user_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_authorized: boolean
          mercado_pago_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          mercado_pago_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          mercado_pago_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      book_lessons: {
        Row: {
          cached_audio_urls: Json | null
          color: string | null
          content: Json
          created_at: string
          description: string | null
          difficulty: string
          id: string
          koe_flashcard_words: Json | null
          order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          cached_audio_urls?: Json | null
          color?: string | null
          content: Json
          created_at?: string
          description?: string | null
          difficulty: string
          id?: string
          koe_flashcard_words?: Json | null
          order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          cached_audio_urls?: Json | null
          color?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          koe_flashcard_words?: Json | null
          order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_mode_progress: {
        Row: {
          category: string
          created_at: string
          current_lesson_id: string
          current_lesson_index: number
          current_page_index: number
          id: string
          lesson_sequence: Json
          phone_number: string
          total_lessons: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          current_lesson_id: string
          current_lesson_index?: number
          current_page_index?: number
          id?: string
          lesson_sequence?: Json
          phone_number: string
          total_lessons?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          current_lesson_id?: string
          current_lesson_index?: number
          current_page_index?: number
          id?: string
          lesson_sequence?: Json
          phone_number?: string
          total_lessons?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          description: string | null
          id: string
          language: string
          name: string
          order: number | null
        }
        Insert: {
          description?: string | null
          id: string
          language: string
          name: string
          order?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          language?: string
          name?: string
          order?: number | null
        }
        Relationships: []
      }
      content_chapters: {
        Row: {
          category_id: string
          description: string | null
          id: string
          language: string
          order: number | null
          title: string
        }
        Insert: {
          category_id: string
          description?: string | null
          id?: string
          language: string
          order?: number | null
          title: string
        }
        Update: {
          category_id?: string
          description?: string | null
          id?: string
          language?: string
          order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_chapters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          cached_audio_urls: Json | null
          chapter_id: string
          content: Json
          id: string
          order: number | null
          title: string
        }
        Insert: {
          cached_audio_urls?: Json | null
          chapter_id: string
          content: Json
          id?: string
          order?: number | null
          title: string
        }
        Update: {
          cached_audio_urls?: Json | null
          chapter_id?: string
          content?: Json
          id?: string
          order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "content_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          completed_at: string
          content_item_id: string
          id: string
          phone_number: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          content_item_id: string
          id?: string
          phone_number: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          content_item_id?: string
          id?: string
          phone_number?: string
          user_id?: string | null
        }
        Relationships: []
      }
      designs: {
        Row: {
          created_at: string | null
          css: string
          editable_fields: Json
          html: string
          id: string
          js: string
          prompt: string
          runtime_html: string
          title: string
        }
        Insert: {
          created_at?: string | null
          css?: string
          editable_fields: Json
          html: string
          id?: string
          js?: string
          prompt: string
          runtime_html: string
          title: string
        }
        Update: {
          created_at?: string | null
          css?: string
          editable_fields?: Json
          html?: string
          id?: string
          js?: string
          prompt?: string
          runtime_html?: string
          title?: string
        }
        Relationships: []
      }
      email_receivers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          personalized_body: string | null
          personalized_subject: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          personalized_body?: string | null
          personalized_subject?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          personalized_body?: string | null
          personalized_subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_receivers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          subject: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          subject: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          file_id: string
          file_name: string
          file_type: string
          id: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_id: string
          file_name: string
          file_type: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string
          file_name?: string
          file_type?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          cards: Json
          created_at: string | null
          difficulty: string
          id: string
          title: string
        }
        Insert: {
          cards: Json
          created_at?: string | null
          difficulty: string
          id?: string
          title: string
        }
        Update: {
          cards?: Json
          created_at?: string | null
          difficulty?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      flix_episodes: {
        Row: {
          created_at: string
          description: string | null
          episode_number: number
          id: string
          is_active: boolean
          program_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          episode_number?: number
          id?: string
          is_active?: boolean
          program_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          episode_number?: number
          id?: string
          is_active?: boolean
          program_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "flix_episodes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "flix_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      flix_videos: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_active: boolean
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      free_trials: {
        Row: {
          completed: boolean
          created_at: string
          expires_at: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      genius: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          is_authorized: boolean
          last_login: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          last_login?: string
          phone_number: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          last_login?: string
          phone_number?: string
        }
        Relationships: []
      }
      group_classes: {
        Row: {
          badge: string
          created_at: string
          days: string
          description: string
          display_time: string
          id: string
          image_url: string
          is_active: boolean
          is_american: boolean
          level: string
          link: string
          sort_priority: number
          start_time: string
          teachers: string
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string
          created_at?: string
          days?: string
          description?: string
          display_time?: string
          id?: string
          image_url?: string
          is_active?: boolean
          is_american?: boolean
          level?: string
          link?: string
          sort_priority?: number
          start_time?: string
          teachers?: string
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string
          created_at?: string
          days?: string
          description?: string
          display_time?: string
          id?: string
          image_url?: string
          is_active?: boolean
          is_american?: boolean
          level?: string
          link?: string
          sort_priority?: number
          start_time?: string
          teachers?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      image_optimizations: {
        Row: {
          compression_ratio: number | null
          created_at: string | null
          error_message: string | null
          file_size_after: number | null
          file_size_before: number | null
          id: string
          optimized_url: string | null
          original_url: string
          source_record_id: string | null
          source_table: string | null
          source_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          compression_ratio?: number | null
          created_at?: string | null
          error_message?: string | null
          file_size_after?: number | null
          file_size_before?: number | null
          id?: string
          optimized_url?: string | null
          original_url: string
          source_record_id?: string | null
          source_table?: string | null
          source_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          compression_ratio?: number | null
          created_at?: string | null
          error_message?: string | null
          file_size_after?: number | null
          file_size_before?: number | null
          id?: string
          optimized_url?: string | null
          original_url?: string
          source_record_id?: string | null
          source_table?: string | null
          source_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      image_optimizer_runs: {
        Row: {
          batch_size: number
          created_at: string | null
          current_original_url: string | null
          done_count: number
          error_count: number
          finished_at: string | null
          heartbeat_at: string | null
          id: string
          last_message: string | null
          mode: string
          processed_count: number
          run_type: string
          scope: string
          skipped_count: number
          started_at: string | null
          status: string
          stop_requested: boolean
          threshold_bytes: number
          updated_at: string | null
        }
        Insert: {
          batch_size?: number
          created_at?: string | null
          current_original_url?: string | null
          done_count?: number
          error_count?: number
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          last_message?: string | null
          mode?: string
          processed_count?: number
          run_type?: string
          scope?: string
          skipped_count?: number
          started_at?: string | null
          status?: string
          stop_requested?: boolean
          threshold_bytes?: number
          updated_at?: string | null
        }
        Update: {
          batch_size?: number
          created_at?: string | null
          current_original_url?: string | null
          done_count?: number
          error_count?: number
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          last_message?: string | null
          mode?: string
          processed_count?: number
          run_type?: string
          scope?: string
          skipped_count?: number
          started_at?: string | null
          status?: string
          stop_requested?: boolean
          threshold_bytes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      jeffrey_course_progress: {
        Row: {
          book_number: number
          current_lesson_id: string
          current_page_index: number | null
          id: string
          level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_number: number
          current_lesson_id: string
          current_page_index?: number | null
          id?: string
          level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_number?: number
          current_lesson_id?: string
          current_page_index?: number | null
          id?: string
          level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      koe_user_flashcards: {
        Row: {
          acquired_at: string
          audio_url: string | null
          created_at: string
          difficulty: string
          id: string
          lesson_id: string
          user_id: string
          word_context: string | null
          word_english: string
        }
        Insert: {
          acquired_at?: string
          audio_url?: string | null
          created_at?: string
          difficulty: string
          id?: string
          lesson_id: string
          user_id: string
          word_context?: string | null
          word_english: string
        }
        Update: {
          acquired_at?: string
          audio_url?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          lesson_id?: string
          user_id?: string
          word_context?: string | null
          word_english?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          difficulty: string
          id: string
          lesson_id: string
          phone_number: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          difficulty: string
          id?: string
          lesson_id: string
          phone_number?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          difficulty?: string
          id?: string
          lesson_id?: string
          phone_number?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          cached_audio_urls: Json | null
          content: Json
          description: string
          difficulty: string
          id: string
          koe_flashcard_words: Json | null
          title: string
        }
        Insert: {
          cached_audio_urls?: Json | null
          content: Json
          description: string
          difficulty: string
          id: string
          koe_flashcard_words?: Json | null
          title: string
        }
        Update: {
          cached_audio_urls?: Json | null
          content?: Json
          description?: string
          difficulty?: string
          id?: string
          koe_flashcard_words?: Json | null
          title?: string
        }
        Relationships: []
      }
      lessons_spanish: {
        Row: {
          cached_audio_urls: Json | null
          content: Json
          description: string
          difficulty: string
          id: string
          title: string
        }
        Insert: {
          cached_audio_urls?: Json | null
          content: Json
          description: string
          difficulty: string
          id: string
          title: string
        }
        Update: {
          cached_audio_urls?: Json | null
          content?: Json
          description?: string
          difficulty?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      perguntas_dificil: {
        Row: {
          category: string
          created_at: string | null
          id: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      perguntas_dificil_spanish: {
        Row: {
          category: string
          created_at: string | null
          id: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      perguntas_facil: {
        Row: {
          category: string
          created_at: string | null
          id: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      perguntas_facil_spanish: {
        Row: {
          category: string
          created_at: string | null
          id: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      perguntas_medio: {
        Row: {
          category: string
          created_at: string | null
          id: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      perguntas_medio_spanish: {
        Row: {
          category: string
          created_at: string | null
          id: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      preset_flashcard_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      preset_flashcards: {
        Row: {
          audio_url: string
          back_text: string
          category_id: string
          created_at: string
          front_text: string
          id: string
          order_index: number
          updated_at: string
        }
        Insert: {
          audio_url: string
          back_text: string
          category_id: string
          created_at?: string
          front_text: string
          id?: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          audio_url?: string
          back_text?: string
          category_id?: string
          created_at?: string
          front_text?: string
          id?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_flashcards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "preset_flashcard_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_page_settings: {
        Row: {
          id: string
          page_subtitle: string
          page_title: string
          platform_url: string
          tutorial_url: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_subtitle?: string
          page_title?: string
          platform_url?: string
          tutorial_url?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_subtitle?: string
          page_title?: string
          platform_url?: string
          tutorial_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      s2csv_checkouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: number
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: number
          session_id: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: number
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      s2csv_credits: {
        Row: {
          credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      s2csv_device_credits: {
        Row: {
          cid: string
          credits: number
          updated_at: string
        }
        Insert: {
          cid: string
          credits?: number
          updated_at?: string
        }
        Update: {
          cid?: string
          credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      s2csv_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      s2csv_statements: {
        Row: {
          converted_data: Json
          created_at: string
          file_type: string
          filename: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          converted_data: Json
          created_at?: string
          file_type: string
          filename: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          converted_data?: Json
          created_at?: string
          file_type?: string
          filename?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      s2csv_used_codes: {
        Row: {
          code: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_designs: {
        Row: {
          created_at: string
          id: string
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          template_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secretaria_schedules: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          kind: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
        }
        Relationships: []
      }
      slideshows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mobile_mode: boolean | null
          slides: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mobile_mode?: boolean | null
          slides?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mobile_mode?: boolean | null
          slides?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teacher_student_progress: {
        Row: {
          created_at: string
          current_page: number
          difficulty: string
          id: string
          lesson_id: string
          lesson_title: string
          teacher_phone_number: string
          teacher_student_id: string
          total_pages: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_page?: number
          difficulty?: string
          id?: string
          lesson_id: string
          lesson_title: string
          teacher_phone_number: string
          teacher_student_id: string
          total_pages?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_page?: number
          difficulty?: string
          id?: string
          lesson_id?: string
          lesson_title?: string
          teacher_phone_number?: string
          teacher_student_id?: string
          total_pages?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_student_progress_teacher_student_id_fkey"
            columns: ["teacher_student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_students: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      toefl_categories: {
        Row: {
          description: string | null
          id: string
          language: string
          name: string
          order_index: number | null
        }
        Insert: {
          description?: string | null
          id: string
          language?: string
          name: string
          order_index?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          language?: string
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      toefl_chapters: {
        Row: {
          category_id: string
          description: string | null
          id: string
          language: string
          order_index: number | null
          title: string
        }
        Insert: {
          category_id: string
          description?: string | null
          id?: string
          language?: string
          order_index?: number | null
          title: string
        }
        Update: {
          category_id?: string
          description?: string | null
          id?: string
          language?: string
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      toefl_items: {
        Row: {
          cached_audio_urls: Json | null
          category_id: string | null
          chapter_id: string | null
          content: Json
          id: string
          order_index: number | null
          title: string
        }
        Insert: {
          cached_audio_urls?: Json | null
          category_id?: string | null
          chapter_id?: string | null
          content: Json
          id?: string
          order_index?: number | null
          title: string
        }
        Update: {
          cached_audio_urls?: Json | null
          category_id?: string | null
          chapter_id?: string | null
          content?: Json
          id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      user_flashcards: {
        Row: {
          audio_url: string | null
          back_text: string
          created_at: string
          front_text: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          back_text: string
          created_at?: string
          front_text: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          back_text?: string
          created_at?: string
          front_text?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          awarded_at: string
          created_at: string
          difficulty: string
          id: string
          lesson_id: string
          phone_number: string | null
          points: number
          user_id: string | null
        }
        Insert: {
          awarded_at?: string
          created_at?: string
          difficulty: string
          id?: string
          lesson_id: string
          phone_number?: string | null
          points?: number
          user_id?: string | null
        }
        Update: {
          awarded_at?: string
          created_at?: string
          difficulty?: string
          id?: string
          lesson_id?: string
          phone_number?: string | null
          points?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_authorized: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          is_authorized?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          id: string
          language: string
          phone_number: string
          progress_percentage: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          phone_number: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          phone_number?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_login: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_login?: string
          phone_number: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_login?: string
          phone_number?: string
        }
        Relationships: []
      }
      user_signatures: {
        Row: {
          company_name: string | null
          company_role: string | null
          created_at: string
          greeting: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          company_role?: string | null
          created_at?: string
          greeting?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          company_role?: string | null
          created_at?: string
          greeting?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          last_login: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_login?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          last_login?: string
          username?: string
        }
        Relationships: []
      }
      video_quiz_questions: {
        Row: {
          correct_answers: Json
          created_at: string
          id: string
          lesson_id: string
          question: string
          timestamp_seconds: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          correct_answers?: Json
          created_at?: string
          id?: string
          lesson_id: string
          question: string
          timestamp_seconds: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          correct_answers?: Json
          created_at?: string
          id?: string
          lesson_id?: string
          question?: string
          timestamp_seconds?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      visitors: {
        Row: {
          address: string | null
          birthdate: string | null
          building_id: string | null
          consent_accepted_at: string | null
          consent_version: string | null
          created_at: string
          description: string | null
          document_number: string | null
          face_id_verification: string | null
          face_image_url: string | null
          full_name: string | null
          id: string
          id_image_url: string | null
          labels: string[] | null
          nationality: string | null
          notes: string | null
          source: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birthdate?: string | null
          building_id?: string | null
          consent_accepted_at?: string | null
          consent_version?: string | null
          created_at?: string
          description?: string | null
          document_number?: string | null
          face_id_verification?: string | null
          face_image_url?: string | null
          full_name?: string | null
          id?: string
          id_image_url?: string | null
          labels?: string[] | null
          nationality?: string | null
          notes?: string | null
          source?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birthdate?: string | null
          building_id?: string | null
          consent_accepted_at?: string | null
          consent_version?: string | null
          created_at?: string
          description?: string | null
          document_number?: string | null
          face_id_verification?: string | null
          face_image_url?: string | null
          full_name?: string | null
          id?: string
          id_image_url?: string | null
          labels?: string[] | null
          nationality?: string | null
          notes?: string | null
          source?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app2_authorize_self: {
        Args: { preapproval_id: string }
        Returns: boolean
      }
      app2_ensure_profile: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_authorized: boolean
          mercado_pago_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "app2_user_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      app2_get_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_authorized: boolean
        }[]
      }
      app2_get_pending_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      app2_is_admin_user: { Args: never; Returns: boolean }
      app2_update_user_authorization: {
        Args: {
          new_is_admin?: boolean
          new_is_authorized: boolean
          profile_id: string
        }
        Returns: boolean
      }
      authorize_user: { Args: { target_user_id: string }; Returns: boolean }
      email_cleanup_expired_users: { Args: never; Returns: undefined }
      email_create_profile_for_existing_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      email_get_all_users: {
        Args: never
        Returns: {
          authorized_at: string
          created_at: string
          display_name: string
          email: string
          expires_at: string
          id: string
          is_admin: boolean
          is_authorized: boolean
          phone: string
        }[]
      }
      email_is_admin_user: { Args: never; Returns: boolean }
      email_update_user_authorization:
        | {
            Args: {
              p_explicit_expiration_date?: string
              p_is_admin?: boolean
              p_is_authorized: boolean
              p_set_expiration_interval?: string
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              new_is_admin?: boolean
              new_is_authorized: boolean
              target_user_id: string
            }
            Returns: boolean
          }
      get_pending_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      is_admin_user: { Args: never; Returns: boolean }
      revoke_user_authorization: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      s2csv_add_credits: {
        Args: { delta: number; uid: string }
        Returns: undefined
      }
      s2csv_add_device_credits: {
        Args: { p_cid: string; p_delta: number }
        Returns: undefined
      }
      s2csv_consume_credit: {
        Args: { delta: number; uid: string }
        Returns: boolean
      }
      s2csv_consume_device_credit: {
        Args: { p_cid: string; p_delta: number }
        Returns: boolean
      }
      s2csv_get_credits: { Args: { uid: string }; Returns: number }
      s2csv_get_device_credits: { Args: { p_cid: string }; Returns: number }
      toggle_admin_status: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      update_user_authorization: {
        Args: {
          new_is_admin?: boolean
          new_is_authorized: boolean
          profile_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
