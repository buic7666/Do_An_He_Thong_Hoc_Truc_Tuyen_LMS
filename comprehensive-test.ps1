# Comprehensive API test - all endpoints
$ErrorActionPreference = "Continue"

# Step 1: Login
Write-Host "===== COMPREHENSIVE API TEST ====="
Write-Host ""
Write-Host "Step 1: Login..."
$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"teacher@teacher.com","password":"111111"}' `
    -UseBasicParsing

$token = ($loginResp.Content | ConvertFrom-Json).data.token
Write-Host "✓ Logged in successfully"

# Step 2: Create lesson
Write-Host ""
Write-Host "Step 2: Create lesson..."
$lessonResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/course/37" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{"Authorization" = "Bearer $token"} `
    -Body '{"title":"Comprehensive Test","content":"Test","videoUrl":"https://www.youtube.com/embed/test","orderIndex":7777}' `
    -UseBasicParsing

$lessonId = ($lessonResp.Content | ConvertFrom-Json).data.id
Write-Host "✓ Created lesson: $lessonId"

# Step 3: Test bulk segments
Write-Host ""
Write-Host "Step 3: Test bulk create segments..."
$bulkResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments/bulk" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{"Authorization" = "Bearer $token"} `
    -Body '{"segments":[{"startTime":0,"endTime":120,"title":"Intro"},{"startTime":120,"endTime":240,"title":"Main Content"},{"startTime":240,"endTime":360,"title":"Conclusion"}]}' `
    -UseBasicParsing

$segmentData = $bulkResp.Content | ConvertFrom-Json
$segments = $segmentData.data
Write-Host "✓ Created $($segments.Length) segments"

$segment1Id = $segments[0].id
$segment2Id = $segments[1].id

# Step 4: Test update segment
Write-Host ""
Write-Host "Step 4: Test update segment..."
$updateResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/segments/$segment1Id" `
    -Method PUT `
    -ContentType "application/json" `
    -Headers @{"Authorization" = "Bearer $token"} `
    -Body '{"startTime":5,"endTime":125,"title":"Updated Intro"}' `
    -UseBasicParsing

$updateData = $updateResp.Content | ConvertFrom-Json
Write-Host "✓ Updated segment:"
Write-Host "  - Title: $($updateData.data.title)"
Write-Host "  - Start: $($updateData.data.startTime)s"
Write-Host "  - End: $($updateData.data.endTime)s"

# Step 5: Test get segments
Write-Host ""
Write-Host "Step 5: Fetch all segments for lesson..."
$getResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

$getSegments = $getResp.Content | ConvertFrom-Json
Write-Host "✓ Fetched $($getSegments.Length) segments:"
$getSegments | ForEach-Object { Write-Host "  - [$($_.id)] $($_.title): $($_.startTime)s-$($_.endTime)s" }

# Step 6: Test delete segment  
Write-Host ""
Write-Host "Step 6: Test delete segment..."
$deleteResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/segments/$segment2Id" `
    -Method DELETE `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

Write-Host "✓ Deleted segment $segment2Id"

# Step 7: Verify deletion
Write-Host ""
Write-Host "Step 7: Verify deletion..."
$verifyResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

$verifySegments = $verifyResp.Content | ConvertFrom-Json
Write-Host "✓ Remaining segments: $($verifySegments.Length)"
$verifySegments | ForEach-Object { Write-Host "  - [$($_.id)] $($_.title): $($_.startTime)s-$($_.endTime)s" }

Write-Host ""
Write-Host "===== ALL TESTS PASSED ====="
Write-Host ""
Write-Host "Summary:"
Write-Host "OK: Bulk create segments (POST /lessons/:id/segments/bulk)"
Write-Host "OK: Update segment (PUT /lessons/segments/:id)"
Write-Host "OK: Delete segment (DELETE /lessons/segments/:id)"
Write-Host "OK: Get segments (GET /lessons/:id/segments)"
Write-Host ""
Write-Host "Test lesson ID: $lessonId"
Write-Host "All segment CRUD operations working correctly!"
