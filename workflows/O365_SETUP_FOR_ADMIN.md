# Microsoft O365 Setup for n8n Email Draft Creation
## Step-by-Step Guide for IT Admin

**Date:** 2025-11-11
**Purpose:** Enable automated email draft creation in Mike Hyams' Outlook account via n8n workflow
**Security Level:** Draft creation only (no sending), single user access

---

## Overview for IT Admin

We need to create an Azure AD App Registration that allows our n8n automation platform to:
- ✅ Create email drafts in Mike Hyams' Outlook account
- ✅ Read user profile information
- ❌ **NOT** send emails automatically
- ❌ **NOT** access other users' mailboxes

**Time Required:** 15-20 minutes
**Access Required:** Azure AD Administrator or Application Administrator role

---

## What We Need from You

At the end of this setup, we'll need these 4 values:

1. **Application (Client) ID** - UUID format
2. **Directory (Tenant) ID** - UUID format
3. **Client Secret Value** - Long string (save immediately, only shown once)
4. **Redirect URI Confirmation** - To verify it matches our n8n instance

---

## Step-by-Step Instructions

### Step 1: Access Azure Portal

1. Go to: **https://portal.azure.com**
2. Sign in with admin credentials
3. Navigate to: **Azure Active Directory** (left sidebar or search)

---

### Step 2: Create App Registration

1. In Azure AD, go to: **App registrations**
2. Click: **+ New registration** (top left)

**Fill in the registration form:**

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `USAC RHC Outreach Automation - n8n` | Descriptive name for audit logs |
| **Supported account types** | ✅ **Accounts in this organizational directory only (Single tenant)** | Most secure option |
| **Redirect URI** | Platform: **Web**<br>URI: `https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback` | n8n's OAuth callback endpoint |

3. Click: **Register**

**IMPORTANT:** After registration, you'll see the app's overview page. **Copy these values immediately:**

```
Application (client) ID: ________________________________________
Directory (tenant) ID: __________________________________________
```

---

### Step 3: Create Client Secret

1. In your new app registration, left sidebar: **Certificates & secrets**
2. Click: **+ New client secret**

**Fill in:**

| Field | Value | Notes |
|-------|-------|-------|
| **Description** | `n8n workflow secret` | For tracking |
| **Expires** | **24 months** | Recommended (can use Custom if you prefer) |

3. Click: **Add**

**CRITICAL:** The secret value will **only be shown once**. Copy it immediately:

```
Client Secret Value: ________________________________________________
```

**Security Note:** Store this securely. If lost, you'll need to generate a new one.

---

### Step 4: Configure API Permissions

1. In your app registration, left sidebar: **API permissions**
2. Click: **+ Add a permission**
3. Select: **Microsoft Graph**
4. Select: **Delegated permissions** (not Application permissions)

**Add these 3 permissions:**

| Permission | Purpose | User Consent Required |
|------------|---------|----------------------|
| ✅ **Mail.ReadWrite** | Create and read email drafts | Yes |
| ✅ **Mail.Send** | (Future: send capability) | Yes |
| ✅ **User.Read** | Read user profile for authentication | Yes |

5. Click: **Add permissions**

**Grant Admin Consent:**

6. Click: **Grant admin consent for [Your Organization]**
7. Confirm: **Yes**
8. All permissions should now show **"Granted for [Your Organization]"** with green checkmarks

---

### Step 5: Verify Configuration

**Check these settings:**

✅ **App Registration Overview:**
- Name: `USAC RHC Outreach Automation - n8n`
- Application (client) ID: [UUID copied]
- Directory (tenant) ID: [UUID copied]
- Supported account types: `My organization only`

✅ **Certificates & secrets:**
- Active client secret exists (Description: `n8n workflow secret`)
- Expiry date: [Date noted]

✅ **API permissions:**
- Microsoft Graph - Delegated:
  - Mail.ReadWrite ✅ Granted
  - Mail.Send ✅ Granted
  - User.Read ✅ Granted

✅ **Authentication:**
- Redirect URIs: `https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback` (Web)

---

## What to Provide to Development Team

**Copy this information and send securely:**

```
=== Azure AD App Registration Details ===

Application (Client) ID:
[Paste UUID here]

Directory (Tenant) ID:
[Paste UUID here]

Client Secret Value:
[Paste secret here - IMPORTANT: Only shown once]

Redirect URI Confirmed:
https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback

Permissions Granted:
✅ Mail.ReadWrite (Delegated)
✅ Mail.Send (Delegated)
✅ User.Read (Delegated)

Admin Consent: ✅ Granted for Organization

Created Date: 2025-11-11
Expires Date: [Client secret expiry date]
```

---

## Security Considerations

### What This App Can Do:
- ✅ Create email drafts in Mike Hyams' mailbox (after he authorizes)
- ✅ Read Mike Hyams' email messages (if authorized)
- ✅ Send emails from Mike Hyams' account (only if he reviews and sends manually)

### What This App CANNOT Do:
- ❌ Access any other user's mailbox
- ❌ Send emails without user review (drafts only)
- ❌ Modify calendar, contacts, or other data
- ❌ Access organization-wide data
- ❌ Perform administrative actions

### Delegated vs Application Permissions:
- **We're using:** Delegated permissions (requires user sign-in)
- **Not using:** Application permissions (would allow background access without user)
- **Result:** Mike must explicitly authorize this app for his account

### User Authorization Process:
When configured in n8n, Mike will:
1. Click "Connect my account" in n8n
2. Be redirected to Microsoft login
3. See permission consent screen listing: Mail.ReadWrite, Mail.Send, User.Read
4. Approve the permissions
5. Be redirected back to n8n

---

## Monitoring and Auditing

**Azure AD Audit Logs:**
- Go to: **Azure AD** → **Monitoring** → **Audit logs**
- Filter by: Application = "USAC RHC Outreach Automation - n8n"
- Review: Sign-in attempts, permission grants, API calls

**Microsoft Graph Activity:**
- Go to: **Azure AD** → **Enterprise applications** → [Your app]
- **Usage & insights** → View sign-ins and API activity

---

## Troubleshooting

### Issue: "Admin consent required"
- **Cause:** Permissions weren't granted for the organization
- **Fix:** Step 4, click "Grant admin consent"

### Issue: "Redirect URI mismatch"
- **Cause:** Redirect URI doesn't match n8n's callback URL exactly
- **Fix:** Verify URI is: `https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback` (no trailing slash)

### Issue: "Client secret expired"
- **Cause:** Secret reached expiry date
- **Fix:** Generate new secret in "Certificates & secrets"

### Issue: "Insufficient privileges"
- **Cause:** User attempting setup doesn't have Azure AD admin role
- **Fix:** Contact Global Administrator or Application Administrator

---

## Expiration and Maintenance

**Client Secret Expiration:**
- Set a reminder 2 weeks before expiry date
- Generate new secret in Azure portal
- Update secret in n8n credentials
- Old secret will continue working until expiry

**Annual Review:**
- Review app is still in use
- Review permissions are still appropriate
- Check audit logs for unusual activity

---

## Alternative: Less Privileged Setup (If Needed)

If your organization has strict policies, you can:

1. **Reduce scope to drafts only:**
   - Remove: `Mail.Send` permission
   - Keep: `Mail.ReadWrite` (includes draft creation)
   - Result: Can create drafts but not send

2. **Use user-specific credentials:**
   - Mike can register the app himself in personal Azure AD
   - No admin consent required
   - Only works for his account

---

## Support Contacts

**n8n Platform:**
- URL: https://hyamie.app.n8n.cloud
- Documentation: https://docs.n8n.io/integrations/builtin/credentials/microsoft/

**Microsoft Graph API:**
- Documentation: https://learn.microsoft.com/en-us/graph/api/resources/message
- Mail API Reference: https://learn.microsoft.com/en-us/graph/api/user-post-messages

**Azure AD App Registrations:**
- Documentation: https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app

---

## Quick Reference Card

**For Development Team (After Setup):**

When configuring n8n credential, use:

```
Grant Type: Authorization Code
Authorization URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
Access Token URL: https://login.microsoftonline.com/common/oauth2/v2.0/token
Client ID: [From Step 2]
Client Secret: [From Step 3]
Scope: https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access
Auth URI Query Parameters:
  - Name: tenant, Value: common
Authentication: Body
```

---

## Checklist for Admin

Before sending credentials to development team:

- [ ] App registration created in Azure AD
- [ ] Redirect URI configured correctly
- [ ] Client secret generated and copied (only shown once!)
- [ ] All 3 API permissions added (Mail.ReadWrite, Mail.Send, User.Read)
- [ ] Admin consent granted for organization
- [ ] Application (Client) ID copied
- [ ] Directory (Tenant) ID copied
- [ ] Client secret expiry date noted
- [ ] Credentials sent securely to development team

---

**Setup Complete!** The development team can now configure n8n with these credentials.

**Estimated time for n8n configuration:** 5 minutes
**User authorization required:** Yes (Mike must sign in once)

---

**Questions?** Contact development team or refer to Microsoft documentation linked above.

**Created:** 2025-11-11
**For:** USAC RHC Automation Project - Phase 4.2
**File:** O365_SETUP_FOR_ADMIN.md
