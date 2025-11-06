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
          id: string
          hcp_number: string
          application_number: string | null
          clinic_name: string
          address: string | null
          city: string | null
          state: string
          zip: string | null
          contact_name: string | null
          contact_title: string | null
          contact_email: string | null
          contact_phone: string | null
          filing_date: string
          form_465_hash: string
          service_type: string | null
          contract_length: number | null
          bandwidth: string | null
          priority_score: number | null
          priority_label: string | null
          total_funding_3y: number | null
          location_count: number | null
          participation_years: number | null
          review_status: string | null
          enriched: boolean
          enrichment_date: string | null
          enrichment_finding: string | null
          email_draft_created: boolean
          email_subject: string | null
          email_body: string | null
          processed: boolean
          created_at: string
          updated_at: string
          // Phase 2 fields
          is_consultant: boolean | null
          consultant_company: string | null
          consultant_email_domain: string | null
          consultant_detection_method: string | null
          funding_year_1: number | null
          funding_amount_1: number | null
          funding_year_2: number | null
          funding_amount_2: number | null
          funding_year_3: number | null
          funding_amount_3: number | null
          form_465_pdf_url: string | null
          posting_date: string | null
          allowable_contract_start_date: string | null
          program_type: string | null
          mail_contact_name: string | null
          mail_contact_email: string | null
          mail_contact_company: string | null
          description_of_services: string | null
        }
        Insert: {
          id?: string
          hcp_number: string
          application_number?: string | null
          clinic_name: string
          address?: string | null
          city?: string | null
          state: string
          zip?: string | null
          contact_name?: string | null
          contact_title?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          filing_date: string
          form_465_hash: string
          service_type?: string | null
          contract_length?: number | null
          bandwidth?: string | null
          priority_score?: number | null
          priority_label?: string | null
          total_funding_3y?: number | null
          location_count?: number | null
          participation_years?: number | null
          review_status?: string | null
          enriched?: boolean
          enrichment_date?: string | null
          enrichment_finding?: string | null
          email_draft_created?: boolean
          email_subject?: string | null
          email_body?: string | null
          processed?: boolean
          created_at?: string
          updated_at?: string
          is_consultant?: boolean | null
          consultant_company?: string | null
          consultant_email_domain?: string | null
          consultant_detection_method?: string | null
          funding_year_1?: number | null
          funding_amount_1?: number | null
          funding_year_2?: number | null
          funding_amount_2?: number | null
          funding_year_3?: number | null
          funding_amount_3?: number | null
          form_465_pdf_url?: string | null
          posting_date?: string | null
          allowable_contract_start_date?: string | null
          program_type?: string | null
          mail_contact_name?: string | null
          mail_contact_email?: string | null
          mail_contact_company?: string | null
          description_of_services?: string | null
        }
        Update: {
          id?: string
          hcp_number?: string
          application_number?: string | null
          clinic_name?: string
          address?: string | null
          city?: string | null
          state?: string
          zip?: string | null
          contact_name?: string | null
          contact_title?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          filing_date?: string
          form_465_hash?: string
          service_type?: string | null
          contract_length?: number | null
          bandwidth?: string | null
          priority_score?: number | null
          priority_label?: string | null
          total_funding_3y?: number | null
          location_count?: number | null
          participation_years?: number | null
          review_status?: string | null
          enriched?: boolean
          enrichment_date?: string | null
          enrichment_finding?: string | null
          email_draft_created?: boolean
          email_subject?: string | null
          email_body?: string | null
          processed?: boolean
          created_at?: string
          updated_at?: string
          is_consultant?: boolean | null
          consultant_company?: string | null
          consultant_email_domain?: string | null
          consultant_detection_method?: string | null
          funding_year_1?: number | null
          funding_amount_1?: number | null
          funding_year_2?: number | null
          funding_amount_2?: number | null
          funding_year_3?: number | null
          funding_amount_3?: number | null
          form_465_pdf_url?: string | null
          posting_date?: string | null
          allowable_contract_start_date?: string | null
          program_type?: string | null
          mail_contact_name?: string | null
          mail_contact_email?: string | null
          mail_contact_company?: string | null
          description_of_services?: string | null
        }
        Relationships: []
      }
      consultant_email_domains: {
        Row: {
          id: string
          domain: string
          associated_company: string | null
          added_date: string
          added_by: string | null
          notes: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          domain: string
          associated_company?: string | null
          added_date?: string
          added_by?: string | null
          notes?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          domain?: string
          associated_company?: string | null
          added_date?: string
          added_by?: string | null
          notes?: string | null
          is_active?: boolean
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
    Views: {
      consultant_analytics: {
        Row: {
          total_consultants: number | null
          total_direct: number | null
          unique_consultant_companies: number | null
          unique_consultant_domains: number | null
          auto_detected: number | null
          manually_tagged: number | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      detect_consultant_by_domain: {
        Args: {
          contact_email: string
          mail_email: string
        }
        Returns: boolean
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
