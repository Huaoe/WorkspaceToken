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
      property_requests: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          location: string
          expected_price: string
          image_url?: string
          documents_url?: string
          number_of_tokens: string
          status: 'pending' | 'approved' | 'rejected' | 'onchain' | 'live'
          token_name: string
          token_symbol: string
          token_address?: string
          owner_address?: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          location: string
          expected_price: string
          image_url?: string
          documents_url?: string
          number_of_tokens: string
          status?: 'pending' | 'approved' | 'rejected' | 'onchain' | 'live'
          token_name: string
          token_symbol: string
          token_address?: string
          owner_address?: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          location?: string
          expected_price?: string
          image_url?: string
          documents_url?: string
          number_of_tokens?: string
          status?: 'pending' | 'approved' | 'rejected' | 'onchain' | 'live'
          token_name?: string
          token_symbol?: string
          token_address?: string
          owner_address?: string
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
  }
}
