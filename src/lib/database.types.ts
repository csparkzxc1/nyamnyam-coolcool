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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      babies: {
        Row: {
          birth_date: string
          created_at: string
          created_by: string
          feeding_type: string
          gender: string | null
          id: string
          name: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          birth_date: string
          created_at?: string
          created_by: string
          feeding_type: string
          gender?: string | null
          id?: string
          name: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string
          created_at?: string
          created_by?: string
          feeding_type?: string
          gender?: string | null
          id?: string
          name?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      bath_records: {
        Row: {
          at: string
          baby_id: string
          created_at: string
          created_by: string
          id: string
          note: string | null
        }
        Insert: {
          at: string
          baby_id: string
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
        }
        Update: {
          at?: string
          baby_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bath_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          baby_id: string
          created_at: string
          id: string
          permissions: string[]
          role: string
          user_id: string
        }
        Insert: {
          baby_id: string
          created_at?: string
          id?: string
          permissions?: string[]
          role: string
          user_id: string
        }
        Update: {
          baby_id?: string
          created_at?: string
          id?: string
          permissions?: string[]
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregivers_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      diaper_records: {
        Row: {
          at: string
          baby_id: string
          color: string | null
          created_at: string
          created_by: string
          id: string
          type: string
        }
        Insert: {
          at: string
          baby_id: string
          color?: string | null
          created_at?: string
          created_by: string
          id?: string
          type: string
        }
        Update: {
          at?: string
          baby_id?: string
          color?: string | null
          created_at?: string
          created_by?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "diaper_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_records: {
        Row: {
          amount_ml: number | null
          baby_id: string
          created_at: string
          created_by: string
          end_at: string | null
          id: string
          note: string | null
          start_at: string
          type: string
        }
        Insert: {
          amount_ml?: number | null
          baby_id: string
          created_at?: string
          created_by: string
          end_at?: string | null
          id?: string
          note?: string | null
          start_at: string
          type: string
        }
        Update: {
          amount_ml?: number | null
          baby_id?: string
          created_at?: string
          created_by?: string
          end_at?: string | null
          id?: string
          note?: string | null
          start_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          baby_id: string
          created_at: string
          expires_at: string
          invited_by: string
          role: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          baby_id: string
          created_at?: string
          expires_at?: string
          invited_by: string
          role: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          baby_id?: string
          created_at?: string
          expires_at?: string
          invited_by?: string
          role?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_records: {
        Row: {
          baby_id: string
          created_at: string
          created_by: string
          head_circumference_cm: number | null
          height_cm: number | null
          id: string
          measured_at: string
          note: string | null
          weight_kg: number | null
        }
        Insert: {
          baby_id: string
          created_at?: string
          created_by: string
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          measured_at: string
          note?: string | null
          weight_kg?: number | null
        }
        Update: {
          baby_id?: string
          created_at?: string
          created_by?: string
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          measured_at?: string
          note?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_records: {
        Row: {
          baby_id: string
          created_at: string
          created_by: string
          end_at: string | null
          id: string
          quality: number | null
          start_at: string
          type: string
        }
        Insert: {
          baby_id: string
          created_at?: string
          created_by: string
          end_at?: string | null
          id?: string
          quality?: number | null
          start_at: string
          type: string
        }
        Update: {
          baby_id?: string
          created_at?: string
          created_by?: string
          end_at?: string | null
          id?: string
          quality?: number | null
          start_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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