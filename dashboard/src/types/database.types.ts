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
      clinics_pending_review: {
        Row: {
          // Core identifiers
          id: string
          hcp_number: string
          application_number: string | null
          clinic_name: string

          // Address fields
          address: string | null
          city: string | null
          state: string
          zip: string | null

          // Contact fields (primary)
          contact_phone: string | null
          contact_email: string | null
          contact_is_consultant: boolean

          // NEW: Mail contact fields from USAC
          mail_contact_first_name: string | null
          mail_contact_last_name: string | null
          mail_contact_org_name: string | null
          mail_contact_phone: string | null
          mail_contact_email: string | null
          mail_contact_is_consultant: boolean

          // Filing details
          filing_date: string
          form_465_hash: string

          // NEW: USAC Form 465 fields
          funding_year: string | null
          application_type: string | null
          allowable_contract_start_date: string | null
          form_465_pdf_url: string | null

          // Service details
          service_type: string | null
          contract_length: number | null

          // NEW: Historical funding (JSONB array)
          historical_funding: Json | null

          // Additional documents
          additional_documents: Json | null

          // Internal tracking
          processed: boolean
          outreach_status: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
          assigned_to: string | null
          notes: string | null
          email_draft_created: boolean

          // System timestamps
          created_at: string
          updated_at: string
        }
        Insert: {
          // Core identifiers
          id?: string
          hcp_number: string
          application_number?: string | null
          clinic_name: string

          // Address fields
          address?: string | null
          city?: string | null
          state: string
          zip?: string | null

          // Contact fields (primary)
          contact_phone?: string | null
          contact_email?: string | null
          contact_is_consultant?: boolean

          // Mail contact fields
          mail_contact_first_name?: string | null
          mail_contact_last_name?: string | null
          mail_contact_org_name?: string | null
          mail_contact_phone?: string | null
          mail_contact_email?: string | null
          mail_contact_is_consultant?: boolean

          // Filing details
          filing_date: string
          form_465_hash: string

          // USAC Form 465 fields
          funding_year?: string | null
          application_type?: string | null
          allowable_contract_start_date?: string | null
          form_465_pdf_url?: string | null

          // Service details
          service_type?: string | null
          contract_length?: number | null

          // Historical funding (JSONB array)
          historical_funding?: Json | null

          // Additional documents
          additional_documents?: Json | null

          // Internal tracking
          processed?: boolean
          outreach_status?: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
          assigned_to?: string | null
          notes?: string | null
          email_draft_created?: boolean

          // System timestamps
          created_at?: string
          updated_at?: string
        }
        Update: {
          // Core identifiers
          id?: string
          hcp_number?: string
          application_number?: string | null
          clinic_name?: string

          // Address fields
          address?: string | null
          city?: string | null
          state?: string
          zip?: string | null

          // Contact fields (primary)
          contact_phone?: string | null
          contact_email?: string | null
          contact_is_consultant?: boolean

          // Mail contact fields
          mail_contact_first_name?: string | null
          mail_contact_last_name?: string | null
          mail_contact_org_name?: string | null
          mail_contact_phone?: string | null
          mail_contact_email?: string | null
          mail_contact_is_consultant?: boolean

          // Filing details
          filing_date?: string
          form_465_hash?: string

          // USAC Form 465 fields
          funding_year?: string | null
          application_type?: string | null
          allowable_contract_start_date?: string | null
          form_465_pdf_url?: string | null

          // Service details
          service_type?: string | null
          contract_length?: number | null

          // Historical funding (JSONB array)
          historical_funding?: Json | null

          // Additional documents
          additional_documents?: Json | null

          // Internal tracking
          processed?: boolean
          outreach_status?: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
          assigned_to?: string | null
          notes?: string | null
          email_draft_created?: boolean

          // System timestamps
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          id: string
          title: string
          message: string
          type: string
          severity: string
          url: string | null
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          title: string
          message: string
          type: string
          severity?: string
          url?: string | null
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: string
          severity?: string
          url?: string | null
          created_at?: string
          read?: boolean
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

// Helper type for historical funding array items
export interface HistoricalFundingItem {
  year: string
  amount: number
}
