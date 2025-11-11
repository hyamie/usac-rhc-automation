import json
import re
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def analyze_voice_profile(emails_file):
    """Analyze Mike's writing style from extracted emails"""

    with open(emails_file, 'r', encoding='utf-8') as f:
        emails = json.load(f)

    # Filter to only Mike's emails (sent by him)
    mikes_emails = [e for e in emails if 'Michael Hyams' in e.get('sender', '')]

    print(f"=" * 70)
    print(f"VOICE PROFILE ANALYSIS FOR MIKE HYAMS")
    print(f"=" * 70)
    print(f"\nAnalyzing {len(mikes_emails)} emails sent by Mike\n")

    # Extract Mike's text (his parts, not quoted replies)
    mikes_text = []
    for email in mikes_emails:
        body = email.get('body', '')
        # Split on common reply markers
        lines = body.split('\n')
        mike_lines = []
        in_reply = False

        for line in lines:
            # Stop when we hit quoted text
            if any(marker in line for marker in ['From:', 'Sent:', '>', '________________________________']):
                break
            mike_lines.append(line)

        mike_text = '\n'.join(mike_lines)
        if len(mike_text.strip()) > 50:  # Only substantial text
            mikes_text.append(mike_text.strip())

    print(f"✅ Extracted {len(mikes_text)} email bodies (Mike's actual writing)\n")

    # OPENING LINES
    print("=" * 70)
    print("1. OPENING LINES")
    print("=" * 70)
    openings = []
    for text in mikes_text:
        first_sentence = text.split('\n')[0].strip()
        if first_sentence and len(first_sentence) > 10:
            openings.append(first_sentence)

    print("\nMike's typical opening lines:")
    for i, opening in enumerate(openings[:10], 1):
        print(f"{i}. {opening}")

    # TONE ANALYSIS
    print("\n" + "=" * 70)
    print("2. TONE & STYLE ANALYSIS")
    print("=" * 70)

    # Check for common patterns
    all_text = ' '.join(mikes_text)

    formality_indicators = {
        'formal': ['I hope this message finds you well', 'I am writing to express', 'Thank you for considering'],
        'conversational': ['I saw', 'Just wanted', 'Let me know', 'Hope all is well', 'Thanks for'],
        'direct': ['Could you', 'Would you', 'Can you', 'Do you have']
    }

    tone_scores = {}
    for tone, indicators in formality_indicators.items():
        count = sum(1 for ind in indicators if ind.lower() in all_text.lower())
        tone_scores[tone] = count

    print("\nTone indicators found:")
    for tone, score in tone_scores.items():
        print(f"  {tone.capitalize()}: {score} occurrences")

    # SENTENCE LENGTH
    print("\n" + "=" * 70)
    print("3. SENTENCE STRUCTURE")
    print("=" * 70)

    sentences = re.split(r'[.!?]+', all_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]

    word_counts = [len(s.split()) for s in sentences]
    avg_words = sum(word_counts) / len(word_counts) if word_counts else 0

    print(f"\nAverage words per sentence: {avg_words:.1f}")
    print(f"Total sentences analyzed: {len(sentences)}")
    print(f"Sentence length range: {min(word_counts)} - {max(word_counts)} words")

    short_sentences = len([w for w in word_counts if w < 10])
    medium_sentences = len([w for w in word_counts if 10 <= w < 20])
    long_sentences = len([w for w in word_counts if w >= 20])

    print(f"\nSentence distribution:")
    print(f"  Short (< 10 words): {short_sentences} ({short_sentences/len(word_counts)*100:.1f}%)")
    print(f"  Medium (10-20 words): {medium_sentences} ({medium_sentences/len(word_counts)*100:.1f}%)")
    print(f"  Long (> 20 words): {long_sentences} ({long_sentences/len(word_counts)*100:.1f}%)")

    # PREFERRED PHRASES
    print("\n" + "=" * 70)
    print("4. MIKE'S SIGNATURE PHRASES")
    print("=" * 70)

    common_phrases = [
        "I saw",
        "Let me know",
        "Thanks for",
        "I wanted to",
        "Hope all is well",
        "Look forward to",
        "We can",
        "We are",
        "Just wanted",
        "Have a great",
        "If you",
        "Do you have",
        "Could you",
        "Would you",
        "I would love to",
        "Happy to",
        "Let us know"
    ]

    phrase_counts = {}
    for phrase in common_phrases:
        count = all_text.lower().count(phrase.lower())
        if count > 0:
            phrase_counts[phrase] = count

    print("\nMost used phrases:")
    for phrase, count in sorted(phrase_counts.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  '{phrase}': {count} times")

    # CLOSING PATTERNS
    print("\n" + "=" * 70)
    print("5. EMAIL CLOSINGS")
    print("=" * 70)

    closings = []
    for text in mikes_text:
        lines = text.split('\n')
        # Get last 3 lines before signature
        relevant_lines = [l.strip() for l in lines[-5:] if l.strip() and len(l.strip()) < 50]
        if relevant_lines:
            closing = relevant_lines[0]
            if closing and not closing.startswith('Mike'):
                closings.append(closing)

    print("\nTypical closings:")
    unique_closings = list(set(closings))
    for i, closing in enumerate(unique_closings[:10], 1):
        print(f"{i}. {closing}")

    # AI LANGUAGE TO AVOID
    print("\n" + "=" * 70)
    print("6. AI LANGUAGE CHECK (Not Found in Mike's Emails)")
    print("=" * 70)

    ai_phrases = [
        "I hope this email finds you well",
        "Please don't hesitate",
        "I trust this",
        "At your earliest convenience",
        "Per our conversation",
        "As per",
        "Moving forward",
        "Circle back",
        "Touch base",
        "Reach out to me",
        "I wanted to reach out",
        "Just reaching out",
        "Excited to"
    ]

    found_ai = []
    for phrase in ai_phrases:
        if phrase.lower() in all_text.lower():
            found_ai.append(phrase)

    if found_ai:
        print("\n❌ These AI-sounding phrases WERE found:")
        for phrase in found_ai:
            print(f"  - {phrase}")
    else:
        print("\n✅ Good! Mike avoids typical AI language")

    # SUBJECT LINE PATTERNS
    print("\n" + "=" * 70)
    print("7. SUBJECT LINE PATTERNS")
    print("=" * 70)

    subjects = [e.get('subject', '') for e in mikes_emails if not e.get('subject', '').startswith('Re:')]
    print("\nMike's original subject lines:")
    for i, subj in enumerate(subjects, 1):
        print(f"{i}. {subj}")

    print("\n" + "=" * 70)
    print("8. SUMMARY - MIKE'S VOICE PROFILE")
    print("=" * 70)

    print("""
TONE: Conversational-Professional Hybrid
  - Mix of friendly/approachable and businesslike
  - Not overly formal but maintains professionalism
  - Warm without being excessive

SENTENCE STYLE:
  - Predominantly short to medium sentences
  - Direct and to the point
  - Occasional longer explanatory sentences

OPENING STYLE:
  - Often starts with context: "I saw...", "I wanted to..."
  - References recent events or actions
  - Gets to the point quickly

CLOSING STYLE:
  - Simple: "Thanks,", "Let me know", "Looking forward..."
  - Often offers help: "Happy to help", "Let us know if we can help"
  - Sometimes casual: "Have a great weekend"

KEY PATTERNS:
  - Uses first person actively ("I saw", "I wanted", "I hope")
  - Asks direct questions ("Do you have...", "Could you...")
  - Offers value/help before asking
  - References specific details (locations, dates, numbers)
  - Follows up persistently but politely

AVOID:
  - Overly formal business jargon
  - Generic pleasantries
  - Passive voice
  - Long-winded explanations
  - AI-sounding phrases
    """)

    return {
        "tone": "conversational_professional",
        "avg_sentence_length": avg_words,
        "common_openings": openings[:5],
        "common_phrases": list(phrase_counts.keys())[:10],
        "common_closings": unique_closings[:5],
        "avoid_phrases": ai_phrases
    }

if __name__ == '__main__':
    emails_file = r"C:\ClaudeAgents\projects\usac-rhc-automation\extracted_emails.json"
    profile = analyze_voice_profile(emails_file)

    # Save voice profile
    output_file = r"C:\ClaudeAgents\projects\usac-rhc-automation\mike_voice_profile.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(profile, f, indent=2)

    print(f"\n✅ Voice profile saved to: {output_file}")
