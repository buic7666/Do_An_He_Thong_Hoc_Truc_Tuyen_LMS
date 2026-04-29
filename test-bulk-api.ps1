# Test bulk segment API
$ErrorActionPreference = "Continue"

# Step 1: Login
Write-Host "Step 1: Login..."
try {
    $loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"teacher@teacher.com","password":"111111"}' `
        -UseBasicParsing
    
    Write-Host "Response status: $($loginResp.StatusCode)"
    Write-Host "Response body: $($loginResp.Content)"
    
    if ($loginResp.StatusCode -ne 200) {
        Write-Host "Login failed with status $($loginResp.StatusCode)"
        exit 1
    }
    
    $loginData = $loginResp.Content | ConvertFrom-Json
    $token = $loginData.data.token
    Write-Host "Token obtained: $($token.Substring(0,20))..."
} catch {
    Write-Host "Login request failed: $_"
    exit 1
}

# Step 2: Create lesson
Write-Host "Step 2: Create lesson..."
try {
    $lessonResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/course/37" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body '{"title":"Bulk Test","content":"Test","videoUrl":"https://www.youtube.com/embed/test","orderIndex":9999}' `
        -UseBasicParsing
    
    $lessonData = $lessonResp.Content | ConvertFrom-Json
    $lessonId = $lessonData.data.id
    Write-Host "Created lesson: $lessonId"
} catch {
    Write-Host "Lesson creation failed: $_"
    exit 1
}

# Step 3: Test bulk endpoint
Write-Host "Step 3: Test bulk segments endpoint..."
try {
    $bulkResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments/bulk" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body '{"segments":[{"startTime":0,"endTime":180,"title":"Part 1"},{"startTime":180,"endTime":360,"title":"Part 2"}]}' `
        -UseBasicParsing
    
    Write-Host "Bulk response status: $($bulkResp.StatusCode)"
    Write-Host "Bulk response body: $($bulkResp.Content)"
    
    $bulkData = $bulkResp.Content | ConvertFrom-Json
    Write-Host "Bulk endpoint success: $($bulkData.success)"
    Write-Host "Segments count: $($bulkData.data.Length)"
} catch {
    Write-Host "Bulk endpoint failed: $_"
    exit 1
}

Write-Host "All tests passed!"
