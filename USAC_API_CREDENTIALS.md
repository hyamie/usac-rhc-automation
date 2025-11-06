# USAC Open Data API Credentials

**CRITICAL - DO NOT COMMIT TO GIT**

## API Access Details

**API Key Name:** CA-n8n
**API Key ID:** 11dn8902oi2mirzchn1huum05
**API Key Secret:** 392stja8i9rj3sswbje7bo7t6wgfvedsz49iwjymzgtpjhj3xc

**Note:** These credentials cannot be retrieved again. They are stored in `C:\ClaudeAgents\config\.env`

## Usage in n8n

When configuring USAC API nodes in n8n workflows, use:
- **Header:** `X-App-Token: 392stja8i9rj3sswbje7bo7t6wgfvedsz49iwjymzgtpjhj3xc`
- **Or Query Parameter:** `$$app_token=392stja8i9rj3sswbje7bo7t6wgfvedsz49iwjymzgtpjhj3xc`

## API Endpoints

**Form 465 Postings:**
- Endpoint: TBD (from CSV analysis)
- Base URL: https://opendata.usac.org/resource/

**Commitments & Disbursements:**
- Dataset ID: sm8n-gg82
- Endpoint: https://opendata.usac.org/resource/sm8n-gg82.json

## Security Notes

- This file is in .gitignore
- Credentials stored in environment variables
- Never expose in client-side code
