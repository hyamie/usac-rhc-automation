import os
import json
import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Try to import extract_msg, if not available use alternative
try:
    import extract_msg
    HAS_EXTRACT_MSG = True
except ImportError:
    HAS_EXTRACT_MSG = False
    print("Note: extract_msg not installed, will try alternative parsing")

def extract_email_simple(msg_path):
    """Fallback: Read .msg file as text and extract what we can"""
    try:
        with open(msg_path, 'rb') as f:
            content = f.read()
            # Try to decode as much as we can
            text = content.decode('utf-8', errors='ignore')

            # Extract key information
            result = {
                'file': os.path.basename(msg_path),
                'raw_text': text[:5000],  # First 5000 chars
                'method': 'simple_text_extraction'
            }
            return result
    except Exception as e:
        return {'file': os.path.basename(msg_path), 'error': str(e)}

def extract_email_proper(msg_path):
    """Use extract_msg library for proper parsing"""
    try:
        msg = extract_msg.Message(msg_path)

        result = {
            'file': os.path.basename(msg_path),
            'subject': msg.subject,
            'sender': msg.sender,
            'to': msg.to,
            'date': str(msg.date),
            'body': msg.body,
            'method': 'extract_msg_library'
        }

        msg.close()
        return result
    except Exception as e:
        return {'file': os.path.basename(msg_path), 'error': str(e)}

def main():
    email_dir = r"C:\ClaudeAgents\projects\usac-rhc-automation\email examples"
    output_file = r"C:\ClaudeAgents\projects\usac-rhc-automation\extracted_emails.json"

    emails = []

    for filename in os.listdir(email_dir):
        if filename.endswith('.msg'):
            msg_path = os.path.join(email_dir, filename)
            print(f"Processing: {filename}")

            if HAS_EXTRACT_MSG:
                email_data = extract_email_proper(msg_path)
            else:
                email_data = extract_email_simple(msg_path)

            emails.append(email_data)

    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(emails, f, indent=2, ensure_ascii=False)

    print(f"\nExtracted {len(emails)} emails to: {output_file}")

    # Print summary
    for email in emails:
        if 'error' not in email:
            print(f"\n{email['file']}:")
            if 'subject' in email:
                print(f"  Subject: {email['subject']}")
            if 'body' in email:
                print(f"  Body length: {len(email['body'])} chars")

if __name__ == '__main__':
    main()
