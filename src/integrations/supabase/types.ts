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
      accounts: {
        Row: {
          account_type: string | null
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          screenshot_url: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          referral_code_used: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          referral_code_used?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          referral_code_used?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          commission_percent: number
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          commission_percent?: number
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          commission_percent?: number
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_id: string
          bias_1d: string | null
          created_at: string
          custom_fields: Json | null
          direction: string | null
          end_balance: number | null
          entry_price: number | null
          entry_time: string | null
          exit_time: string | null
          follow_plan: boolean | null
          id: string
          lot_size: number | null
          notes: string | null
          pair: string | null
          pips: number | null
          pnl_amount: number
          result: string | null
          start_balance: number | null
          stop_loss: number | null
          tags: string[] | null
          take_profit: number | null
          user_id: string
          went: string | null
        }
        Insert: {
          account_id: string
          bias_1d?: string | null
          created_at?: string
          custom_fields?: Json | null
          direction?: string | null
          end_balance?: number | null
          entry_price?: number | null
          entry_time?: string | null
          exit_time?: string | null
          follow_plan?: boolean | null
          id?: string
          lot_size?: number | null
          notes?: string | null
          pair?: string | null
          pips?: number | null
          pnl_amount?: number
          result?: string | null
          start_balance?: number | null
          stop_loss?: number | null
          tags?: string[] | null
          take_profit?: number | null
          user_id: string
          went?: string | null
        }
        Update: {
          account_id?: string
          bias_1d?: string | null
          created_at?: string
          custom_fields?: Json | null
          direction?: string | null
          end_balance?: number | null
          entry_price?: number | null
          entry_time?: string | null
          exit_time?: string | null
          follow_plan?: boolean | null
          id?: string
          lot_size?: number | null
          notes?: string | null
          pair?: string | null
          pips?: number | null
          pnl_amount?: number
          result?: string | null
          start_balance?: number | null
          stop_loss?: number | null
          tags?: string[] | null
          take_profit?: number | null
          user_id?: string
          went?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      add_trade_and_update_balance:
        | {
            Args: {
              p_account_id: string
              p_entry_price?: number
              p_follow_plan?: boolean
              p_notes?: string
              p_pnl_amount?: number
              p_result?: string
              p_stop_loss?: number
              p_tags?: string[]
              p_take_profit?: number
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_account_id: string
              p_bias_1d?: string
              p_custom_fields?: Json
              p_direction?: string
              p_end_balance?: number
              p_entry_price?: number
              p_entry_time?: string
              p_exit_time?: string
              p_follow_plan?: boolean
              p_lot_size?: number
              p_notes?: string
              p_pair?: string
              p_pips?: number
              p_pnl_amount?: number
              p_result?: string
              p_start_balance?: number
              p_stop_loss?: number
              p_tags?: string[]
              p_take_profit?: number
              p_user_id: string
              p_went?: string
            }
            Returns: string
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
