# ABC Routing System - Handoff Questions

## 🎯 Project Context
**Date**: 2025-11-14
**Status**: Design Complete - Ready for Implementation Review
**Task**: Add ABC email routing based on requested services + funding thresholds

---

## ❓ Questions for Next Session

### **1. Business Logic Validation**

**Q1.1**: Are the funding thresholds appropriate for your business?
- High: > $100,000 (gets premium Route A treatment)
- Medium: $25,000 - $100,000 (gets standard Route B treatment)
- Low: < $25,000 (gets light-touch Route C treatment)
- Would you like to adjust these numbers?

**Q1.2**: Do the ABC route percentages align with your sales capacity?
- Route A (Premium): 15-25% of filings - intensive, white-glove service
- Route B (Standard): 40-50% of filings - professional, feature-focused
- Route C (Light-Touch): 25-35% of filings - brief, self-service
- Can your team handle this distribution of effort?

**Q1.3**: Is the Route A qualification too strict?
- Currently requires: Direct contact + High funding + Voice/Both services
- This is very selective. Should we broaden Route A criteria?

---

### **2. Email Template Approval**

**Q2.1**: Have you reviewed the three email templates?
- Location: `workflows/email_templates/`
- Route A: Premium, consultative tone (200-300 words)
- Route B: Standard, ROI-focused tone (150-200 words)
- Route C: Light-touch, informational tone (100-125 words)
- Do these align with your brand voice?

**Q2.2**: Should we include direct phone numbers in Route A emails?
- Currently designed to include: "Direct: (555) 123-4567"
- This is meant for senior account reps only
- Do you have dedicated phone lines for high-value contacts?

**Q2.3**: What sender name should we use for each route?
- Route A: "Senior USAC RHC Solutions Architect"
- Route B: "USAC RHC Account Manager"
- Route C: "USAC RHC Support Team"
- Are these titles appropriate?

---

### **3. Service Category Parsing**

**Q3.1**: Are the service categories comprehensive?
- Currently parsing into: voice, data, both_telecom_internet, telecommunications_only, other, unknown
- Have you seen any other service types in USAC Form 465 filings?

**Q3.2**: Should we treat "Voice" and "Both Telecom+Internet" equally?
- Currently both trigger Route A if high funding + direct contact
- Or should "Both" be considered even higher value?

---

### **4. Implementation Planning**

**Q4.1**: When would you like to implement this?
- Implementation takes 2-3 hours
- Best done during low-traffic period
- Do you have a preferred date/time window?

**Q4.2**: Should we implement in phases or all at once?
- Option A: All at once (database + n8n + dashboard) - 2-3 hours
- Option B: Phase 1: Database + n8n (test in backend first) - 1 hour
           Phase 2: Dashboard updates (add UI later) - 1 hour
- Which approach do you prefer?

**Q4.3**: Do you want to test with historical data first?
- We can run the routing logic on existing clinics in the database
- This will show you the distribution before going live
- Would you like to do a dry run first?

---

### **5. MCP Profile & Tools**

**Q5.1**: Should we switch to the "webapp" MCP profile now?
- Currently loaded: donnie (infrastructure/deployment profile)
- For workflow development, you need: n8n, supabase-usac, playwright MCPs
- Can I guide you through switching profiles before we implement?

**Q5.2**: Do you have access to all required systems?
- [ ] Supabase SQL Editor (fhuqiicgmfpnmficopqp)
- [ ] n8n workflow editor (hyamie.app.n8n.cloud)
- [ ] Vercel dashboard (for dashboard deployment)
- [ ] Anthropic API key (for Claude email generation)
- Are there any access issues I should know about?

---

### **6. Dashboard Integration**

**Q6.1**: How prominent should route badges be in the dashboard?
- Currently designed to show: 🔥 Premium, 📊 Standard, 📝 Light
- Should these be:
  - Prominent (large, colorful badges)
  - Subtle (small indicators)
  - Optional (toggle visibility)

**Q6.2**: Should we add route filtering to the main clinic list?
- Current design includes a route filter: All / Premium (A) / Standard (B) / Light (C)
- Is this useful for your workflow?

**Q6.3**: Do you want to see the routing reasoning in the UI?
- We can show WHY each clinic got its route assignment
- Example: "Premium Route: Direct contact with high funding ($175,000) requesting voice services"
- Would this be helpful or just clutter?

---

### **7. Testing & Validation**

**Q7.1**: Who should validate the email templates before going live?
- Route A (Premium): Should a senior sales person review?
- Route B (Standard): Standard approval process?
- Route C (Light-Touch): Can we proceed without additional approval?

**Q7.2**: How many test cases should we run?
- Minimum: 3 test cases (one per route)
- Recommended: 8 test cases (covers edge cases)
- Comprehensive: 15+ test cases (all scenarios)
- What level of testing do you want?

**Q7.3**: Should we create a staging environment first?
- We can test in a separate Supabase project
- Or test directly in production with test records
- What's your risk tolerance?

---

### **8. Monitoring & Success Metrics**

**Q8.1**: What metrics matter most to you?
- Open rates per route?
- Response rates per route?
- Conversion to calls/meetings?
- Revenue per route?
- Cost per acquisition?

**Q8.2**: How often should we review route performance?
- Daily for first week?
- Weekly for first month?
- Monthly ongoing?

**Q8.3**: At what point should we adjust thresholds?
- If Route A is < 10% of filings (too exclusive)
- If Route C is > 50% of filings (too many light-touch)
- What triggers a threshold adjustment?

---

### **9. Rollback & Safety**

**Q9.1**: What's your rollback comfort level?
- Database: Can we remove new columns if needed? (data loss)
- Workflows: Can we revert to previous version?
- Dashboard: Can we roll back Vercel deployment?
- Are you comfortable with these rollback options?

**Q9.2**: Should we keep the old binary routing as fallback?
- We can maintain both systems temporarily
- Old: is_consultant → consultant/direct template
- New: ABC routing with 3 tiers
- Dual-mode for safety?

---

### **10. Next Steps Confirmation**

**Q10.1**: What should we do in the next session?
- [ ] Answer these questions and refine design
- [ ] Proceed directly with implementation
- [ ] Do a dry run on historical data first
- [ ] Something else?

**Q10.2**: Is there anything else you want to customize?
- Email subject lines?
- Routing rules?
- Dashboard features?
- Metrics/reporting?

---

## 📋 Quick Start for Next Session

When you log in next, I will:
1. ✅ Review your answers to these questions
2. ✅ Make any requested adjustments to the design
3. ✅ Guide you through MCP profile switch (if needed)
4. ✅ Walk through implementation step-by-step
5. ✅ Help with testing and validation
6. ✅ Monitor first batch of routed emails

---

## 📁 All Files Ready for Review

Before next session, you may want to review:
- **START HERE**: `ABC_ROUTING_SUMMARY.md` (executive overview)
- **Business Rules**: `docs/ABC_ROUTING_LOGIC.md` (complete routing logic)
- **Implementation**: `IMPLEMENTATION_GUIDE_ABC_ROUTING.md` (step-by-step)
- **Email Templates**: `workflows/email_templates/*.md` (all three routes)

---

## ⚡ Quick Decision Tree

**If you want to proceed immediately next session:**
- Review `ABC_ROUTING_SUMMARY.md` (5 min read)
- Approve the funding thresholds ($100k, $25k)
- Confirm email templates are acceptable
- Be ready to switch to "webapp" MCP profile
- Allocate 2-3 hours for implementation

**If you want to refine the design first:**
- Read through these questions
- Review `docs/ABC_ROUTING_LOGIC.md` in detail
- Check email templates against your brand voice
- Consider testing on historical data first
- We'll adjust based on your feedback

---

## 🎯 Expected Outcome

After next session, you will have:
- ✅ ABC routing fully implemented and tested
- ✅ Three-tier email templates generating automatically
- ✅ Dashboard showing route assignments with badges
- ✅ Monitoring in place to track performance
- ✅ Ability to adjust thresholds based on results

**OR** (if you prefer refinement first):
- ✅ Design adjusted to your specifications
- ✅ Dry run completed on historical data
- ✅ Route distribution validated
- ✅ Ready to implement with confidence

---

## 💬 Contact Context for AI

**Current MCP Profile**: donnie (infrastructure)
**Recommended Profile**: webapp (for n8n/Supabase work)
**Project Phase**: workflow-development
**Complexity**: Medium
**Risk**: Low (additive, backward compatible)
**Status**: Design Complete, Ready for Review/Implementation

---

**Handoff Created**: 2025-11-14
**Next Session**: Answer questions → Refine or Implement
**Estimated Next Session Duration**: 2-4 hours (depending on path chosen)
