$body = @{ name = 'E2E Student'; email = 'e2e.student@lms.local'; password = 'password123'; role = 'student' } | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
Write-Output ($response | ConvertTo-Json -Compress)
