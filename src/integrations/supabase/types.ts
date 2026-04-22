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
      applications: {
        Row: {
          applicant_name: string
          applicant_phone: string | null
          branch_id: string
          created_at: string
          desired_date: string | null
          desired_room_type_id: string | null
          id: string
          kind: Database["public"]["Enums"]["application_kind"]
          memo: string | null
          owner_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_name: string
          applicant_phone?: string | null
          branch_id: string
          created_at?: string
          desired_date?: string | null
          desired_room_type_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["application_kind"]
          memo?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          applicant_phone?: string | null
          branch_id?: string
          created_at?: string
          desired_date?: string | null
          desired_room_type_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["application_kind"]
          memo?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_desired_room_type_id_fkey"
            columns: ["desired_room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_settings: {
        Row: {
          auto_send_contract: boolean
          auto_send_invoice: boolean
          auto_send_movein: boolean
          auto_send_moveout: boolean
          branch_id: string
          created_at: string
          extra: Json
          gallery: Json
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          auto_send_contract?: boolean
          auto_send_invoice?: boolean
          auto_send_movein?: boolean
          auto_send_moveout?: boolean
          branch_id: string
          created_at?: string
          extra?: Json
          gallery?: Json
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          auto_send_contract?: boolean
          auto_send_invoice?: boolean
          auto_send_movein?: boolean
          auto_send_moveout?: boolean
          branch_id?: string
          created_at?: string
          extra?: Json
          gallery?: Json
          id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          business_number: string | null
          created_at: string
          id: string
          memo: string | null
          name: string
          owner_id: string
          phone: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          business_number?: string | null
          created_at?: string
          id?: string
          memo?: string | null
          name: string
          owner_id: string
          phone?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          business_number?: string | null
          created_at?: string
          id?: string
          memo?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string | null
          category: Database["public"]["Enums"]["post_category"]
          content: string
          cover_image: string | null
          created_at: string
          id: string
          pinned: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["post_category"]
          content: string
          cover_image?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["post_category"]
          content?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          branch_id: string
          created_at: string
          event_date: string
          event_time: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          memo: string | null
          owner_id: string
          room_id: string | null
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          event_date: string
          event_time?: string | null
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          memo?: string | null
          owner_id: string
          room_id?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          event_date?: string
          event_time?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          memo?: string | null
          owner_id?: string
          room_id?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          branch_id: string
          created_at: string
          due_date: string
          id: string
          memo: string | null
          owner_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          branch_id: string
          created_at?: string
          due_date: string
          id?: string
          memo?: string | null
          owner_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string
          created_at?: string
          due_date?: string
          id?: string
          memo?: string | null
          owner_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_types: {
        Row: {
          branch_id: string
          created_at: string
          deposit: number
          id: string
          monthly_rent: number
          name: string
          options: Json
          owner_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          deposit?: number
          id?: string
          monthly_rent?: number
          name: string
          options?: Json
          owner_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          deposit?: number
          id?: string
          monthly_rent?: number
          name?: string
          options?: Json
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          branch_id: string
          created_at: string
          floor: number | null
          id: string
          memo: string | null
          owner_id: string
          room_number: string
          room_type_id: string | null
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          floor?: number | null
          id?: string
          memo?: string | null
          owner_id: string
          room_number: string
          room_type_id?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          floor?: number | null
          id?: string
          memo?: string | null
          owner_id?: string
          room_number?: string
          room_type_id?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      support_inquiries: {
        Row: {
          created_at: string
          id: string
          message: string
          reply: string | null
          resolved: boolean
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          reply?: string | null
          resolved?: boolean
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          reply?: string | null
          resolved?: boolean
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          branch_id: string
          created_at: string
          deposit: number | null
          emergency_contact: string | null
          id: string
          memo: string | null
          monthly_rent: number | null
          move_in_date: string | null
          move_out_date: string | null
          name: string
          owner_id: string
          payment_day: number | null
          phone: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          deposit?: number | null
          emergency_contact?: string | null
          id?: string
          memo?: string | null
          monthly_rent?: number | null
          move_in_date?: string | null
          move_out_date?: string | null
          name: string
          owner_id: string
          payment_day?: number | null
          phone?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          deposit?: number | null
          emergency_contact?: string | null
          id?: string
          memo?: string | null
          monthly_rent?: number | null
          move_in_date?: string | null
          move_out_date?: string | null
          name?: string
          owner_id?: string
          payment_day?: number | null
          phone?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "staff" | "admin"
      application_kind: "room_tour" | "move_in"
      application_status: "pending" | "approved" | "rejected" | "completed"
      event_kind: "move_in" | "move_out" | "inspection" | "room_tour" | "memo"
      invoice_status: "unpaid" | "paid" | "overdue" | "canceled"
      post_category: "notice" | "event" | "tip" | "update"
      room_status: "occupied" | "vacant" | "cleaning" | "maintenance"
      tenant_status: "active" | "overdue" | "moved_out"
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
      app_role: ["owner", "staff", "admin"],
      application_kind: ["room_tour", "move_in"],
      application_status: ["pending", "approved", "rejected", "completed"],
      event_kind: ["move_in", "move_out", "inspection", "room_tour", "memo"],
      invoice_status: ["unpaid", "paid", "overdue", "canceled"],
      post_category: ["notice", "event", "tip", "update"],
      room_status: ["occupied", "vacant", "cleaning", "maintenance"],
      tenant_status: ["active", "overdue", "moved_out"],
    },
  },
} as const
