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
    -- Example: "USAC RHC Support - {{clinic_name}}"

    body_template text NOT NULL,
    -- Example: "{{first_name}},\n\nI saw {{clinic_name}}'s Form 465 for {{funding_year}}.\n\n{{enrichment_context}}\n\nWould you have time this week to discuss how we can help?\n\nThanks,\nMike"

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

COMMENT ON TABLE email_templates IS 'Weekly A/B/C email templates with placeholders for personalization';
COMMENT ON COLUMN email_templates.version IS 'Week identifier in format: week-{week_number}-{year}';
COMMENT ON COLUMN email_templates.template_variant IS 'A, B, or C for A/B/C testing';
COMMENT ON COLUMN email_templates.contact_type IS 'Whether template is for direct contacts or consultant outreach';

-- ============================================================================
-- 2. EMAIL_INSTANCES: Each actual email sent/drafted
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid REFERENCES clinics(id),
    template_id uuid REFERENCES email_templates(id),

    -- Rendered content (template + enrichment + data)
    subject_rendered text NOT NULL,
    body_rendered text NOT NULL,
    enrichment_data jsonb,
    -- Example: {"source": "perplexity", "context": "Recent expansion to 3 counties...", "confidence": 0.85, "cost": 0.005}

    -- O365 Integration
    draft_id text,
    draft_url text,
    draft_created_at timestamptz,

    -- User edits before sending
    user_edited boolean DEFAULT false,
    original_body text, -- Store original for diff
    edited_body text, -- Store final version
    edit_summary jsonb,
    -- Example: [{"field": "opening", "type": "shortened", "pattern": "removed 'I hope this finds you well'"}]

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

COMMENT ON TABLE email_instances IS 'Each individual email generated from a template';
COMMENT ON COLUMN email_instances.enrichment_data IS 'AI-generated personalization context from Perplexity';
COMMENT ON COLUMN email_instances.edit_summary IS 'Structured diff of user edits for learning';

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
    -- Example: "User consistently removes 'I hope' openings"
    applied_to_template boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_template_edits_pattern ON template_edits(pattern_identified);
CREATE INDEX IF NOT EXISTS idx_template_edits_template ON template_edits(template_id);
CREATE INDEX IF NOT EXISTS idx_template_edits_impact ON template_edits(resulted_in_open, resulted_in_response);

COMMENT ON TABLE template_edits IS 'Tracks user edits to learn writing preferences';
COMMENT ON COLUMN template_edits.pattern_identified IS 'ML-identified pattern for template improvement';

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
    -- Example: {"sent": 45, "opens": 31, "responses": 8, "open_rate": 0.68, "response_rate": 0.18}

    template_b_id uuid REFERENCES email_templates(id),
    template_b_stats jsonb,

    template_c_id uuid REFERENCES email_templates(id),
    template_c_stats jsonb,

    -- Winner
    winning_template text, -- 'A', 'B', or 'C'
    winner_metrics jsonb,

    -- Insights
    key_learnings text[],
    -- Example: ["Shorter subject lines performed 12% better", "Enrichment about recent news increased replies"]

    recommended_changes text[],
    -- Example: ["Keep conversational tone from Template B", "Add more urgency in CTAs"]

    -- Next generation
    next_templates_generated boolean DEFAULT false,
    next_templates_generated_at timestamptz,

    created_at timestamptz DEFAULT now(),

    UNIQUE(week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_performance_week ON weekly_performance(week_start, week_end);

COMMENT ON TABLE weekly_performance IS 'Weekly A/B/C test results and learnings';
COMMENT ON COLUMN weekly_performance.key_learnings IS 'Automatically identified patterns that improved performance';

-- ============================================================================
-- 5. VOICE_MODEL: Learned writing patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version integer NOT NULL,

    -- Learned patterns
    tone_profile jsonb NOT NULL,
    -- Example: {"formality": 0.6, "warmth": 0.8, "directness": 0.9, "professionalism": 0.7}

    preferred_phrases jsonb NOT NULL,
    -- Example: {"openings": ["I saw", "I wanted to"], "transitions": ["We can", "Let me know"], "closings": ["Thanks,", "Looking forward"]}

    avoid_phrases text[] NOT NULL,
    -- Example: ["I hope this email finds you well", "Please don't hesitate", "Circle back"]

    sentence_patterns jsonb NOT NULL,
    -- Example: {"avg_words_per_sentence": 16, "short_pct": 0.28, "medium_pct": 0.42, "long_pct": 0.30}

    example_emails text[],
    -- Mike's original emails used for training

    subject_line_patterns jsonb,
    -- Example: {"avg_length": 4, "uses_clinic_name": true, "uses_usac": true, "direct_format": true}

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

COMMENT ON TABLE voice_model IS 'Learned writing patterns from Mike''s emails and edits';
COMMENT ON COLUMN voice_model.version IS 'Incremental version number for voice model evolution';
COMMENT ON COLUMN voice_model.confidence_score IS 'How confident we are in the model (0.0-1.0)';

-- ============================================================================
-- 6. Grant permissions
-- ============================================================================

-- Grant access to authenticated users (if using RLS)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_model ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
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
-- 7. Verification queries
-- ============================================================================

-- Run these after migration to verify:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'email_%' OR table_name IN ('weekly_performance', 'voice_model');
-- SELECT * FROM email_templates LIMIT 1;
-- SELECT * FROM voice_model WHERE active = true ORDER BY version DESC LIMIT 1;

-- ============================================================================
-- Migration complete!
-- Next step: Bootstrap voice model with initial data
-- ============================================================================
