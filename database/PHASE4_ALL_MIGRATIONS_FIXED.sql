-- ============================================================================
-- PHASE 4.2: ALL DATABASE MIGRATIONS CONSOLIDATED
-- Execute this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create Tables and Policies
-- ============================================================================

-- Phase 4: Smart Outreach System - Database Migrations
-- Created: 2025-11-11
-- Purpose: Add tables for template-based A/B/C email system with learning

-- ============================================================================
-- 1. EMAIL_TEMPLATES: Weekly A/B/C template versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version text NOT NULL, -- 'week-45-2025', 'week-46-2025', etc.
    template_variant text CHECK (template_variant IN ('A', 'B', 'C')),

    -- Template type
    contact_type text CHECK (contact_type IN ('direct', 'consultant')),
    tone text CHECK (tone IN ('professional', 'conversational', 'hybrid')),

    -- Template content with placeholders
    subject_template text NOT NULL,
    body_template text NOT NULL,

    -- Metadata
    generated_at timestamptz DEFAULT now(),
    generated_by text DEFAULT 'claude-sonnet-4.5',
    generation_cost numeric(10, 4),

    -- Status
    active boolean DEFAULT true,
    retired_at timestamptz,

    -- Performance metrics (aggregated)
    times_used integer DEFAULT 0,
    total_opens integer DEFAULT 0,
    total_clicks integer DEFAULT 0,
    total_responses integer DEFAULT 0,
    avg_open_rate numeric(5, 2),
    avg_response_rate numeric(5, 2),
    quality_score numeric(5, 2),

    -- Constraints
    UNIQUE(version, template_variant, contact_type)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active, version);
CREATE INDEX IF NOT EXISTS idx_email_templates_variant ON email_templates(template_variant, contact_type);

-- ============================================================================
-- 2. EMAIL_INSTANCES: Each actual email sent/drafted
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid, -- Reference to clinics table (FK can be added later)
    template_id uuid REFERENCES email_templates(id),

    -- Rendered content (template + enrichment + data)
    subject_rendered text NOT NULL,
    body_rendered text NOT NULL,
    enrichment_data jsonb,

    -- O365 Integration
    draft_id text,
    draft_url text,
    draft_created_at timestamptz,

    -- User edits before sending
    user_edited boolean DEFAULT false,
    original_body text,
    edited_body text,
    edit_summary jsonb,

    -- Tracking
    sent_at timestamptz,
    opened_at timestamptz,
    clicked_at timestamptz,
    responded_at timestamptz,
    response_time_hours integer,

    -- Link back to template performance
    contributed_to_open boolean DEFAULT false,
    contributed_to_response boolean DEFAULT false,

    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_instances_clinic ON email_instances(clinic_id);
CREATE INDEX IF NOT EXISTS idx_email_instances_template ON email_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_email_instances_sent ON email_instances(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_instances_tracking ON email_instances(opened_at, responded_at);

-- ============================================================================
-- 3. TEMPLATE_EDITS: Learning from Mike's changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_edits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES email_templates(id),
    instance_id uuid REFERENCES email_instances(id),

    -- What changed
    field_changed text CHECK (field_changed IN ('subject', 'opening', 'body', 'cta', 'closing', 'enrichment')),
    original_text text,
    edited_text text,
    edit_type text CHECK (edit_type IN ('addition', 'deletion', 'replacement', 'tone_shift', 'shortening', 'clarification')),

    -- When
    edited_at timestamptz DEFAULT now(),

    -- Impact (did this edit help?)
    resulted_in_open boolean,
    resulted_in_response boolean,

    -- Learning
    pattern_identified text,
    applied_to_template boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_template_edits_pattern ON template_edits(pattern_identified);
CREATE INDEX IF NOT EXISTS idx_template_edits_template ON template_edits(template_id);
CREATE INDEX IF NOT EXISTS idx_template_edits_impact ON template_edits(resulted_in_open, resulted_in_response);

-- ============================================================================
-- 4. WEEKLY_PERFORMANCE: A/B/C test results
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_performance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start date NOT NULL,
    week_end date NOT NULL,

    -- Template performance
    template_a_id uuid REFERENCES email_templates(id),
    template_a_stats jsonb,

    template_b_id uuid REFERENCES email_templates(id),
    template_b_stats jsonb,

    template_c_id uuid REFERENCES email_templates(id),
    template_c_stats jsonb,

    -- Winner
    winning_template text,
    winner_metrics jsonb,

    -- Insights
    key_learnings text[],
    recommended_changes text[],

    -- Next generation
    next_templates_generated boolean DEFAULT false,
    next_templates_generated_at timestamptz,

    created_at timestamptz DEFAULT now(),

    UNIQUE(week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_performance_week ON weekly_performance(week_start, week_end);

-- ============================================================================
-- 5. VOICE_MODEL: Learned writing patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version integer NOT NULL,

    -- Learned patterns
    tone_profile jsonb NOT NULL,
    preferred_phrases jsonb NOT NULL,
    avoid_phrases text[] NOT NULL,
    sentence_patterns jsonb NOT NULL,
    example_emails text[],
    subject_line_patterns jsonb,

    -- Metadata
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Confidence
    confidence_score numeric(3, 2),
    training_emails_count integer,

    -- Status
    active boolean DEFAULT true,

    UNIQUE(version)
);

CREATE INDEX IF NOT EXISTS idx_voice_model_active ON voice_model(active);
CREATE INDEX IF NOT EXISTS idx_voice_model_version ON voice_model(version DESC);

-- ============================================================================
-- 6. Grant permissions
-- ============================================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_model ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read email_templates" ON email_templates;
DROP POLICY IF EXISTS "Allow service role all email_templates" ON email_templates;
DROP POLICY IF EXISTS "Allow authenticated read email_instances" ON email_instances;
DROP POLICY IF EXISTS "Allow service role all email_instances" ON email_instances;
DROP POLICY IF EXISTS "Allow authenticated read template_edits" ON template_edits;
DROP POLICY IF EXISTS "Allow service role all template_edits" ON template_edits;
DROP POLICY IF EXISTS "Allow authenticated read weekly_performance" ON weekly_performance;
DROP POLICY IF EXISTS "Allow service role all weekly_performance" ON weekly_performance;
DROP POLICY IF EXISTS "Allow authenticated read voice_model" ON voice_model;
DROP POLICY IF EXISTS "Allow service role all voice_model" ON voice_model;

-- Create policies
CREATE POLICY "Allow authenticated read email_templates" ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all email_templates" ON email_templates FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated read email_instances" ON email_instances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all email_instances" ON email_instances FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated read template_edits" ON template_edits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all template_edits" ON template_edits FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated read weekly_performance" ON weekly_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all weekly_performance" ON weekly_performance FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated read voice_model" ON voice_model FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all voice_model" ON voice_model FOR ALL TO service_role USING (true);

-- ============================================================================
-- MIGRATION 2: Bootstrap Voice Model
-- ============================================================================

-- Drop and recreate functions
DROP FUNCTION IF EXISTS get_active_voice_model();
DROP FUNCTION IF EXISTS identify_edit_pattern(text, text);

-- Insert Voice Model v1
INSERT INTO voice_model (
    version,
    tone_profile,
    preferred_phrases,
    avoid_phrases,
    sentence_patterns,
    example_emails,
    subject_line_patterns,
    confidence_score,
    training_emails_count,
    active
) VALUES (
    1,
    jsonb_build_object(
        'primary_tone', 'conversational_professional',
        'formality', 0.6,
        'warmth', 0.75,
        'directness', 0.85,
        'professionalism', 0.7,
        'description', 'Mix of friendly/approachable and businesslike - not overly formal but maintains professionalism'
    ),
    jsonb_build_object(
        'openings', ARRAY['I saw', 'I wanted to', 'I just tried to call', 'I hope all is well']::text[],
        'transitions', ARRAY['We can', 'We are', 'Let me know', 'Let us know if we can help']::text[],
        'questions', ARRAY['Do you have', 'If you', 'Would you']::text[],
        'closings', ARRAY['Thanks,', 'Look forward to', 'Happy to', 'Have a great weekend']::text[],
        'common_phrases_count', jsonb_build_object(
            'I saw', 3, 'Let me know', 3, 'We can', 5, 'Do you have', 2, 'If you', 2, 'Let us know', 2
        )
    ),
    ARRAY[
        'I hope this email finds you well', 'Please don''t hesitate', 'I trust this',
        'At your earliest convenience', 'Per our conversation', 'As per', 'Moving forward',
        'Circle back', 'Touch base', 'Reach out to me', 'I wanted to reach out',
        'Just reaching out', 'Excited to', 'Thrilled to', 'Delighted to'
    ]::text[],
    jsonb_build_object(
        'avg_words_per_sentence', 15.875,
        'short_sentences_pct', 0.275,
        'medium_sentences_pct', 0.425,
        'long_sentences_pct', 0.30,
        'style_notes', ARRAY[
            'Gets to point quickly', 'References recent events/data',
            'Asks direct questions', 'Offers specific help'
        ]::text[]
    ),
    ARRAY['Re: USAC Circuits', 'Re: USAC contact', 'Re: USAC Funding', 'Re: USAC Telecom']::text[],
    jsonb_build_object(
        'avg_length_words', 3.5,
        'uses_clinic_name', true,
        'uses_usac', true,
        'uses_form_465', true,
        'direct_format', true,
        'examples', ARRAY[
            'USAC 465 posting', 'USAC Bid', 'USAC Telecom',
            'Quick question - {{clinic_name}} Form 465'
        ]::text[],
        'patterns', ARRAY[
            'USAC + specific topic', 'Clinic name + Form 465',
            'Short 3-5 words', 'No punctuation or minimal'
        ]::text[]
    ),
    0.82,
    10,
    true
) ON CONFLICT (version) DO NOTHING;

-- Create helper functions
CREATE OR REPLACE FUNCTION get_active_voice_model()
RETURNS TABLE (
    id uuid,
    version integer,
    tone_profile jsonb,
    preferred_phrases jsonb,
    avoid_phrases text[],
    sentence_patterns jsonb,
    subject_line_patterns jsonb,
    confidence_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vm.id, vm.version, vm.tone_profile, vm.preferred_phrases,
        vm.avoid_phrases, vm.sentence_patterns, vm.subject_line_patterns, vm.confidence_score
    FROM voice_model vm
    WHERE vm.active = true
    ORDER BY vm.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION identify_edit_pattern(
    p_original_text text,
    p_edited_text text
) RETURNS text AS $$
DECLARE
    v_pattern text;
    v_orig_length int;
    v_edit_length int;
BEGIN
    v_orig_length := length(p_original_text);
    v_edit_length := length(p_edited_text);

    IF p_edited_text IS NULL OR p_edited_text = '' THEN
        v_pattern := 'Deletion: Removed entire section';
    ELSIF v_edit_length < v_orig_length * 0.7 THEN
        v_pattern := 'Shortening: Reduced by ' || round(((v_orig_length - v_edit_length)::numeric / v_orig_length * 100), 0) || '%';
    ELSIF v_edit_length > v_orig_length * 1.3 THEN
        v_pattern := 'Addition: Expanded by ' || round(((v_edit_length - v_orig_length)::numeric / v_orig_length * 100), 0) || '%';
    ELSIF p_edited_text ~* 'I hope this|Please don''t hesitate' AND p_original_text !~* 'I hope this|Please don''t hesitate' THEN
        v_pattern := 'Tone Shift: Added formal language';
    ELSIF p_original_text ~* 'I hope this|Please don''t hesitate' AND p_edited_text !~* 'I hope this|Please don''t hesitate' THEN
        v_pattern := 'Tone Shift: Removed formal language';
    ELSE
        v_pattern := 'Replacement: Changed wording';
    END IF;

    RETURN v_pattern;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 3: Insert Templates
-- ============================================================================

INSERT INTO email_templates (
    version, template_variant, contact_type, tone,
    subject_template, body_template,
    generated_by, generation_cost, active
) VALUES
(
    'week-46-2025', 'A', 'direct', 'professional',
    'USAC RHC Support - {{clinic_name}}',
    '{{first_name}},

I saw {{clinic_name}}''s Form 465 filing for {{funding_year}} and wanted to introduce myself.

{{enrichment_context}}

I''m Mike Hyam and I specialize in USAC Rural Health Care consulting. I''ve helped dozens of healthcare facilities in {{state}} navigate the RHC program and maximize their funding commitments. My background includes over 15 years working directly with USAC applications, competitive bidding processes, and ongoing compliance requirements.

Many clinics find the USAC process overwhelming, especially with the technical requirements and documentation. We can help streamline your approach and make sure you''re getting the full benefit of available funding.

Would you have 15 minutes this week to discuss how we might support {{clinic_name}}''s USAC initiatives? I''m happy to share some specific examples of how we''ve helped similar facilities in rural {{state}}.

Look forward to hearing from you.

Thanks,
Mike

{{signature}}',
    'claude-sonnet-4-20250514', 0.0145, true
),
(
    'week-46-2025', 'B', 'direct', 'conversational',
    'Quick question - {{clinic_name}} Form 465',
    '{{first_name}},

I saw you filed a Form 465 for {{funding_year}} and wanted to check in.

{{enrichment_context}}

We work with a lot of rural health clinics on their USAC funding, and I know the process can be pretty complex. Do you have someone helping you navigate the RHC program requirements, or are you handling everything internally?

I''ve been doing USAC consulting for years and we can usually help clinics save time and avoid common pitfalls. Plus, we often find ways to increase funding commitments that facilities miss on their own.

Would you be interested in a quick 10-minute call to see if we might be helpful? No pressure - just want to make sure you''re getting the most out of the program.

Let me know what works for your schedule.

Thanks,
Mike

{{signature}}',
    'claude-sonnet-4-20250514', 0.0145, true
),
(
    'week-46-2025', 'C', 'direct', 'hybrid',
    'USAC {{funding_year}} - {{clinic_name}}',
    '{{first_name}},

I noticed {{clinic_name}} submitted a Form 465 for {{funding_year}}.

{{enrichment_context}}

I''m a USAC Rural Health Care consultant and work with healthcare facilities across {{state}} to optimize their RHC funding. The program has gotten more competitive lately, and many clinics benefit from having someone who knows the system handle the technical details.

We can help with everything from competitive bidding to ongoing compliance, and our clients typically see better funding outcomes than they achieve on their own.

If you''d like to discuss how we might support {{clinic_name}}''s USAC efforts, I''m happy to set up a brief call. Would sometime this week work for you?

Thanks,
Mike

{{signature}}',
    'claude-sonnet-4-20250514', 0.0145, true
)
ON CONFLICT (version, template_variant, contact_type) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'email_%' OR table_name IN ('weekly_performance', 'voice_model'))
ORDER BY table_name;

-- Check voice model
SELECT version, confidence_score, training_emails_count, active
FROM voice_model WHERE active = true;

-- Check templates
SELECT version, template_variant, contact_type, tone, active
FROM email_templates WHERE version = 'week-46-2025'
ORDER BY template_variant;

-- ============================================================================
-- ALL MIGRATIONS COMPLETE!
-- ============================================================================
