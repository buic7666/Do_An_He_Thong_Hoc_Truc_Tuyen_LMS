$base = 'http://localhost:5000/api'
$email = "day2_$(Get-Random)@lms.local"

function Call-Api {
  param(
    [string]$Label,
    [scriptblock]$Action,
    [int]$Expected
  )

  try {
    $result = & $Action
    $status = if ($null -ne $result -and $null -ne $result.status) { [int]$result.status } else { 200 }
    $ok = if ($status -eq $Expected) { 'PASS' } else { 'FAIL' }
    Write-Host "$ok | $Label | expected=$Expected actual=$status"
    return $result
  }
  catch {
    $actual = 0
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $actual = [int]$_.Exception.Response.StatusCode.value__
    }
    $ok = if ($actual -eq $Expected) { 'PASS' } else { 'FAIL' }
    Write-Host "$ok | $Label | expected=$Expected actual=$actual"
    if ($_.ErrorDetails.Message) {
      Write-Host "  detail: $($_.ErrorDetails.Message)"
    }
    return $null
  }
}

# Auth flow
$registerBody = @{ name = 'Day 2 Student'; email = $email; password = 'password123'; role = 'student' } | ConvertTo-Json
$reg = Call-Api -Label 'POST /auth/register' -Expected 201 -Action { Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $registerBody }

$dup = Call-Api -Label 'POST /auth/register (duplicate)' -Expected 409 -Action { Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $registerBody }

$loginBody = @{ email = $email; password = 'password123' } | ConvertTo-Json
$login = Call-Api -Label 'POST /auth/login' -Expected 200 -Action { Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $loginBody }

$badLoginBody = @{ email = $email; password = 'wrongpass' } | ConvertTo-Json
$badLogin = Call-Api -Label 'POST /auth/login (wrong pass)' -Expected 401 -Action { Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $badLoginBody }

$token = if ($login -and $login.data) { $login.data.token } else { $null }
$headers = @{ Authorization = "Bearer $token" }

$me = Call-Api -Label 'GET /auth/me (with token)' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/auth/me" -Headers $headers }
$meNoToken = Call-Api -Label 'GET /auth/me (no token)' -Expected 401 -Action { Invoke-RestMethod -Method Get -Uri "$base/auth/me" }

# Day 2 flow
$courses = Call-Api -Label 'GET /courses' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/courses" -Headers $headers }
$courseDetail = Call-Api -Label 'GET /courses/1' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/courses/1" -Headers $headers }
$courseLessons = Call-Api -Label 'GET /courses/1/lessons' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/courses/1/lessons" -Headers $headers }

$lessonBefore = Call-Api -Label 'GET /lessons/1 (before enroll)' -Expected 403 -Action { Invoke-RestMethod -Method Get -Uri "$base/lessons/1" -Headers $headers }

$enrollBody = @{ courseId = 1 } | ConvertTo-Json
$enroll = Call-Api -Label 'POST /enrollments' -Expected 201 -Action { Invoke-RestMethod -Method Post -Uri "$base/enrollments" -Headers $headers -ContentType 'application/json' -Body $enrollBody }
$enrollDup = Call-Api -Label 'POST /enrollments (duplicate)' -Expected 409 -Action { Invoke-RestMethod -Method Post -Uri "$base/enrollments" -Headers $headers -ContentType 'application/json' -Body $enrollBody }

$lessonAfter = Call-Api -Label 'GET /lessons/1 (after enroll)' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/lessons/1" -Headers $headers }
$markProgress = Call-Api -Label 'POST /lessons/1/progress' -Expected 200 -Action { Invoke-RestMethod -Method Post -Uri "$base/lessons/1/progress" -Headers $headers }
$courseProgress = Call-Api -Label 'GET /courses/1/progress' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/courses/1/progress" -Headers $headers }
$myEnrollments = Call-Api -Label 'GET /enrollments/me' -Expected 200 -Action { Invoke-RestMethod -Method Get -Uri "$base/enrollments/me" -Headers $headers }

if ($courseProgress -and $courseProgress.data) {
  Write-Host "INFO | completionPercent=$($courseProgress.data.completionPercent)"
}
