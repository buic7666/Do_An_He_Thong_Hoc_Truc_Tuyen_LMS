# E2E CLOZE test script

$uniqueSuffix = Get-Random -Maximum 1000000
$studentEmail = "e2e.student.$uniqueSuffix@lms.local"
$studentPassword = 'password123'

try {
  $registerBody = @{ name = 'E2E Student'; email = $studentEmail; password = $studentPassword; role = 'student' } | ConvertTo-Json
  $registerResp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method Post -Body $registerBody -ContentType 'application/json'
  $token = $registerResp.data.token
  Write-Output "Registered new student: $studentEmail"
} catch {
  $loginBody = @{ email = $studentEmail; password = $studentPassword } | ConvertTo-Json
  $loginResp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
  $token = $loginResp.data.token
  Write-Output "Logged in existing student: $studentEmail"
}

Write-Output "Token length: $($token.length)"

$headers = @{ Authorization = "Bearer $token" }
$quizId = 43

Write-Output "Fetching quiz $quizId"
$quiz = Invoke-RestMethod -Uri "http://localhost:5000/api/quizzes/$quizId" -Method Get -Headers $headers
$quizData = $quiz.data
Write-Output ($quizData | ConvertTo-Json -Compress)

$question = $quizData.questions[0]
$questionId = $question.id
Write-Output "Question ID in quiz: $questionId"

# Build sample answers for CLOZE inner questions
$inner = $question.metadata.inner_questions
$answerObj = @{}
foreach ($prop in $inner.psobject.properties.name) {
  if ($prop -eq 'q1') {
    $answerObj[$prop] = 'Ha Noi'
  } else {
    $answerObj[$prop] = "sample answer for $prop"
  }
}

Write-Output "Auto-saving answer"
$startResp = Invoke-RestMethod -Uri "http://localhost:5000/api/quizzes/$quizId/start" -Method Post -Headers $headers -Body '{}' -ContentType 'application/json'
Write-Output ("Started attempt: " + ($startResp | ConvertTo-Json -Compress))

$saveBody = @{ questionId = $questionId; answer = $answerObj } | ConvertTo-Json -Depth 5
$saveResp = Invoke-RestMethod -Uri "http://localhost:5000/api/quizzes/$quizId/save-answer" -Method Post -Headers $headers -Body $saveBody -ContentType 'application/json'
Write-Output ($saveResp | ConvertTo-Json -Compress)

Write-Output "Submitting quiz"
$submitBody = @{ answers = @{ } }
$submitBody.answers["$questionId"] = @{ type = 'CLOZE'; value = $answerObj }
$submitBodyJson = $submitBody | ConvertTo-Json -Depth 6
$submitResp = Invoke-RestMethod -Uri "http://localhost:5000/api/quizzes/$quizId/submit" -Method Post -Headers $headers -Body $submitBodyJson -ContentType 'application/json'
Write-Output ($submitResp | ConvertTo-Json -Compress)
