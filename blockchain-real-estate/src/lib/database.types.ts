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
      properties: {
        Row: {
          id: number
          created_at: string
          title: string
          description: string
          location: string
          image_url: string
          token_address: string
          price_per_token: number
          total_tokens: number
          available_tokens: number
          owner_address: string
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          description: string
          location: string
          image_url: string
          token_address: string
          price_per_token: number
          total_tokens: number
          available_tokens: number
          owner_address: string
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          description?: string
          location?: string
          image_url?: string
          token_address?: string
          price_per_token?: number
          total_tokens?: number
          available_tokens?: number
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
