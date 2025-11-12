# Get Microsoft Graph API Access Token for testing

$tenantId = "28bf3eae-b2bf-40ec-9bf8-9cb0873f99e2"
$clientId = "6175fba2-7b47-4c60-ac05-06064b063906"
$clientSecret = "XwI8Q~pCBrZOAnQpwf2aniLWBof3~oV86ALi3al9"

$body = @{
    client_id     = $clientId
    scope         = "https://graph.microsoft.com/.default"
    client_secret = $clientSecret
    grant_type    = "client_credentials"
}

$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"

Write-Host "Getting access token..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"

    Write-Host "`nSUCCESS! Access token retrieved." -ForegroundColor Green
    Write-Host "`nAccess Token (copy this):" -ForegroundColor Yellow
    Write-Host $response.access_token
    Write-Host "`nExpires in: $($response.expires_in) seconds ($([math]::Round($response.expires_in/3600, 2)) hours)" -ForegroundColor Cyan

    # Copy to clipboard
    $response.access_token | Set-Clipboard
    Write-Host "`nToken copied to clipboard!" -ForegroundColor Green

} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
}
