$base = 'http://localhost:5000/api'

function Sign-In-And-Token($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
  return $res.data.token
}

try {
  $teacherToken = Sign-In-And-Token 'teacher@lms.local' 'password123'
  $studentToken = Sign-In-And-Token 'student1@lms.local' 'password123'

  $courseBody = @{ title = 'Role Test Course'; description = 'Created by teacher'; price = 0 } | ConvertTo-Json

  try {
    $teacherRes = Invoke-RestMethod -Method Post -Uri "$base/courses" -Headers @{ Authorization = "Bearer $teacherToken" } -ContentType 'application/json' -Body $courseBody
    Write-Output "TEACHER_CREATE_COURSE $($teacherRes.status)"
  }
  catch {
    Write-Output "TEACHER_CREATE_COURSE_ERR $($_.Exception.Response.StatusCode.value__)"
  }

  try {
    $studentRes = Invoke-RestMethod -Method Post -Uri "$base/courses" -Headers @{ Authorization = "Bearer $studentToken" } -ContentType 'application/json' -Body $courseBody
    Write-Output "STUDENT_CREATE_COURSE_UNEXPECTED $($studentRes.status)"
  }
  catch {
    Write-Output "STUDENT_CREATE_COURSE_ERR $($_.Exception.Response.StatusCode.value__)"
  }
}
catch {
  Write-Output "ROLE_SMOKE_ERR"
}
