$base = 'http://localhost:5000/api'
$email = "flow_$(Get-Random)@lms.local"

function Print-Result($label, $scriptBlock) {
  try {
    $result = & $scriptBlock
    if ($null -ne $result -and $null -ne $result.status) {
      Write-Output "$label OK $($result.status)"
    }
    else {
      Write-Output "$label OK"
    }
    return $result
  }
  catch {
    $status = ''
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $status = $_.Exception.Response.StatusCode.value__
    }
    Write-Output "$label ERR $status"
    Write-Output $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Output $_.ErrorDetails.Message }
    return $null
  }
}

$regBody = @{ name = 'Flow Student'; email = $email; password = 'password123'; role = 'student' } | ConvertTo-Json
$reg = Print-Result 'REGISTER' { Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $regBody }

$loginBody = @{ email = $email; password = 'password123' } | ConvertTo-Json
$login = Print-Result 'LOGIN' { Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $loginBody }
if (-not $login) { exit 1 }
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token" }

Print-Result 'GET /courses' { Invoke-RestMethod -Method Get -Uri "$base/courses" -Headers $headers }
Print-Result 'GET /courses/1' { Invoke-RestMethod -Method Get -Uri "$base/courses/1" -Headers $headers }
Print-Result 'GET /courses/1/lessons' { Invoke-RestMethod -Method Get -Uri "$base/courses/1/lessons" -Headers $headers }
Print-Result 'GET /lessons/1 before enroll' { Invoke-RestMethod -Method Get -Uri "$base/lessons/1" -Headers $headers }

$enrollBody = @{ courseId = 1 } | ConvertTo-Json
Print-Result 'POST /enrollments' { Invoke-RestMethod -Method Post -Uri "$base/enrollments" -Headers $headers -ContentType 'application/json' -Body $enrollBody }
Print-Result 'GET /lessons/1 after enroll' { Invoke-RestMethod -Method Get -Uri "$base/lessons/1" -Headers $headers }
Print-Result 'POST /lessons/1/progress' { Invoke-RestMethod -Method Post -Uri "$base/lessons/1/progress" -Headers $headers }

$progress = Print-Result 'GET /courses/1/progress' { Invoke-RestMethod -Method Get -Uri "$base/courses/1/progress" -Headers $headers }
if ($progress) {
  Write-Output "PROGRESS_PERCENT $($progress.data.completionPercent)"
}

$myEnrollments = Print-Result 'GET /enrollments/me' { Invoke-RestMethod -Method Get -Uri "$base/enrollments/me" -Headers $headers }
if ($myEnrollments) {
  Write-Output "MY_ENROLLMENTS_COUNT $($myEnrollments.data.Count)"
}
