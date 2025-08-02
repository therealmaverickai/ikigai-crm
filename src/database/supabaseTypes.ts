export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          industry: string | null
          size: string | null
          website: string | null
          phone: string | null
          email: string | null
          address: Json | null
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          size?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          address?: Json | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          size?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          address?: Json | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          company_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          position: string | null
          department: string | null
          is_primary: boolean | null
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          position?: string | null
          department?: string | null
          is_primary?: boolean | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          position?: string | null
          department?: string | null
          is_primary?: boolean | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          company_id: string | null
          contact_id: string | null
          title: string
          value: number | null
          currency: string | null
          stage: string
          probability: number | null
          expected_close_date: string | null
          actual_close_date: string | null
          description: string | null
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          contact_id?: string | null
          title: string
          value?: number | null
          currency?: string | null
          stage: string
          probability?: number | null
          expected_close_date?: string | null
          actual_close_date?: string | null
          description?: string | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          contact_id?: string | null
          title?: string
          value?: number | null
          currency?: string | null
          stage?: string
          probability?: number | null
          expected_close_date?: string | null
          actual_close_date?: string | null
          description?: string | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string | null
          deal_id: string | null
          title: string
          description: string | null
          status: string
          start_date: string | null
          end_date: string | null
          budget: Json | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          deal_id?: string | null
          title: string
          description?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: Json | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          deal_id?: string | null
          title?: string
          description?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: Json | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          project_id: string | null
          resource_name: string | null
          description: string | null
          start_time: string | null
          duration: number | null
          date: string
          tags: string[] | null
          billable: boolean | null
          hourly_rate: number | null
          currency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          resource_name?: string | null
          description?: string | null
          start_time?: string | null
          duration?: number | null
          date: string
          tags?: string[] | null
          billable?: boolean | null
          hourly_rate?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          resource_name?: string | null
          description?: string | null
          start_time?: string | null
          duration?: number | null
          date?: string
          tags?: string[] | null
          billable?: boolean | null
          hourly_rate?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
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