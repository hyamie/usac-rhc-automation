# Test webhook for n8n workflow
$body = @{
    clinic_id = "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb"
    user_id = "test-user-123"
} | ConvertTo-Json

Write-Host "Sending test request to webhook..." -ForegroundColor Cyan
Write-Host "Clinic: Honesdale Family Health Center (HCP 50472)" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://hyamie.app.n8n.cloud/webhook-test/outreach-email" -Method Post -Body $body -ContentType "application/json"
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}
