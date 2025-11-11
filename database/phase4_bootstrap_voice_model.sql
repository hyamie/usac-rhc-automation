-- Phase 4: Bootstrap Voice Model
-- Created: 2025-11-11
-- Purpose: Insert initial voice model based on analysis of Mike's 10 real emails

-- ============================================================================
-- Insert Voice Model v1 - Based on Mike's Email Analysis
-- ============================================================================

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
    1, -- version

    -- tone_profile: Conversational-Professional Hybrid
    jsonb_build_object(
        'primary_tone', 'conversational_professional',
        'formality', 0.6,
        'warmth', 0.75,
        'directness', 0.85,
        'professionalism', 0.7,
        'description', 'Mix of friendly/approachable and businesslike - not overly formal but maintains professionalism'
    ),

    -- preferred_phrases: Mike's signature patterns
    jsonb_build_object(
        'openings', ARRAY[
            'I saw',
            'I wanted to',
            'I just tried to call',
            'I hope all is well'
        ]::text[],
        'transitions', ARRAY[
            'We can',
            'We are',
            'Let me know',
            'Let us know if we can help'
        ]::text[],
        'questions', ARRAY[
            'Do you have',
            'If you',
            'Would you'
        ]::text[],
        'closings', ARRAY[
            'Thanks,',
            'Look forward to',
            'Happy to',
            'Have a great weekend'
        ]::text[],
        'common_phrases_count', jsonb_build_object(
            'I saw', 3,
            'Let me know', 3,
            'We can', 5,
            'Do you have', 2,
            'If you', 2,
            'Let us know', 2
        )
    ),

    -- avoid_phrases: AI language not in Mike's emails
    ARRAY[
        'I hope this email finds you well',
        'Please don''t hesitate',
        'I trust this',
        'At your earliest convenience',
        'Per our conversation',
        'As per',
        'Moving forward',
        'Circle back',
        'Touch base',
        'Reach out to me',
        'I wanted to reach out',
        'Just reaching out',
        'Excited to',
        'Thrilled to',
        'Delighted to'
    ]::text[],

    -- sentence_patterns: From analysis
    jsonb_build_object(
        'avg_words_per_sentence', 15.875,
        'short_sentences_pct', 0.275,  -- < 10 words
        'medium_sentences_pct', 0.425, -- 10-20 words
        'long_sentences_pct', 0.30,    -- > 20 words
        'style_notes', ARRAY[
            'Gets to point quickly',
            'References recent events/data',
            'Asks direct questions',
            'Offers specific help'
        ]::text[]
    ),

    -- example_emails: Shortened subjects from real emails
    ARRAY[
        'Re: USAC Circuits',
        'Re: USAC contact',
        'Re: USAC Funding',
        'Re: USAC Telecom'
    ]::text[],

    -- subject_line_patterns: Mike's style
    jsonb_build_object(
        'avg_length_words', 3.5,
        'uses_clinic_name', true,
        'uses_usac', true,
        'uses_form_465', true,
        'direct_format', true,
        'examples', ARRAY[
            'USAC 465 posting',
            'USAC Bid',
            'USAC Telecom',
            'Quick question - {{clinic_name}} Form 465'
        ]::text[],
        'patterns', ARRAY[
            'USAC + specific topic',
            'Clinic name + Form 465',
            'Short 3-5 words',
            'No punctuation or minimal'
        ]::text[]
    ),

    -- confidence_score: Medium-high (based on 10 real emails)
    0.82,

    -- training_emails_count
    10,

    -- active
    true
);

-- ============================================================================
-- Create helper function to get active voice model
-- ============================================================================

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
        vm.id,
        vm.version,
        vm.tone_profile,
        vm.preferred_phrases,
        vm.avoid_phrases,
        vm.sentence_patterns,
        vm.subject_line_patterns,
        vm.confidence_score
    FROM voice_model vm
    WHERE vm.active = true
    ORDER BY vm.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_voice_model() IS 'Returns the currently active voice model for template generation';

-- ============================================================================
-- Create helper function to log template edit patterns
-- ============================================================================

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

    -- Check for common patterns
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

COMMENT ON FUNCTION identify_edit_pattern(text, text) IS 'Identifies the type of edit pattern for learning';

-- ============================================================================
-- Verification
-- ============================================================================

-- Check voice model was inserted
SELECT
    version,
    tone_profile->>'primary_tone' as tone,
    confidence_score,
    training_emails_count,
    array_length(avoid_phrases, 1) as avoid_phrases_count,
    active
FROM voice_model
WHERE version = 1;

-- Test helper function
SELECT * FROM get_active_voice_model();

-- ============================================================================
-- Bootstrap complete!
-- Next step: Generate first 3 templates (A/B/C) using this voice model
-- ============================================================================
