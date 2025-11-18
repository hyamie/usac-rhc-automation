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
          request_for_services?: string | null
          service_type?: string | null
          contract_length?: number | null

          // NEW: Historical funding (JSONB array)
          historical_funding: Json | null

          // Additional documents
          additional_documents: Json | null

          // Internal tracking
          processed: boolean
          outreach_status: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
          assigned_to: string | null
          notes: Json | null  // JSONB array of NoteItem objects
          email_draft_created: boolean

          // Manual grouping
          belongs_to_group_id: string | null

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
          request_for_services?: string | null
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
          notes?: Json | null  // JSONB array of NoteItem objects
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
          request_for_services?: string | null
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
          notes?: Json | null  // JSONB array of NoteItem objects
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
      clinic_groups: {
        Row: {
          id: string
          group_name: string
          primary_clinic_id: string | null
          total_funding_amount: number | null
          location_count: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_name: string
          primary_clinic_id?: string | null
          total_funding_amount?: number | null
          location_count?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_name?: string
          primary_clinic_id?: string | null
          total_funding_amount?: number | null
          location_count?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clinic_groups_primary_clinic_id_fkey'
            columns: ['primary_clinic_id']
            referencedRelation: 'clinics_pending_review'
            referencedColumns: ['id']
          }
        ]
      }
      clinic_group_members: {
        Row: {
          id: string
          group_id: string
          clinic_id: string
          added_at: string
        }
        Insert: {
          id?: string
          group_id: string
          clinic_id: string
          added_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          clinic_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clinic_group_members_group_id_fkey'
            columns: ['group_id']
            referencedRelation: 'clinic_groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'clinic_group_members_clinic_id_fkey'
            columns: ['clinic_id']
            referencedRelation: 'clinics_pending_review'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

// Helper type for location within funding year
export interface FundingLocation {
  frn: string           // Funding Request Number
  amount: number        // Amount for this specific location
  name: string          // Service delivery site name
  street: string        // Service delivery site street
  city: string          // Service delivery site city
  state: string         // Service delivery site state
  zip: string           // Service delivery site ZIP code
}

// Helper type for historical funding array items
export interface HistoricalFundingItem {
  year: string
  amount: number
  locations?: FundingLocation[]  // Optional for backward compatibility
}

// Helper type for notes array items
export interface NoteItem {
  timestamp: string  // ISO 8601 timestamp
  note: string       // The note text content
}
