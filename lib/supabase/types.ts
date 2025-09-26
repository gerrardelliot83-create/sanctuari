export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'business' | 'broker' | 'insurer' | 'admin'
          company_name: string | null
          company_registration: string | null
          gst_number: string | null
          pan_number: string | null
          contact_person: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          industry_type: string | null
          annual_turnover: number | null
          employee_count: number | null
          is_verified: boolean
          is_active: boolean
          profile_completion: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'business' | 'broker' | 'insurer' | 'admin'
          company_name?: string | null
          company_registration?: string | null
          gst_number?: string | null
          pan_number?: string | null
          contact_person?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          industry_type?: string | null
          annual_turnover?: number | null
          employee_count?: number | null
          is_verified?: boolean
          is_active?: boolean
          profile_completion?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'business' | 'broker' | 'insurer' | 'admin'
          company_name?: string | null
          company_registration?: string | null
          gst_number?: string | null
          pan_number?: string | null
          contact_person?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          industry_type?: string | null
          annual_turnover?: number | null
          employee_count?: number | null
          is_verified?: boolean
          is_active?: boolean
          profile_completion?: number
          created_at?: string
          updated_at?: string
        }
      }
      rfqs: {
        Row: {
          id: string
          user_id: string
          rfq_number: string
          product_type: ProductType
          template_id: string | null
          form_data: any
          status: 'draft' | 'active' | 'closed' | 'awarded' | 'cancelled'
          submission_deadline: string | null
          decision_deadline: string | null
          bid_rules: any | null
          is_paid: boolean
          payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rfq_number?: string
          product_type: ProductType
          template_id?: string | null
          form_data: any
          status?: 'draft' | 'active' | 'closed' | 'awarded' | 'cancelled'
          submission_deadline?: string | null
          decision_deadline?: string | null
          bid_rules?: any | null
          is_paid?: boolean
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rfq_number?: string
          product_type?: ProductType
          template_id?: string | null
          form_data?: any
          status?: 'draft' | 'active' | 'closed' | 'awarded' | 'cancelled'
          submission_deadline?: string | null
          decision_deadline?: string | null
          bid_rules?: any | null
          is_paid?: boolean
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rfq_templates: {
        Row: {
          id: string
          product_type: ProductType
          name: string
          description: string | null
          fields: any
          guidance_content: any | null
          is_active: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_type: ProductType
          name: string
          description?: string | null
          fields: any
          guidance_content?: any | null
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_type?: ProductType
          name?: string
          description?: string | null
          fields?: any
          guidance_content?: any | null
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          rfq_id: string
          invitation_id: string | null
          broker_id: string | null
          insurer_id: string | null
          quote_number: string
          premium_amount: number
          sum_insured: number | null
          policy_period_start: string | null
          policy_period_end: string | null
          coverage_details: any | null
          exclusions: any | null
          terms_conditions: any | null
          document_urls: string[] | null
          parsed_data: any | null
          status: 'pending' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rfq_id: string
          invitation_id?: string | null
          broker_id?: string | null
          insurer_id?: string | null
          quote_number?: string
          premium_amount: number
          sum_insured?: number | null
          policy_period_start?: string | null
          policy_period_end?: string | null
          coverage_details?: any | null
          exclusions?: any | null
          terms_conditions?: any | null
          document_urls?: string[] | null
          parsed_data?: any | null
          status?: 'pending' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rfq_id?: string
          invitation_id?: string | null
          broker_id?: string | null
          insurer_id?: string | null
          quote_number?: string
          premium_amount?: number
          sum_insured?: number | null
          policy_period_start?: string | null
          policy_period_end?: string | null
          coverage_details?: any | null
          exclusions?: any | null
          terms_conditions?: any | null
          document_urls?: string[] | null
          parsed_data?: any | null
          status?: 'pending' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bid_invitations: {
        Row: {
          id: string
          rfq_id: string
          email: string | null
          broker_id: string | null
          insurer_id: string | null
          unique_link: string
          link_expiry: string | null
          is_accepted: boolean
          accessed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rfq_id: string
          email?: string | null
          broker_id?: string | null
          insurer_id?: string | null
          unique_link?: string
          link_expiry?: string | null
          is_accepted?: boolean
          accessed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rfq_id?: string
          email?: string | null
          broker_id?: string | null
          insurer_id?: string | null
          unique_link?: string
          link_expiry?: string | null
          is_accepted?: boolean
          accessed_at?: string | null
          created_at?: string
        }
      }
      insurers: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          registration_number: string | null
          irda_license: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          is_active: boolean
          supported_products: ProductType[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          registration_number?: string | null
          irda_license?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          is_active?: boolean
          supported_products?: ProductType[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          registration_number?: string | null
          irda_license?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          is_active?: boolean
          supported_products?: ProductType[] | null
          created_at?: string
          updated_at?: string
        }
      }
      brokers: {
        Row: {
          id: string
          user_id: string | null
          broker_name: string
          license_number: string | null
          irda_registration: string | null
          commission_rate: number | null
          is_partner: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          broker_name: string
          license_number?: string | null
          irda_registration?: string | null
          commission_rate?: number | null
          is_partner?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          broker_name?: string
          license_number?: string | null
          irda_registration?: string | null
          commission_rate?: number | null
          is_partner?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          rfq_id: string
          invitation_id: string | null
          sender_id: string | null
          recipient_email: string | null
          message_type: string | null
          subject: string | null
          content: string | null
          is_broadcast: boolean
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rfq_id: string
          invitation_id?: string | null
          sender_id?: string | null
          recipient_email?: string | null
          message_type?: string | null
          subject?: string | null
          content?: string | null
          is_broadcast?: boolean
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          rfq_id?: string
          invitation_id?: string | null
          sender_id?: string | null
          recipient_email?: string | null
          message_type?: string | null
          subject?: string | null
          content?: string | null
          is_broadcast?: boolean
          is_read?: boolean
          created_at?: string
        }
      }
      quote_analyses: {
        Row: {
          id: string
          quote_id: string
          rfq_id: string
          analysis_data: any
          score: number | null
          strengths: any | null
          weaknesses: any | null
          recommendations: any | null
          ai_summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          rfq_id: string
          analysis_data: any
          score?: number | null
          strengths?: any | null
          weaknesses?: any | null
          recommendations?: any | null
          ai_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          rfq_id?: string
          analysis_data?: any
          score?: number | null
          strengths?: any | null
          weaknesses?: any | null
          recommendations?: any | null
          ai_summary?: string | null
          created_at?: string
        }
      }
      workflow_automations: {
        Row: {
          id: string
          rfq_id: string
          name: string
          trigger_type: string | null
          trigger_date: string | null
          action_type: string | null
          email_template: any | null
          is_active: boolean
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rfq_id: string
          name: string
          trigger_type?: string | null
          trigger_date?: string | null
          action_type?: string | null
          email_template?: any | null
          is_active?: boolean
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rfq_id?: string
          name?: string
          trigger_type?: string | null
          trigger_date?: string | null
          action_type?: string | null
          email_template?: any | null
          is_active?: boolean
          executed_at?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          rfq_id: string | null
          razorpay_payment_id: string | null
          razorpay_order_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rfq_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rfq_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          value: any
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type ProductType =
  | 'fire_special_perils'
  | 'business_interruption'
  | 'burglary'
  | 'marine_cargo'
  | 'contractors_all_risk'
  | 'erection_all_risk'
  | 'public_liability'
  | 'product_liability'
  | 'professional_indemnity'
  | 'directors_officers'
  | 'cyber_liability'
  | 'group_health'
  | 'group_personal_accident'
  | 'group_term_life'
  | 'workmen_compensation'
  | 'other'