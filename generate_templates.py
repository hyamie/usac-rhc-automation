#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 4: Template Generator
Purpose: Generate weekly A/B/C email templates using Claude API and Mike's voice model
"""

import os
import sys
import json
from datetime import datetime, timedelta
import anthropic
from dotenv import load_dotenv

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv('../dashboard/.env.local')

# Configuration
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
if not ANTHROPIC_API_KEY:
    print("[ERROR] ANTHROPIC_API_KEY not found in environment")
    exit(1)

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Load Mike's voice profile
with open('mike_voice_profile.json', 'r') as f:
    voice_profile = json.load(f)

# Calculate current week
today = datetime.now()
week_number = today.isocalendar()[1]
year = today.year
week_version = f"week-{week_number}-{year}"

def generate_templates(contact_type='direct'):
    """Generate 3 email templates (A/B/C) for the current week"""

    print(f"[GENERATING] Templates for {week_version} ({contact_type})")
    print("=" * 60)

    # Build generation prompt
    prompt = f"""Generate 3 email templates for Mike Hyam, who does USAC RHC (Rural Health Care) telecom consulting.

CONTEXT:
- Mike reaches out to healthcare clinics that have filed USAC Form 465
- Goal: Offer telecom consulting services to help them with their USAC funding
- Contact type: {contact_type} (direct contact vs consultant)

MIKE'S VOICE PROFILE (analyzed from 10 real emails):
Tone: {voice_profile['tone']}
- Mix of friendly/approachable and businesslike
- Not overly formal but maintains professionalism
- Warm without being excessive

Sentence Style:
- Average: {voice_profile['avg_sentence_length']} words per sentence
- Mix of short, medium, and long sentences
- Gets to point quickly
- References specific recent events/data

Common Phrases Mike Uses:
{', '.join(voice_profile['common_phrases'])}

Common Openings:
- "I saw [clinic]'s Form 465..."
- "I wanted to check in..."
- "I just tried to call..."

Common Closings:
- "Thanks,"
- "Let me know"
- "Look forward to"
- "Happy to help"

AVOID (AI language NOT in Mike's emails):
{', '.join(voice_profile['avoid_phrases'])}

TASK:
Generate 3 email templates with these placeholders:
- {{{{clinic_name}}}} - Healthcare clinic name
- {{{{first_name}}}} - Contact's first name
- {{{{funding_year}}}} - e.g., "FY 2026"
- {{{{enrichment_context}}}} - 2-3 sentences from Perplexity AI about recent clinic news
- {{{{city}}}}, {{{{state}}}} - Clinic location

TEMPLATE A - Professional:
- Formal but not stuffy
- Emphasize expertise and track record
- Subject line: Professional, direct
- Highlight credentials and experience

TEMPLATE B - Conversational:
- Warm, peer-to-peer tone
- Build rapport quickly
- Subject line: Friendly, casual
- Use more "we" and "you" language

TEMPLATE C - Hybrid:
- Balance professionalism with approachability
- Direct and efficient
- Subject line: Straightforward
- Get to the point, then offer help

CRITICAL REQUIREMENTS:
1. Make it sound EXACTLY like Mike would write it naturally
2. Use Mike's common phrases naturally (don't force them)
3. Avoid ALL AI-sounding phrases in the avoid list
4. Keep sentences around {voice_profile['avg_sentence_length']} words average
5. Reference the Form 465 filing (this is what triggers the outreach)
6. Include clear call-to-action (time to discuss, schedule call, etc.)
7. Subject lines should be 3-5 words, direct, USAC-focused
8. Include proper email signature placeholder: {{{{signature}}}}

Return ONLY valid JSON in this exact format:
{{
    "template_a": {{
        "subject": "USAC RHC Support - {{{{clinic_name}}}}",
        "body": "{{{{first_name}}}},\\n\\nI saw {{{{clinic_name}}}}'s Form 465 for {{{{funding_year}}}}.\\n\\n{{{{enrichment_context}}}}\\n\\n[rest of email]\\n\\nThanks,\\nMike\\n\\n{{{{signature}}}}"
    }},
    "template_b": {{
        "subject": "Quick question - {{{{clinic_name}}}} Form 465",
        "body": "{{{{first_name}}}},\\n\\n[body]\\n\\nThanks,\\nMike\\n\\n{{{{signature}}}}"
    }},
    "template_c": {{
        "subject": "USAC {{{{funding_year}}}} - {{{{clinic_name}}}}",
        "body": "{{{{first_name}}}},\\n\\n[body]\\n\\nThanks,\\nMike\\n\\n{{{{signature}}}}"
    }}
}}

Make it authentic. Make it sound like Mike. NO AI jargon."""

    print("[API] Calling Claude API...")

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract JSON from response
        content = response.content[0].text

        # Try to extract JSON if wrapped in markdown
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()

        templates = json.loads(content)

        # Calculate cost
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        cost = (input_tokens / 1_000_000 * 3.00) + (output_tokens / 1_000_000 * 15.00)

        print(f"[SUCCESS] Templates generated!")
        print(f"[STATS] Tokens: {input_tokens} input, {output_tokens} output")
        print(f"[COST] ${cost:.4f}")
        print()

        return {
            'templates': templates,
            'metadata': {
                'version': week_version,
                'contact_type': contact_type,
                'generated_at': datetime.now().isoformat(),
                'generated_by': response.model,
                'generation_cost': cost,
                'input_tokens': input_tokens,
                'output_tokens': output_tokens
            }
        }

    except Exception as e:
        print(f"[ERROR] Error generating templates: {e}")
        return None

def save_templates(result, contact_type='direct'):
    """Save generated templates to JSON file"""

    if not result:
        return

    filename = f"templates_{week_version}_{contact_type}.json"
    with open(filename, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"[SAVED] {filename}")
    print()

def display_templates(result):
    """Display templates in a readable format"""

    if not result:
        return

    templates = result['templates']

    print("\nGENERATED TEMPLATES")
    print("=" * 60)

    for variant in ['a', 'b', 'c']:
        template_key = f'template_{variant}'
        if template_key not in templates:
            continue

        template = templates[template_key]

        print(f"\nTEMPLATE {variant.upper()}")
        print("-" * 60)
        print(f"Subject: {template['subject']}")
        print()
        print(template['body'])
        print()

    print("=" * 60)

def create_sql_insert(result, contact_type='direct'):
    """Create SQL INSERT statements for Supabase"""

    if not result:
        return

    templates = result['templates']
    metadata = result['metadata']

    sql_statements = []
    sql_statements.append(f"-- Generated templates for {metadata['version']} ({contact_type})")
    sql_statements.append(f"-- Generated at: {metadata['generated_at']}")
    sql_statements.append(f"-- Cost: ${metadata['generation_cost']:.4f}")
    sql_statements.append("")

    tone_map = {
        'a': 'professional',
        'b': 'conversational',
        'c': 'hybrid'
    }

    for variant in ['a', 'b', 'c']:
        template_key = f'template_{variant}'
        if template_key not in templates:
            continue

        template = templates[template_key]
        tone = tone_map[variant]

        # Escape single quotes for SQL
        subject = template['subject'].replace("'", "''")
        body = template['body'].replace("'", "''")

        sql = f"""
INSERT INTO email_templates (
    version,
    template_variant,
    contact_type,
    tone,
    subject_template,
    body_template,
    generated_by,
    generation_cost,
    active
) VALUES (
    '{metadata['version']}',
    '{variant.upper()}',
    '{contact_type}',
    '{tone}',
    '{subject}',
    '{body}',
    '{metadata['generated_by']}',
    {metadata['generation_cost']:.4f},
    true
);
"""
        sql_statements.append(sql)

    sql_content = '\n'.join(sql_statements)

    filename = f"insert_templates_{metadata['version']}_{contact_type}.sql"
    with open(filename, 'w') as f:
        f.write(sql_content)

    print(f"[SQL] INSERT statements saved to: {filename}")
    print()

if __name__ == "__main__":
    print("Phase 4: Template Generator")
    print("=" * 60)
    print()

    # Generate templates for direct contact
    result = generate_templates(contact_type='direct')

    if result:
        display_templates(result)
        save_templates(result, contact_type='direct')
        create_sql_insert(result, contact_type='direct')

        print("\n[SUCCESS] Template generation complete!")
        print("\nNext Steps:")
        print("   1. Review templates in: templates_*.json")
        print("   2. Run SQL insert: insert_templates_*.sql in Supabase")
        print("   3. Build n8n workflow to use these templates")
    else:
        print("[ERROR] Template generation failed")
