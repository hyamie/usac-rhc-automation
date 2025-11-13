# ==============================================================================
# Test Consultant Workflow
# Tests n8n workflow with consultant contact type
# ==============================================================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "USAC RHC - Consultant Workflow Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$webhookUrl = "https://hyamie.app.n8n.cloud/webhook-test/outreach-email"
$consultantClinicId = "test-consultant-001"
$directClinicId = "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb"  # Honesdale - direct contact

# ==============================================================================
# Test 1: Consultant Contact
# ==============================================================================
Write-Host "[TEST 1] Testing Consultant Contact" -ForegroundColor Yellow
Write-Host "Clinic ID: $consultantClinicId" -ForegroundColor Gray
Write-Host "Expected: contact_type = 'consultant', consultant template selected" -ForegroundColor Gray
Write-Host ""

try {
    $body1 = @{
        clinic_id = $consultantClinicId
    } | ConvertTo-Json

    $response1 = Invoke-RestMethod -Method POST `
        -Uri $webhookUrl `
        -Body $body1 `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "✓ Workflow completed successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response1 | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""

    # Parse response
    if ($response1.success) {
        Write-Host "✓ Draft created: $($response1.draft_url)" -ForegroundColor Green
        Write-Host "✓ Email Instance ID: $($response1.email_instance_id)" -ForegroundColor Green
        Write-Host "✓ Template ID: $($response1.template_id)" -ForegroundColor Green
    } else {
        Write-Host "✗ Draft creation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Test 1 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response Body: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "------------------------------------" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 3

# ==============================================================================
# Test 2: Direct Contact (for comparison)
# ==============================================================================
Write-Host "[TEST 2] Testing Direct Contact (Comparison)" -ForegroundColor Yellow
Write-Host "Clinic ID: $directClinicId" -ForegroundColor Gray
Write-Host "Expected: contact_type = 'direct', direct template selected" -ForegroundColor Gray
Write-Host ""

try {
    $body2 = @{
        clinic_id = $directClinicId
    } | ConvertTo-Json

    $response2 = Invoke-RestMethod -Method POST `
        -Uri $webhookUrl `
        -Body $body2 `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "✓ Workflow completed successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response2 | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""

    if ($response2.success) {
        Write-Host "✓ Draft created: $($response2.draft_url)" -ForegroundColor Green
        Write-Host "✓ Email Instance ID: $($response2.email_instance_id)" -ForegroundColor Green
        Write-Host "✓ Template ID: $($response2.template_id)" -ForegroundColor Green
    } else {
        Write-Host "✗ Draft creation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Test 2 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response Body: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "------------------------------------" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 3

# ==============================================================================
# Test 3: Template Rotation (Consultant)
# ==============================================================================
Write-Host "[TEST 3] Testing Template Rotation" -ForegroundColor Yellow
Write-Host "Running workflow 3 times with consultant contact" -ForegroundColor Gray
Write-Host "Expected: Templates A, B, C selected in order" -ForegroundColor Gray
Write-Host ""

$templates = @()

for ($i = 1; $i -le 3; $i++) {
    Write-Host "Run $i..." -ForegroundColor Cyan

    try {
        $bodyRotation = @{
            clinic_id = $consultantClinicId
        } | ConvertTo-Json

        $responseRotation = Invoke-RestMethod -Method POST `
            -Uri $webhookUrl `
            -Body $bodyRotation `
            -ContentType "application/json" `
            -ErrorAction Stop

        if ($responseRotation.success) {
            $templates += $responseRotation.template_id
            Write-Host "  ✓ Template ID: $($responseRotation.template_id)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Run $i Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Template IDs used:" -ForegroundColor Cyan
$templates | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

# Check if all 3 templates are unique
$uniqueTemplates = $templates | Select-Object -Unique
if ($uniqueTemplates.Count -eq 3) {
    Write-Host "✓ All 3 templates (A, B, C) were used" -ForegroundColor Green
} else {
    Write-Host "✗ Template rotation issue: Only $($uniqueTemplates.Count) unique templates used" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Mike's Outlook Drafts folder" -ForegroundColor White
Write-Host "2. Verify consultant email uses 'working with [clinic]' language" -ForegroundColor White
Write-Host "3. Verify direct email uses 'I noticed [clinic] filed' language" -ForegroundColor White
Write-Host "4. Run database verification queries (see CONSULTANT_WORKFLOW_TEST_PLAN.md)" -ForegroundColor White
Write-Host ""
Write-Host "Database Verification Query:" -ForegroundColor Cyan
Write-Host @"
SELECT
  ei.id,
  c.clinic_name,
  c.has_direct_contact,
  et.template_variant,
  et.contact_type,
  LEFT(ei.subject_rendered, 80) as subject,
  ei.created_at
FROM email_instances ei
JOIN email_templates et ON ei.template_id = et.id
JOIN clinics_pending_review c ON ei.clinic_id = c.id
WHERE ei.created_at > now() - interval '10 minutes'
ORDER BY ei.created_at DESC;
"@ -ForegroundColor Gray
Write-Host ""
