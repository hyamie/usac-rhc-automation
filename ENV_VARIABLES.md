# Environment Variables Configuration

Complete guide for all environment variables needed across the USAC RHC Automation system.

---

## = Security Warning

**NEVER** commit `.env` files or expose service role keys publicly!

-  Use `.env.local` for local development (Git-ignored by default)
-  Store production secrets in Vercel/hosting platform env settings
-  Rotate keys periodically
- L Never commit `.env` files to Git
- L Never expose service_role keys in client-side code

---

## 1. Supabase (Database)

### Get These Values:
1. Go to your Supabase project dashboard
2. Settings ’ API
3. Copy the values below

### For n8n Workflows (Server-Side):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Use service_role key** - Full database access, bypass RLS

### For Next.js Dashboard (Client-Side):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Use anon key** - RLS policies enforced, safe for client-side

---

## 2. n8n Automation Platform

### Already Configured in Claude Desktop:

```env
N8N_API_URL=https://hyamie.app.n8n.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Additional n8n Environment Variables:

Set these in your n8n instance (Settings ’ Environments):

```env
# Mode and logging
MCP_MODE=stdio
LOG_LEVEL=error
DISABLE_CONSOLE_OUTPUT=true

# Webhook base URL
N8N_WEBHOOK_BASE_URL=https://hyamie.app.n8n.cloud/webhook
```

### n8n Webhook URLs (for Dashboard):

After creating workflows, you'll get webhook URLs like:

```env
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/abc123-enrichment
N8N_WEBHOOK_TOKEN=your_webhook_token_here
```

---

## 3. USAC API

### Get API Access:
- Contact USAC or check their developer portal
- May require registration/approval

```env
USAC_API_URL=https://api.usac.gov/rhc
USAC_API_KEY=your_usac_api_key_here
```

**Alternative**: If USAC doesn't provide API access, you may need to:
- Use web scraping (with rate limiting)
- Download data files manually
- Use third-party data providers

---

## 4. Enrichment APIs

### LinkedIn API (Contact Lookup)

**Option A**: Official LinkedIn API
```env
LINKEDIN_API_KEY=your_linkedin_api_key
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

Get from: [LinkedIn Developer Portal](https://www.linkedin.com/developers/)

**Option B**: Third-party services
- Proxycurl, PhantomBuster, or Apify
- May be easier to get started

### Hunter.io (Email Finding)

```env
HUNTER_IO_API_KEY=your_hunter_io_key
```

Get from: [Hunter.io](https://hunter.io/api)
- Free tier: 25 searches/month
- Paid: Starting at $49/month

### Clearbit (Optional - Company Enrichment)

```env
CLEARBIT_API_KEY=your_clearbit_key
```

Get from: [Clearbit](https://clearbit.com/)
- More expensive but comprehensive data

---

## 5. AI Models (Email Generation)

### Anthropic Claude Sonnet 4.5 (Recommended)

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get from: [Anthropic Console](https://console.anthropic.com/)
- Pay-as-you-go pricing
- ~$3 per 1M input tokens

### OpenAI GPT-4 (Alternative)

```env
OPENAI_API_KEY=sk-...
```

Get from: [OpenAI Platform](https://platform.openai.com/)

---

## 6. Microsoft Outlook (Email Drafts)

### OAuth Setup Required:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register an application
3. Add Microsoft Graph API permissions:
   - `Mail.ReadWrite`
   - `Mail.Send`
4. Generate client secret

```env
MICROSOFT_CLIENT_ID=your_app_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
MICROSOFT_REDIRECT_URI=https://your-domain.com/auth/callback
```

---

## 7. Next.js Dashboard

### Complete `.env.local` for Dashboard:

Create this file in `dashboard/` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# n8n Webhooks
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/enrichment
N8N_WEBHOOK_TOKEN=your_webhook_token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Production `.env.production`:

Set these in Vercel dashboard (not in a file):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# n8n Webhooks
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/enrichment
N8N_WEBHOOK_TOKEN=your_webhook_token

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 8. Optional Services

### Sentry (Error Tracking)

```env
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your_auth_token
```

Get from: [Sentry.io](https://sentry.io/)

### Upstash Redis (Rate Limiting)

```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

Get from: [Upstash](https://upstash.com/)

### Vercel Analytics (Built-in)

No env vars needed, just enable in Vercel dashboard.

---

## Configuration Checklist

### Phase 1: Database (Completed )
- [x] Supabase project created
- [x] SUPABASE_URL obtained
- [x] SUPABASE_SERVICE_KEY obtained (for n8n)
- [x] SUPABASE_ANON_KEY obtained (for dashboard)

### Phase 2: n8n Workflows
- [ ] N8N_API_URL (already have)
- [ ] N8N_API_KEY (already have)
- [ ] SUPABASE_URL added to n8n
- [ ] SUPABASE_SERVICE_KEY added to n8n
- [ ] USAC_API_KEY obtained and added
- [ ] ANTHROPIC_API_KEY obtained and added
- [ ] Enrichment APIs obtained (Hunter.io, LinkedIn)
- [ ] Microsoft OAuth configured

### Phase 3: Dashboard
- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] N8N_ENRICHMENT_WEBHOOK_URL set (after workflow created)
- [ ] N8N_WEBHOOK_TOKEN set

---

## Testing Environment Variables

### Test n8n Can Connect to Supabase:

In n8n, create a simple workflow:
1. Manual Trigger
2. HTTP Request to `${SUPABASE_URL}/rest/v1/clinics_pending_review?limit=1`
   - Headers:
     - `apikey`: `${SUPABASE_SERVICE_KEY}`
     - `Authorization`: `Bearer ${SUPABASE_SERVICE_KEY}`
3. Run and verify you get a response

### Test Dashboard Can Connect:

In Next.js dashboard (when created):
```typescript
// Test in a page component
const { data } = await supabase
  .from('clinics_pending_review')
  .select('count')
console.log('Database connected:', data)
```

---

## Troubleshooting

### "Invalid API key"
- Check for extra spaces or newlines when copying
- Verify the key hasn't expired
- Ensure you're using the correct key for the context (service_role vs anon)

### "CORS error" in dashboard
- Verify NEXT_PUBLIC_ prefix for client-side vars
- Check Supabase URL is correct
- Ensure anon key (not service_role) is used client-side

### n8n webhook "Not found"
- Workflow must be activated
- Webhook URL includes workflow-specific path
- Test with curl first before integrating

### Rate limiting errors
- Implement exponential backoff
- Use batch processing in n8n
- Consider upgrading API tiers

---

## Security Best Practices

1. **Service Role Key**: ONLY use in n8n (server-side), NEVER in dashboard
2. **Anon Key**: Safe for client-side, protected by RLS policies
3. **Webhook Tokens**: Use authentication tokens for all n8n webhooks
4. **API Keys**: Rotate every 90 days
5. **Git**: Always use `.gitignore` for `.env*` files
6. **Vercel**: Use environment variables dashboard, not hardcoded values
7. **Logging**: Never log full API keys (only first/last 4 characters)

Example safe logging:
```javascript
console.log(`Using API key: ${apiKey.slice(0,4)}...${apiKey.slice(-4)}`)
```

---

## Next Steps

After setting up all environment variables:
1.  Database setup complete
2. ¡ **Next**: Configure n8n workflows with these variables
3. See `PROGRESS.md` for implementation roadmap
