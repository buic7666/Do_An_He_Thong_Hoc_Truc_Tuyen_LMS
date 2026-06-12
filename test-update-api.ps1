# Test update segment API
$ErrorActionPreference = "Continue"

# Step 1: Login
Write-Host "Step 1: Login..."
try {
    $loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"teacher@teacher.com","password":"111111"}' `
        -UseBasicParsing
    
    $loginData = $loginResp.Content | ConvertFrom-Json
    $token = $loginData.data.token
    Write-Host "Token obtained"
} catch {
    Write-Host "Login failed: $_"
    exit 1
}

# Step 2: Create lesson
Write-Host "Step 2: Create lesson..."
try {
    $lessonResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/course/37" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body '{"title":"Update Test","content":"Test","videoUrl":"https://www.youtube.com/embed/test","orderIndex":8888}' `
        -UseBasicParsing
    
    $lessonData = $lessonResp.Content | ConvertFrom-Json
    $lessonId = $lessonData.data.id
    Write-Host "Created lesson: $lessonId"
} catch {
    Write-Host "Lesson creation failed: $_"
    exit 1
}

# Step 3: Create a segment
Write-Host "Step 3: Create segment..."
try {
    $segmentResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body '{"startTime":0,"endTime":60,"title":"Original Title"}' `
        -UseBasicParsing
    
    $segmentData = $segmentResp.Content | ConvertFrom-Json
    $segmentId = $segmentData.data.id
    Write-Host "Created segment: $segmentId"
} catch {
    Write-Host "Segment creation failed: $_"
    Write-Host "Response: $($_.Exception.Response.Content)"
    exit 1
}

# Step 4: Update segment
Write-Host "Step 4: Update segment..."
try {
    $updateResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/segments/$segmentId" `
        -Method PUT `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body '{"startTime":10,"endTime":70,"title":"Updated Title"}' `
        -UseBasicParsing
    
    Write-Host "Update response status: $($updateResp.StatusCode)"
    Write-Host "Update response body: $($updateResp.Content)"
    
    $updateData = $updateResp.Content | ConvertFrom-Json
    Write-Host "Update success: $($updateData.success)"
    Write-Host "Updated segment:"
    Write-Host "  - Title: $($updateData.data.title)"
    Write-Host "  - Start: $($updateData.data.startTime)"
    Write-Host "  - End: $($updateData.data.endTime)"
} catch {
    Write-Host "Update failed: $_"
    exit 1
}

Write-Host "All tests passed!"
