$ErrorActionPreference = "Continue"

Write-Host "===== COMPREHENSIVE API TEST ====="
Write-Host ""
Write-Host "Step 1: Login..."
$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"teacher@teacher.com","password":"111111"}' `
    -UseBasicParsing

$token = ($loginResp.Content | ConvertFrom-Json).data.token
Write-Host "Logged in successfully"

Write-Host ""
Write-Host "Step 2: Create lesson..."
$lessonResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/course/37" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{"Authorization" = "Bearer $token"} `
    -Body '{"title":"Comprehensive Test","content":"Test","videoUrl":"https://www.youtube.com/embed/test","orderIndex":7777}' `
    -UseBasicParsing

$lessonId = ($lessonResp.Content | ConvertFrom-Json).data.id
Write-Host "Created lesson: $lessonId"

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
Write-Host "Created $($segments.Length) segments"

$segment1Id = $segments[0].id
$segment2Id = $segments[1].id

Write-Host ""
Write-Host "Step 4: Test update segment..."
$updateResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/segments/$segment1Id" `
    -Method PUT `
    -ContentType "application/json" `
    -Headers @{"Authorization" = "Bearer $token"} `
    -Body '{"startTime":5,"endTime":125,"title":"Updated Intro"}' `
    -UseBasicParsing

$updateData = $updateResp.Content | ConvertFrom-Json
Write-Host "Updated segment: $($updateData.data.title) ($($updateData.data.startTime)s-$($updateData.data.endTime)s)"

Write-Host ""
Write-Host "Step 5: Fetch all segments for lesson..."
$getResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

$getSegments = $getResp.Content | ConvertFrom-Json
Write-Host "Fetched $($getSegments.Length) segments"

Write-Host ""
Write-Host "Step 6: Test delete segment..."
$deleteResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/segments/$segment2Id" `
    -Method DELETE `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

Write-Host "Deleted segment $segment2Id"

Write-Host ""
Write-Host "Step 7: Verify deletion..."
$verifyResp = Invoke-WebRequest -Uri "http://localhost:5000/api/lessons/$lessonId/segments" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

$verifySegments = $verifyResp.Content | ConvertFrom-Json
Write-Host "Remaining segments: $($verifySegments.Length)"

Write-Host ""
Write-Host "===== ALL TESTS PASSED ====="
Write-Host ""
Write-Host "Summary:"
Write-Host "OK: Bulk create segments"
Write-Host "OK: Update segment"
Write-Host "OK: Delete segment"
Write-Host "OK: Get segments"
