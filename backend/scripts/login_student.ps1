$body = @{ email = 'student.seed1@lms.local'; password = '12345678' } | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
Write-Output ($response | ConvertTo-Json -Compress)
