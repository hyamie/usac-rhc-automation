# Configuring O365 Credentials in n8n
## What to Do Once You Get the Azure AD Info from Admin

**Date:** 2025-11-11
**Prerequisite:** Admin has completed Azure AD app registration
**Time Required:** 5 minutes

---

## What You Need from Admin

Make sure you received these 4 values:

```
✅ Application (Client) ID: ________________________________
✅ Directory (Tenant) ID: __________________________________
✅ Client Secret Value: ____________________________________
✅ Redirect URI Confirmed: https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback
```

---

## Step-by-Step Configuration in n8n

### Step 1: Open n8n Credentials

1. Go to: **https://hyamie.app.n8n.cloud**
2. Click: **Settings** (gear icon, bottom left)
3. Click: **Credentials**
4. Click: **+ Add Credential**
5. Search for: **"Microsoft OAuth2 API"**
6. Click: **Microsoft OAuth2 API**

---

### Step 2: Fill in Credential Form

**Copy/paste these values EXACTLY:**

| Field | Value | Source |
|-------|-------|--------|
| **Credential Name** | `O365 Mike Hyams` | Any name you want |
| **Grant Type** | `Authorization Code` | Dropdown selection |
| **Authorization URL** | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` | Copy/paste exactly |
| **Access Token URL** | `https://login.microsoftonline.com/common/oauth2/v2.0/token` | Copy/paste exactly |
| **Client ID** | [Paste Application (Client) ID from admin] | From admin |
| **Client Secret** | [Paste Client Secret Value from admin] | From admin |
| **Scope** | `https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access` | Copy/paste exactly (space-separated) |
| **Auth URI Query Parameters** | **Name:** `tenant`<br>**Value:** `common` | Click "+ Add Parameter" |
| **Authentication** | `Body` | Dropdown selection |

---

### Step 3: Connect Your Account

1. Click: **"Connect my account"** button (bottom of form)
2. You'll be redirected to Microsoft login
3. **Sign in with Mike's work account** (the one you want to create drafts from)
4. You'll see a permission consent screen:
   ```
   USAC RHC Outreach Automation - n8n wants to:
   ✓ Read and write access to your mail
   ✓ Send mail as you
   ✓ Sign you in and read your profile
   ```
5. Click: **"Accept"**
6. You'll be redirected back to n8n
7. The credential should now show: **✅ "Connection successful"**

---

### Step 4: Test the Credential

1. In the credential form, click: **"Test Credential"** (if available)
2. Or save and go to your workflow:
   - Open: "Outreach Email Generation (HTTP)" workflow
   - Click on: **"O365: Create Draft"** node
   - Under **Authentication**, select: `O365 Mike Hyams` credential
   - Click: **"Execute Node"** (test button)
3. If successful, you'll see test execution output

---

### Step 5: Assign Credential to Workflow

1. Open workflow: **"Outreach Email Generation (HTTP)"**
2. Click on: **"O365: Create Draft"** node (Node 7)
3. In node settings, find: **Authentication** section
4. **Credential Type:** Select `Predefined Credential Type`
5. **Credential:** Select `Microsoft OAuth2 API`
6. **Select Credential:** Choose `O365 Mike Hyams`
7. Click: **"Save"** (top right)

---

## Verification Checklist

After setup, verify:

- [ ] Credential created: "O365 Mike Hyams"
- [ ] Connection successful (green checkmark)
- [ ] Mike's account authorized (signed in and accepted permissions)
- [ ] Credential assigned to "O365: Create Draft" node
- [ ] Node test execution successful (or saved for full workflow test)

---

## Troubleshooting

### Error: "Redirect URI mismatch"

**Cause:** The redirect URI in Azure doesn't match n8n's callback

**Fix:**
1. Ask admin to verify in Azure AD: `https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback`
2. Make sure no trailing slash
3. Make sure it's the Web platform type

---

### Error: "Invalid client secret"

**Cause:** Client secret was copied incorrectly or expired

**Fix:**
1. Ask admin to verify the client secret is still valid
2. Copy/paste again carefully (no extra spaces)
3. If expired, admin needs to generate a new one

---

### Error: "AADSTS50011: Redirect URI mismatch"

**Cause:** Different n8n instance or redirect URI

**Fix:**
1. Verify you're on: `https://hyamie.app.n8n.cloud`
2. Ask admin to add the exact redirect URI shown in the error message

---

### Error: "Insufficient privileges"

**Cause:** Permissions not granted by admin

**Fix:**
1. Ask admin to complete Step 4 in their guide
2. Admin must click "Grant admin consent for [Organization]"

---

### Error: "User consent required"

**Cause:** You haven't signed in and accepted permissions yet

**Fix:**
1. Click "Connect my account" again
2. Sign in with Mike's account
3. Accept the permissions

---

## What Happens After Setup

Once configured, the workflow can:

1. **Create email drafts** in Mike's Outlook Drafts folder
2. **Personalize** subject and body using templates + AI enrichment
3. **Store metadata** in Supabase for tracking
4. **Return draft URL** to dashboard for Mike to review

**Mike will still:**
- Review each draft manually
- Edit if needed
- Click "Send" to actually send the email

**The workflow does NOT:**
- Send emails automatically
- Access anyone else's mailbox
- Do anything without Mike clicking "Start Outreach"

---

## Security Notes

**Token Storage:**
- n8n stores the OAuth tokens securely
- Tokens auto-refresh when expired
- Only valid for Mike's account

**Permissions:**
- Mail.ReadWrite: Create and read drafts
- Mail.Send: Future capability (not used yet)
- User.Read: Get Mike's profile for auth

**Access Control:**
- Only you (logged into n8n) can use this credential
- Mike's account still requires his password
- Admin can revoke access anytime in Azure AD

---

## Future Maintenance

**Client Secret Expiration:**

Admin should send reminder when secret is about to expire (usually 24 months).

**When secret expires:**
1. Admin generates new secret in Azure AD
2. You update the credential in n8n:
   - Settings → Credentials → "O365 Mike Hyams"
   - Update "Client Secret" field
   - Click "Connect my account" again
   - Re-authorize

**No workflow changes needed** - just update the credential.

---

## Next Steps After O365 Setup

1. ✅ Credential configured
2. ✅ Assigned to workflow node
3. 🔄 Generate webhook token
4. 🔄 Activate workflow
5. 🔄 Update dashboard `.env.local`
6. 🔄 Test end-to-end

---

**File Location:** `C:\claudeagents\projects\usac-rhc-automation\workflows\O365_N8N_CONFIGURATION.md`
**For Admin Guide:** `O365_SETUP_FOR_ADMIN.md` (in same folder)
